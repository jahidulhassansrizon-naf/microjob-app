export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB (WASM heap is 32-bit; see notes)
export const MIN_SPEED = 0.25;
export const MAX_SPEED = 4;
export const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const SUPPORTED_EXTENSIONS = ["mp4", "m4v", "mov", "webm", "mkv", "avi"] as const;

const SUPPORTED_MIME_TYPES = [
  "video/mp4",
  "video/x-m4v",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/x-msvideo",
] as const;

/** Value for <input accept>. Extensions are included because some browsers report an empty MIME type for .mov/.mkv. */
export const ACCEPT_ATTRIBUTE = [
  ...SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`),
  ...SUPPORTED_MIME_TYPES,
].join(",");

export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function getExtension(fileName: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  return match ? match[1].toLowerCase() : null;
}

/** Returns a user-facing error message, or null when the file is acceptable. */
export function validateVideoFile(file: File): string | null {
  if (file.size === 0) return "This file is empty.";

  const extension = getExtension(file.name);
  const extensionOk = extension !== null && (SUPPORTED_EXTENSIONS as readonly string[]).includes(extension);
  const mimeOk = (SUPPORTED_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase());

  if (!extensionOk && !mimeOk) {
    return `Unsupported format. Please choose a ${SUPPORTED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")} video.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `This video is ${formatSize(file.size)}. The limit is ${formatSize(MAX_FILE_SIZE)}.`;
  }
  return null;
}

export function clampSpeed(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, value));
  return Math.round(clamped * 100) / 100;
}

export function isNormalSpeed(speed: number): boolean {
  return Math.abs(speed - 1) < 0.001;
}

/**
 * `atempo` only accepts 0.5–2.0 per instance, so factors outside that range are
 * split into a chain whose product equals the requested speed.
 *   4    -> atempo=2.0,atempo=2.000000
 *   0.25 -> atempo=0.5,atempo=0.500000
 *   0.3  -> atempo=0.5,atempo=0.600000
 */
export function buildAtempoChain(speed: number): string {
  if (!Number.isFinite(speed) || speed <= 0) throw new RangeError(`Invalid speed: ${speed}`);

  const filters: string[] = [];
  let remaining = speed;

  while (remaining > 2) {
    filters.push("atempo=2.0");
    remaining /= 2;
  }
  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }
  filters.push(`atempo=${remaining.toFixed(6)}`);

  return filters.join(",");
}

export function buildSpeedArgs(inputName: string, outputName: string, speed: number): string[] {
  // (1 / SPEED) * PTS — video timestamps are scaled by the inverse of the speed.
  // The scale step forces even dimensions, which libx264 + yuv420p requires.
  const videoFilter = [`setpts=${(1 / speed).toFixed(8)}*PTS`, "scale=trunc(iw/2)*2:trunc(ih/2)*2"].join(",");

  // aresample=async=1 pads/trims tiny gaps after atempo so audio can't drift against video.
  const audioFilter = [buildAtempoChain(speed), "aresample=async=1"].join(",");

  return [
    "-i", inputName,
    "-map", "0:v:0",
    "-map", "0:a:0?", // optional: videos without audio still work
    "-vf", videoFilter,
    "-af", audioFilter,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-pix_fmt", "yuv420p", // 10-bit / 4:4:4 sources otherwise produce files browsers can't play
    "-c:a", "aac",
    "-b:a", "128k",
    "-sn", "-dn", // drop subtitle/data streams that MP4 can't always carry
    "-movflags", "+faststart",
    "-y",
    outputName,
  ];
}
