/** Shared wire-format helpers for the session-scoped rrweb Live DOM mirror. */
export const LIVE_DOM_EVENTS_TOPIC = "sohojhub-dom-events";
export const LIVE_DOM_CONTROL_TOPIC = "sohojhub-dom-control";

// Keep each encoded LiveKit DataPacket comfortably below the reliable packet limit.
// Identity batches are capped at 8 MiB => at most 1024 chunks of 8 KiB each.
export const LIVE_DOM_CHUNK_BYTES = 8 * 1024;
export const LIVE_DOM_MAX_CHUNKS = 1024;
export const LIVE_DOM_MAX_BATCH_BYTES = LIVE_DOM_CHUNK_BYTES * LIVE_DOM_MAX_CHUNKS;
export const LIVE_DOM_MAX_DECOMPRESSED_BYTES = 12 * 1024 * 1024; // legacy gzip batches only

export type LiveDomEncoding = "identity" | "gzip";

export function liveDomBytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.length, offset + 0x8000)));
  }
  return window.btoa(binary);
}

export function liveDomBase64ToBytes(value: string): Uint8Array {
  // Reject malformed base64 explicitly rather than letting a partial payload reach JSON/gzip.
  if (!value || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error("Invalid base64 in live DOM chunk.");
  }
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Fast non-cryptographic corruption check; this is not used for authentication. */
export function liveDomChecksum(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
