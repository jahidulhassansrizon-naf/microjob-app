"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import type { TemplateOrientation } from "./templateData";

export function LazyTemplateImage({
  src,
  alt,
  orientation,
  className = "",
}: {
  src: string;
  alt: string;
  orientation: TemplateOrientation;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [shouldLoad, setShouldLoad] = useState(false);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    const node = containerRef.current;

    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "350px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldLoad]);

  const aspectRatio =
    orientation === "Landscape"
      ? "4 / 3"
      : orientation === "Square"
        ? "1 / 1"
        : "4 / 5";

  return (
    <div
      ref={containerRef}
      className={`lazy-image-shell ${className}`}
      style={{ aspectRatio }}
    >
      {failed ? (
        <div
          className="lazy-image-placeholder lazy-image-failed"
          role="img"
          aria-label={alt}
        >
          <ImageIcon size={20} />
        </div>
      ) : shouldLoad ? (
        <img
          src={src}
          alt={alt}
          className="lazy-template-image"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="lazy-image-placeholder" aria-hidden="true">
          <div className="lazy-image-spinner" />
        </div>
      )}
    </div>
  );
}

