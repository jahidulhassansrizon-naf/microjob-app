"use client";
import React, { useEffect, useState } from "react";

/**
 * Shows a remote (Cloudinary) photo without exposing its address:
 *  - the file is downloaded once and shown from a private blob: URL, so "Open image in new tab"
 *    or "Copy image address" no longer reveals the Cloudinary link;
 *  - the right-click menu and dragging are switched off on the picture.
 * If the download fails for any reason, the normal image URL is used so the photo never breaks.
 * Local images (blob:/data:) are shown as they are.
 */
type ProtectedImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null };

const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function isLocal(src: string) {
  return !src || src.startsWith("blob:") || src.startsWith("data:");
}

export default function ProtectedImage({ src: rawSrc, onContextMenu, onDragStart, ...rest }: ProtectedImageProps) {
  const src = rawSrc || "";
  const [resolved, setResolved] = useState<string>(() => (isLocal(src) ? src : BLANK));

  useEffect(() => {
    if (isLocal(src)) {
      setResolved(src);
      return;
    }
    let cancelled = false;
    let objectUrl = "";
    setResolved(BLANK);
    (async () => {
      try {
        const response = await fetch(src, { mode: "cors", credentials: "omit" });
        if (!response.ok) throw new Error("Image download failed");
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResolved(objectUrl);
      } catch {
        if (!cancelled) setResolved(src);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={resolved || undefined}
      draggable={false}
      onContextMenu={(event) => { event.preventDefault(); onContextMenu?.(event); }}
      onDragStart={(event) => { event.preventDefault(); onDragStart?.(event); }}
    />
  );
}
