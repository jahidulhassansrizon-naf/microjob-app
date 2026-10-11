// Client-side helpers for the "reload without flicker" cache (see PrePaintScript.tsx).
// The head script READS this cache before first paint; DashboardNavbar / DashboardClient WRITE it
// after they have measured the real layout.
import { UI_CACHE_KEY } from "./PrePaintScript";

type UiCache = {
  nav?: Record<string, { vc: number; w: number; al: 0 | 1 }>;
  home?: Record<string, { w: number; h: number; s: number; top: number }>;
  lastHome?: { w: number; h: number; top: number };
};

function read(): UiCache {
  try {
    return JSON.parse(localStorage.getItem(UI_CACHE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function write(cache: UiCache) {
  try {
    localStorage.setItem(UI_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage is optional
  }
}

/** Trim an object used as a map so it can't grow forever (zoom levels, many pages). */
function trim<T>(map: Record<string, T>, max = 60) {
  const keys = Object.keys(map);
  if (keys.length <= max) return map;
  for (const key of keys.slice(0, keys.length - max)) delete map[key];
  return map;
}

export function currentLocaleKey() {
  return document.documentElement.lang === "bn" ? "bn" : "en";
}

export function saveNavLayout(
  pathname: string,
  entry: { vc: number; w: number; al: boolean },
) {
  const cw = document.documentElement.clientWidth;
  const key = `${pathname}|${cw}|${currentLocaleKey()}`;
  const cache = read();
  const nav = (cache.nav ??= {});
  const next = { vc: entry.vc, w: entry.w, al: (entry.al ? 1 : 0) as 0 | 1 };
  const prev = nav[key];
  if (prev && prev.vc === next.vc && prev.w === next.w && prev.al === next.al) return;
  delete nav[key];
  nav[key] = next;
  trim(nav);
  write(cache);
}

export function saveHomeLayout(view: {
  w: number;
  h: number;
  s: number;
  top: number;
}) {
  const key = `${document.documentElement.clientWidth}x${window.innerHeight}`;
  const cache = read();
  const home = (cache.home ??= {});
  const prev = home[key];
  if (
    prev &&
    prev.w === view.w &&
    prev.h === view.h &&
    prev.top === view.top &&
    Math.abs(prev.s - view.s) < 0.0005
  ) {
    return;
  }
  delete home[key];
  home[key] = view;
  trim(home);
  cache.lastHome = { w: view.w, h: view.h, top: view.top };
  write(cache);
}
