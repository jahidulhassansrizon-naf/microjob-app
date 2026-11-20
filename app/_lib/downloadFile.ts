/**
 * Force-download a (cross-origin) file such as a Cloudinary image.
 *
 * The HTML `download` attribute is ignored for cross-origin URLs, so a plain
 * <a href=cloudinary download> just opens the image in a new tab. Here we:
 *  1. fetch the file as a blob and save it with a filename (works with CORS), or
 *  2. fall back to Cloudinary's `fl_attachment` flag, which makes Cloudinary
 *     answer with Content-Disposition: attachment so the browser downloads it.
 */

function extFromUrl(url: string): string {
  try {
    const path = new URL(url, window.location.href).pathname;
    const m = path.match(/\.([a-zA-Z0-9]{2,5})$/);
    return m ? m[1].toLowerCase() : "jpg";
  } catch {
    return "jpg";
  }
}

function safeFileName(name: string | null | undefined, url: string): string {
  const ext = extFromUrl(url);
  const base = (name || "download")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "download";
  return /\.[a-zA-Z0-9]{2,5}$/.test(base) ? base : `${base}.${ext}`;
}

function withCloudinaryAttachment(url: string): string {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("fl_attachment")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}

function triggerAnchor(href: string, fileName?: string) {
  const a = document.createElement("a");
  a.href = href;
  if (fileName) a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadFile(
  url: string | null | undefined,
  name?: string | null,
): Promise<void> {
  if (!url) return;
  const fileName = safeFileName(name, url);

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerAnchor(objectUrl, fileName);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  } catch {
    // CORS/network problem: let Cloudinary send it as an attachment instead.
    triggerAnchor(withCloudinaryAttachment(url), fileName);
  }
}
