"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fit-to-screen wrapper for the desktop (lg+) layout.
 * The parent gives this box a fixed height (flex-1 / min-h-0). If the content is taller than that
 * height it is scaled down just enough to be fully visible, so no scrollbar is needed.
 * Below `minScale` it stops shrinking and the box scrolls instead, so nothing becomes unreadable.
 * On smaller screens (below lg) it does nothing and the page scrolls as usual.
 */
export default function FitToHeight({
  children,
  className = "",
  minScale = 0.6,
}: {
  children: ReactNode;
  className?: string;
  minScale?: number;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [needsScroll, setNeedsScroll] = useState(false);
  const scaleRef = useRef(1);
  const changes = useRef<number[]>([]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Debounced (250ms): while the panel updates many times a second (AI progress text, boxes opening)
    // nothing is measured; one measurement runs after things settle. This keeps the page responsive.
    const measure = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.hidden) return;
        if (!window.matchMedia("(min-width: 1024px)").matches) {
          scaleRef.current = 1;
          setScale(1);
          setNeedsScroll(false);
          return;
        }
        const avail = outer.clientHeight;
        const natural = inner.offsetHeight;
        if (!avail || !natural) return;
        const raw = Math.floor((avail / natural) * 20) / 20;
        const next = Math.max(minScale, Math.min(1, raw));
        setNeedsScroll(raw < minScale);
        const prev = scaleRef.current;
        if (next === prev) return;
        // Growing back needs a clear margin, and a runaway loop (many changes in 2s) is cut off,
        // so the page can never get stuck re-measuring itself.
        if (next > prev && next - prev < 0.1) return;
        const now = Date.now();
        changes.current = changes.current.filter((t) => now - t < 2000);
        if (changes.current.length >= 4) return;
        changes.current.push(now);
        scaleRef.current = next;
        setScale(next);
      }, 250);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    window.addEventListener("resize", measure);
    return () => {
      if (timer) clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [minScale]);

  return (
    <div
      ref={outerRef}
      className={`lg:min-h-0 lg:flex-1 ${needsScroll ? "lg:overflow-y-auto" : "lg:overflow-hidden"}`}
    >
      <div
        ref={innerRef}
        className={className}
        style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: "top left", width: `${100 / scale}%` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
