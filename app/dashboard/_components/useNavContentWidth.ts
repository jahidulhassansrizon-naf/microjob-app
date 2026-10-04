"use client";
import { useLayoutEffect, type RefObject } from "react";

export function useNavContentWidth(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) root.style.setProperty("--content-w", `${w}px`);
      window.dispatchEvent(new Event("sohozkaj:content-width"));
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener("resize", publish);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publish);
      root.style.removeProperty("--content-w");
      window.dispatchEvent(new Event("sohozkaj:content-width"));
    };
  }, [ref]);
}
