/**
 * Builds the request body for POST /api/upload.
 *
 * Sending an image as a base64 string inside JSON makes it ~33% bigger and forces the
 * server to parse a huge JSON string and decode it (CPU). A multipart FormData file is
 * streamed as binary, so the server does far less work. A data: URL is decoded here, in
 * the browser, and sent as a file. http(s) URLs keep the small JSON form (the server
 * fetches those itself). The server still accepts both formats.
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;,]+)?(;[^,]*)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || "application/octet-stream";
  const isBase64 = (match[2] || "").includes(";base64");
  try {
    if (isBase64) {
      const binary = atob(match[3]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(match[3])], { type: mime });
  } catch {
    return null;
  }
}

function extensionForMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

export function buildImageUploadRequest(image: string): { body: BodyInit; headers?: HeadersInit } {
  if (image.startsWith("data:")) {
    const blob = dataUrlToBlob(image);
    if (blob && blob.size > 0 && blob.type.startsWith("image/")) {
      const formData = new FormData();
      formData.append("file", blob, `upload-${Date.now()}.${extensionForMime(blob.type)}`);
      // No Content-Type header: the browser adds the multipart boundary itself.
      return { body: formData };
    }
  }
  // Fallback keeps the old behaviour (http(s) URLs, or anything we could not decode).
  return { body: JSON.stringify({ image }), headers: { "Content-Type": "application/json" } };
}
