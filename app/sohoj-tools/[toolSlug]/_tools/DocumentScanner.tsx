"use client";
import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Crop,
  Download,
  Printer,
  FileDown,
  RotateCw,
  RotateCcw,
  ImagePlus,
  Plus,
  Minus,
  X,
  Loader2,
  Columns,
  AlertCircle,
  Palette,
  Sparkles,
  Wand2,
  Check,
  Eye,
  Edit,
  Save,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Pen,
  Highlighter,
  Contrast,
  Square,
  Hand,
  Underline,
  MoreHorizontal,
  Frame,
  PenLine,
  Stamp,
} from "lucide-react";
import jsPDF from "jspdf";
import {
  enhanceCanvas,
  isEnhanceAbort,
  type EnhanceProgress,
} from "./realEsrganEngine";
import { cleanDocumentCanvas, isCleanAbort } from "./documentClean";
import { isColorAbort } from "./colorDocument";
import { detectDocumentCornersCv } from "./documentCorners";
declare global {
  interface Window {
    cv: any;
  }
}
interface Point {
  x: number;
  y: number;
}
interface SavedDocument {
  id: string;
  name: string;
  src: string;
  publicId: string;
  createdAt: string;
  updatedAt?: string;
}
const DEFAULT_CORNERS: Point[] = [
  { x: 10, y: 10 },
  { x: 90, y: 10 },
  { x: 90, y: 90 },
  { x: 10, y: 90 },
];
const OPENCV_SCRIPT_ID = "opencv-js";
const OPENCV_SCRIPT_URL = "https://docs.opencv.org/4.8.0/opencv.js";
// How long Auto crop waits for OpenCV.js (a few MB) before giving up.
const OPENCV_WAIT_TIMEOUT_MS = 60000;
function injectOpenCvScript(onLoad: () => void, onError: () => void) {
  const script = document.createElement("script");
  script.id = OPENCV_SCRIPT_ID;
  script.src = OPENCV_SCRIPT_URL;
  script.async = true;
  script.onload = onLoad;
  script.onerror = onError;
  document.body.appendChild(script);
}
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
// The editor works as a CHAIN: every action (Color, Magic Clean, Document
// Clean, Auto crop, Manual crop) is applied on top of the image that is on
// screen right now, exactly once. Nothing is re-processed just because a later
// step happened (e.g. cropping after Magic Clean does NOT run Magic Clean
// again). Each step remembers the state before it, so it can be undone.
// All tools (Color, Deblur, Document Clean) are available at any time, in any
// order. They run fully in the browser (see documentClean.ts).
// `enhance` (Magic Clean) is a pass counter: 0 = off, 1 = applied once,
// 2 = "Again Magic Clean" pressed once more on top of the previous result...
type EffectKey = "color" | "clean" | "enhance";
type Effects = {
  color: boolean;
  clean: boolean;
  enhance: number;
};
type DocToolKind = "invert" | "straighten";
type StepKind =
  | EffectKey
  | "autoCrop"
  | "manualCrop"
  | "erase"
  | DocToolKind;
// The state right before a step ran. Restoring it undoes that step.
type Snapshot = {
  original: string; // effect-free image ("Normal" in the compare view)
  processed: string; // image with every effect so far
  effects: Effects;
  bakedRotation: number;
  autoCrop: boolean;
};
type HistoryEntry = {
  step: StepKind;
  prev: Snapshot;
};
const MAX_HISTORY = 8;
const STEP_LABELS: Record<StepKind, string> = {
  color: "Color Document",
  enhance: "Fix Blur",
  clean: "Document Clean",
  autoCrop: "Auto crop",
  manualCrop: "Manual crop",
  erase: "Eraser / Pen",
  invert: "Invert colors",
  straighten: "Straighten page",
};
const NO_EFFECTS: Effects = { color: false, clean: false, enhance: 0 };
// Every effect (Color Document, Magic Clean, Document Clean) and both crops run
// in the browser. No image is ever sent to a server for processing.
const ENHANCE_LABEL = "Fix Blur";
// How many times Magic Clean can be stacked with "Again Magic Clean".
const MAX_ENHANCE_PASSES = 3;
// Every pass upscales 2x; keep the result at A4 @300dpi size at most so
// repeated passes do not run the device out of memory.
const MAX_ENHANCE_SIDE = 3508;
const capCanvasSize = (
  canvas: HTMLCanvasElement,
  maxSide: number,
): HTMLCanvasElement => {
  const longest = Math.max(canvas.width, canvas.height);
  if (longest <= maxSide) return canvas;
  const ratio = maxSide / longest;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(canvas.width * ratio));
  out.height = Math.max(1, Math.round(canvas.height * ratio));
  const ctx = out.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
};
const hasAnyEffect = (e: Effects): boolean =>
  e.color || e.clean || e.enhance > 0;

/* -------------------------------------------------------------------------- */
/*                               Eraser engine                                */
/* -------------------------------------------------------------------------- */
// The eraser paints over writing / marks with the colour of the paper right
// around the brush, so the result looks like clean paper (not a white blob).
// Strokes are stored as fractions (0..1) of the image, so the very same stroke
// can be painted on the preview canvas AND on the real image canvas, and can
// be replayed for "undo last stroke".
const ERASER_MIN_FRAC = 0.004; // smallest brush radius (fraction of width)
const ERASER_SPAN_FRAC = 0.05; // extra radius reached at slider = 100
type BrushTool =
  | "erase"
  | "pen"
  | "highlight"
  | "redact"
  | "dots" // dotted line (....) dragged from point A to point B
  | "underline" // solid underline dragged from point A to point B
  | "border" // a decorative border drawn around a dragged box
  | "write" // typed text drawn like real handwriting inside a dragged box
  | "punct" // one punctuation mark (danda, comma, ;, ...) placed with a click
  | "stamp" // removes coloured stamps / seals from the paper
  | "recolor" // brings the colour of a stamp back (original or a chosen colour)
  | "seal"; // a ready-made seal template with editable text
type FractionRect = { x0: number; y0: number; x1: number; y1: number };
type EraseStroke = {
  pts: Point[];
  r: number;
  tool: BrushTool;
  color: string;
  rect?: FractionRect; // "select area" mode: one box instead of a free line
  style?: string; // border style key (tool "border") / handwriting style key
  // Handwriting ("write") only:
  text?: string;
  sizeMul?: number; // 0.4 .. 1 of the size that fills the box
  seed?: number; // fixed random seed so a replay looks exactly the same
  clearFirst?: boolean; // wipe the old text inside the box before writing
  // Stamp remover only:
  lasso?: boolean; // pts is a closed outline drawn around the stamp
  strength?: number; // 10 .. 100, how strongly faint colour is removed
  tint?: string | null; // recolor only: new seal colour (null = keep original colour)
  // Seal tool only (style = seal template key, text = centre text, color = ink):
  sealTop?: string;
  sealBottom?: string;
  sealFont?: string;
  sealRot?: number; // degrees
  sealInk?: number; // 0.3 .. 1
  sealWear?: number; // 0 .. 1 (old / worn ink)
  sealOwnColor?: boolean;
};
// Colours that real office / school / court seals are stamped with.
const SEAL_COLORS = [
  "#1E3A9F", // stamp-pad blue
  "#2A2F7F", // indigo / violet-blue
  "#0F1F5C", // navy
  "#C62828", // red
  "#8B1E2D", // maroon
  "#6B2D8F", // purple
  "#166534", // green
  "#7A4B2A", // sepia / brown
  "#1A1A1A", // black
];
const hexToRgb = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const PEN_COLORS = ["#111111", "#1D4ED8", "#DC2626"];
// Real highlighter-pen shades: light and bright, so the text underneath stays
// easy to read (the old #FDE047 looked dark / orange on paper).
const HIGHLIGHT_COLORS = ["#FFF176", "#A5F3A0", "#FFB3DA", "#8FDBFF"];
const MIN_ZOOM = 50;
const MAX_ZOOM = 800;
const clampZoom = (z: number): number =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
const brushRadiusFrac = (tool: BrushTool, size: number): number => {
  if (tool === "pen") return 0.0012 + (size / 100) * 0.012;
  if (tool === "dots" || tool === "underline")
    return 0.0004 + (size / 100) * 0.0025;
  if (tool === "border") return 0.0006 + (size / 100) * 0.003;
  if (tool === "highlight") return 0.006 + (size / 100) * 0.03;
  return ERASER_MIN_FRAC + (size / 100) * ERASER_SPAN_FRAC;
};
const samplePaperColor = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): string => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const win = Math.max(radius * 2, 16);
  const x0 = Math.max(0, Math.floor(cx - win));
  const y0 = Math.max(0, Math.floor(cy - win));
  const x1 = Math.min(w, Math.ceil(cx + win));
  const y1 = Math.min(h, Math.ceil(cy + win));
  const sw = x1 - x0;
  const sh = y1 - y0;
  if (sw <= 0 || sh <= 0) return "rgb(255,255,255)";
  const data = ctx.getImageData(x0, y0, sw, sh).data;
  const step = Math.max(1, Math.floor(Math.max(sw, sh) / 40));
  const samples: { l: number; r: number; g: number; b: number }[] = [];
  for (let y = 0; y < sh; y += step) {
    for (let x = 0; x < sw; x += step) {
      const i = (y * sw + x) * 4;
      if (data[i + 3] < 10) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      samples.push({ l: 0.299 * r + 0.587 * g + 0.114 * b, r, g, b });
    }
  }
  if (samples.length === 0) return "rgb(255,255,255)";
  // Paper = the brightest part of the neighbourhood (ink is darker).
  samples.sort((a, b) => b.l - a.l);
  const take = Math.max(1, Math.round(samples.length * 0.35));
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < take; i++) {
    r += samples[i].r;
    g += samples[i].g;
    b += samples[i].b;
  }
  return `rgb(${Math.round(r / take)},${Math.round(g / take)},${Math.round(b / take)})`;
};
const drawEraseSegments = (
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  radiusFrac: number,
  startIndex: number,
  tool: BrushTool,
  paintColor: string,
) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const rPx = Math.max(1, radiusFrac * w);
  const feather = tool === "erase" ? Math.min(rPx * 0.35, 10) : 0;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = rPx * 2;
  // "darken" never stacks: a highlighter stroke keeps the same colour even
  // where it overlaps itself, and black text stays black under it.
  if (tool === "highlight") ctx.globalCompositeOperation = "darken";
  for (let i = Math.max(0, startIndex); i < pts.length; i++) {
    const b = pts[i];
    const bx = b.x * w;
    const by = b.y * h;
    const color =
      tool === "erase" ? samplePaperColor(ctx, bx, by, rPx) : paintColor;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = feather;
    ctx.beginPath();
    if (i === 0) {
      ctx.arc(bx, by, rPx, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const a = pts[i - 1];
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
  }
  ctx.restore();
};

/* -------------------------------------------------------------------------- */
/*                               Stamp remover                                */
/* -------------------------------------------------------------------------- */
// Removes coloured stamps / seals (blue, red, purple ... ink) from the paper
// inside the area the person marked. It works on colour, like the Photoshop
// trick: the paper colour is estimated all around the area, every pixel that
// is clearly "coloured" compared to that paper is turned back into paper, and
// black text that lies under the stamp is kept (only its colour tint goes).
const stampSmooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Paper colour on a coarse grid: the brightest part of each neighbourhood.
const buildPaperAt = (data: Uint8ClampedArray, pw: number, ph: number) => {
  const T = Math.max(8, Math.round(Math.max(pw, ph) / 18));
  const gx = Math.ceil(pw / T);
  const gy = Math.ceil(ph / T);
  const paper = new Float32Array(gx * gy * 3);
  for (let j = 0; j < gy; j++) {
    for (let i = 0; i < gx; i++) {
      const wx0 = Math.max(0, Math.round((i - 1.5) * T));
      const wy0 = Math.max(0, Math.round((j - 1.5) * T));
      const wx1 = Math.min(pw, Math.round((i + 2.5) * T));
      const wy1 = Math.min(ph, Math.round((j + 2.5) * T));
      const step = Math.max(1, Math.floor(Math.max(wx1 - wx0, wy1 - wy0) / 24));
      const samples: number[][] = [];
      for (let y = wy0; y < wy1; y += step) {
        for (let x = wx0; x < wx1; x += step) {
          const k = (y * pw + x) * 4;
          if (data[k + 3] < 10) continue;
          const r = data[k];
          const g = data[k + 1];
          const b = data[k + 2];
          samples.push([0.299 * r + 0.587 * g + 0.114 * b, r, g, b]);
        }
      }
      let pr = 255;
      let pg = 255;
      let pb = 255;
      if (samples.length > 0) {
        samples.sort((u, v) => v[0] - u[0]);
        const take = Math.max(1, Math.round(samples.length * 0.35));
        pr = 0;
        pg = 0;
        pb = 0;
        for (let t = 0; t < take; t++) {
          pr += samples[t][1];
          pg += samples[t][2];
          pb += samples[t][3];
        }
        pr /= take;
        pg /= take;
        pb /= take;
      }
      const o = (j * gx + i) * 3;
      paper[o] = Math.max(60, pr);
      paper[o + 1] = Math.max(60, pg);
      paper[o + 2] = Math.max(60, pb);
    }
  }
  return (x: number, y: number, out: number[]) => {
    const fx = Math.min(gx - 1, Math.max(0, (x + 0.5) / T - 0.5));
    const fy = Math.min(gy - 1, Math.max(0, (y + 0.5) / T - 0.5));
    const ix = Math.min(gx - 1, Math.floor(fx));
    const iy = Math.min(gy - 1, Math.floor(fy));
    const jx = Math.min(gx - 1, ix + 1);
    const jy = Math.min(gy - 1, iy + 1);
    const tx = fx - ix;
    const ty = fy - iy;
    for (let c = 0; c < 3; c++) {
      const u = paper[(iy * gx + ix) * 3 + c];
      const v = paper[(iy * gx + jx) * 3 + c];
      const d = paper[(jy * gx + ix) * 3 + c];
      const e = paper[(jy * gx + jx) * 3 + c];
      out[c] = (u * (1 - tx) + v * tx) * (1 - ty) + (d * (1 - tx) + e * tx) * ty;
    }
  };
};
// Grows every "stamp" pixel by R pixels (the cleaned page draws strokes a bit
// thicker than the coloured original).
const dilateStampMap = (
  src: Float32Array,
  pw: number,
  ph: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  R: number,
): Float32Array => {
  const tmp = new Float32Array(pw * ph);
  const out = new Float32Array(pw * ph);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let m = 0;
      for (let dx = -R; dx <= R; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= pw) continue;
        const v = src[y * pw + xx];
        if (v > m) m = v;
      }
      tmp[y * pw + x] = m;
    }
  }
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let m = 0;
      for (let dy = -R; dy <= R; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= ph) continue;
        const v = tmp[yy * pw + x];
        if (v > m) m = v;
      }
      out[y * pw + x] = m;
    }
  }
  return out;
};
// colorCtx (optional): the coloured original of the same page. The preview
// shows the cleaned (black & white) page, where a stamp is just a black blob.
// The stamp is found in the coloured original and then wiped from the preview.
const removeStampInRegion = (
  ctx: CanvasRenderingContext2D,
  bx0: number,
  by0: number,
  bx1: number,
  by1: number,
  drawMask: (m: CanvasRenderingContext2D, ox: number, oy: number) => void,
  strength: number,
  colorCtx?: CanvasRenderingContext2D | null,
  mode: "remove" | "recolor" = "remove",
  tint: string | null = null,
) => {
  const tintRgb = tint ? hexToRgb(tint) : null;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const x0 = Math.max(0, Math.floor(bx0));
  const y0 = Math.max(0, Math.floor(by0));
  const x1 = Math.min(W, Math.ceil(bx1));
  const y1 = Math.min(H, Math.ceil(by1));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w < 2 || h < 2) return;
  // Look at some paper around the area too, so the paper colour is known even
  // when the whole marked area is covered by the stamp.
  const pad = Math.round(Math.max(30, Math.max(w, h) * 0.6));
  const px0 = Math.max(0, x0 - pad);
  const py0 = Math.max(0, y0 - pad);
  const px1 = Math.min(W, x1 + pad);
  const py1 = Math.min(H, y1 + pad);
  const pw = px1 - px0;
  const ph = py1 - py0;
  const img = ctx.getImageData(px0, py0, pw, ph);
  const data = img.data;

  // Colour source: the page itself, or the coloured original (other canvas).
  let cdata: Uint8ClampedArray = data;
  let displayMode = false;
  if (colorCtx && colorCtx.canvas !== ctx.canvas) {
    const tmp = document.createElement("canvas");
    tmp.width = pw;
    tmp.height = ph;
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    if (tctx) {
      const kx = colorCtx.canvas.width / W;
      const ky = colorCtx.canvas.height / H;
      tctx.drawImage(colorCtx.canvas, px0 * kx, py0 * ky, pw * kx, ph * ky, 0, 0, pw, ph);
      cdata = tctx.getImageData(0, 0, pw, ph).data;
      displayMode = true;
    }
  }
  if (mode === "recolor" && !displayMode && !tintRgb) return;

  // Mask of the marked area (soft edge so the result blends in).
  const mc = document.createElement("canvas");
  mc.width = pw;
  mc.height = ph;
  const mctx = mc.getContext("2d", { willReadFrequently: true });
  if (!mctx) return;
  try {
    mctx.filter = "blur(1px)";
  } catch {
    /* older browsers: hard edge is fine */
  }
  mctx.fillStyle = "#ffffff";
  mctx.strokeStyle = "#ffffff";
  drawMask(mctx, px0, py0);
  const mask = mctx.getImageData(0, 0, pw, ph).data;

  const paperC = buildPaperAt(cdata, pw, ph);
  // How coloured a pixel must be (compared with the paper) to count as stamp.
  const hi = 0.3 - 0.2 * (Math.min(100, Math.max(10, strength)) / 100);
  const lo = hi * 0.4;
  const pp = [255, 255, 255];
  const ax0 = x0 - px0;
  const ay0 = y0 - py0;

  if (!displayMode && mode === "recolor" && tintRgb) {
    // The page still has its own colours: shift every stamp-coloured pixel to
    // the chosen colour. Ink strength (how dark it is) is kept, black text stays.
    for (let y = ay0; y < ay0 + h; y++) {
      for (let x = ax0; x < ax0 + w; x++) {
        const k = (y * pw + x) * 4;
        const m = mask[k + 3] / 255;
        if (m < 0.02 || data[k + 3] < 10) continue;
        paperC(x, y, pp);
        const nr = Math.min(1, data[k] / pp[0]);
        const ng = Math.min(1, data[k + 1] / pp[1]);
        const nb = Math.min(1, data[k + 2] / pp[2]);
        const c = Math.max(nr, ng, nb) - Math.min(nr, ng, nb);
        const sv = stampSmooth(lo * 0.6, hi * 0.8, c) * m;
        if (sv < 0.02) continue;
        const lum = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2];
        const plum = 0.299 * pp[0] + 0.587 * pp[1] + 0.114 * pp[2];
        const dk = Math.min(1, Math.max(0, 1 - lum / plum) * 1.6 + 0.12);
        // Multiply the paper colour with the ink colour (like a real stamp).
        const tr = pp[0] * (1 - dk) + (pp[0] * tintRgb[0]) / 255 * dk;
        const tg = pp[1] * (1 - dk) + (pp[1] * tintRgb[1]) / 255 * dk;
        const tb = pp[2] * (1 - dk) + (pp[2] * tintRgb[2]) / 255 * dk;
        data[k] = data[k] * (1 - sv) + tr * sv;
        data[k + 1] = data[k + 1] * (1 - sv) + tg * sv;
        data[k + 2] = data[k + 2] * (1 - sv) + tb * sv;
      }
    }
  } else if (!displayMode) {
    for (let y = ay0; y < ay0 + h; y++) {
      for (let x = ax0; x < ax0 + w; x++) {
        const k = (y * pw + x) * 4;
        const m = mask[k + 3] / 255;
        if (m < 0.02 || data[k + 3] < 10) continue;
        paperC(x, y, pp);
        const nr = Math.min(1, data[k] / pp[0]);
        const ng = Math.min(1, data[k + 1] / pp[1]);
        const nb = Math.min(1, data[k + 2] / pp[2]);
        const c = Math.max(nr, ng, nb) - Math.min(nr, ng, nb);
        const sv = stampSmooth(lo, hi, c); // 1 = surely stamp ink
        const d = stampSmooth(0.02, 0.1, c); // leftover tint -> grey
        const mean = (nr + ng + nb) / 3;
        const vr = (nr * (1 - d) + mean * d) * (1 - sv) + sv;
        const vg = (ng * (1 - d) + mean * d) * (1 - sv) + sv;
        const vb = (nb * (1 - d) + mean * d) * (1 - sv) + sv;
        data[k] = data[k] * (1 - m) + vr * pp[0] * m;
        data[k + 1] = data[k + 1] * (1 - m) + vg * pp[1] * m;
        data[k + 2] = data[k + 2] * (1 - m) + vb * pp[2] * m;
      }
    }
  } else {
    // Cleaned page: wipe the places where the coloured original has a stamp.
    // Recolouring writing needs a wider reach than wiping a stamp does.
    const R = mode === "recolor" ? 4 : 2;
    const sMap = new Float32Array(pw * ph);
    const cMap = new Float32Array(pw * ph);
    const ex0 = Math.max(0, ax0 - R);
    const ey0 = Math.max(0, ay0 - R);
    const ex1 = Math.min(pw, ax0 + w + R);
    const ey1 = Math.min(ph, ay0 + h + R);
    for (let y = ey0; y < ey1; y++) {
      for (let x = ex0; x < ex1; x++) {
        const k = (y * pw + x) * 4;
        paperC(x, y, pp);
        const nr = Math.min(1, cdata[k] / pp[0]);
        const ng = Math.min(1, cdata[k + 1] / pp[1]);
        const nb = Math.min(1, cdata[k + 2] / pp[2]);
        const c = Math.max(nr, ng, nb) - Math.min(nr, ng, nb);
        cMap[y * pw + x] = c;
        sMap[y * pw + x] = stampSmooth(lo, hi, c);
      }
    }
    // With a chosen colour every bit of ink in the marked area gets it, so the
    // colour of the original does not need to be searched for.
    if (mode === "recolor" && !tintRgb) {
      // A faded stamp has only a little colour. Look at how coloured the
      // strongest pixels of the marked area are and set the limit from that.
      const vals: number[] = [];
      for (let y = ay0; y < ay0 + h; y++) {
        for (let x = ax0; x < ax0 + w; x++) {
          if (mask[(y * pw + x) * 4 + 3] > 128) vals.push(cMap[y * pw + x]);
        }
      }
      if (vals.length < 5) return;
      vals.sort((u, v) => u - v);
      const top = vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.98))];
      if (top < 0.02) return; // the original has no colour here at all
      const thr = Math.max(0.02, Math.min(hi, top * 0.4));
      for (let y = ey0; y < ey1; y++) {
        for (let x = ex0; x < ex1; x++) {
          sMap[y * pw + x] = stampSmooth(thr * 0.4, thr, cMap[y * pw + x]);
        }
      }
    }
    const grown = dilateStampMap(sMap, pw, ph, ex0, ey0, ex1, ey1, R);
    const paperT = buildPaperAt(data, pw, ph);
    const tp = [255, 255, 255];
    if (mode === "recolor") {
      // Average colour of the stamp ink found in the coloured original.
      let ar = 0;
      let ag = 0;
      let ab = 0;
      let cnt = 0;
      for (let y = ay0; y < ay0 + h; y++) {
        for (let x = ax0; x < ax0 + w; x++) {
          const k = (y * pw + x) * 4;
          if (sMap[y * pw + x] > 0.8 && mask[k + 3] > 128) {
            ar += cdata[k];
            ag += cdata[k + 1];
            ab += cdata[k + 2];
            cnt++;
          }
        }
      }
      if (cnt >= 5 || tintRgb) {
        if (cnt > 0) {
          ar /= cnt;
          ag /= cnt;
          ab /= cnt;
        }
        if (tintRgb) {
          ar = tintRgb[0];
          ag = tintRgb[1];
          ab = tintRgb[2];
        }
        for (let y = ay0; y < ay0 + h; y++) {
          for (let x = ax0; x < ax0 + w; x++) {
            const k = (y * pw + x) * 4;
            // Chosen colour: the whole marked area counts. Original colour:
            // only the places where the original really has colour.
            const m = (mask[k + 3] / 255) * (tintRgb ? 1 : grown[y * pw + x]);
            if (m < 0.02 || data[k + 3] < 10) continue;
            paperT(x, y, tp);
            const lum = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2];
            const plum = 0.299 * tp[0] + 0.587 * tp[1] + 0.114 * tp[2];
            // The darker the cleaned pixel, the more ink it gets. For a chosen
            // colour even the soft edge of a thin stroke is filled completely,
            // while the white paper between the letters stays untouched.
            const dark = Math.max(0, 1 - lum / plum);
            const dk = tintRgb
              ? stampSmooth(0.03, 0.4, dark)
              : Math.min(1, dark * 1.8);
            let ir = ar;
            let ig = ag;
            let ib = ab;
            if (sMap[y * pw + x] > 0.6 && !tintRgb) {
              ir = cdata[k];
              ig = cdata[k + 1];
              ib = cdata[k + 2];
            }
            data[k] = data[k] * (1 - m) + (tp[0] * (1 - dk) + ir * dk) * m;
            data[k + 1] = data[k + 1] * (1 - m) + (tp[1] * (1 - dk) + ig * dk) * m;
            data[k + 2] = data[k + 2] * (1 - m) + (tp[2] * (1 - dk) + ib * dk) * m;
          }
        }
      }
    } else {
      for (let y = ay0; y < ay0 + h; y++) {
        for (let x = ax0; x < ax0 + w; x++) {
          const k = (y * pw + x) * 4;
          const m = (mask[k + 3] / 255) * grown[y * pw + x];
          if (m < 0.02 || data[k + 3] < 10) continue;
          paperT(x, y, tp);
          data[k] = data[k] * (1 - m) + tp[0] * m;
          data[k + 1] = data[k + 1] * (1 - m) + tp[1] * m;
          data[k + 2] = data[k + 2] * (1 - m) + tp[2] * m;
        }
      }
    }
  }
  ctx.putImageData(img, px0, py0);
};
const paintStampStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: EraseStroke,
  fromIndex: number,
  colorCtx?: CanvasRenderingContext2D | null,
) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const strength = stroke.strength ?? 50;
  if (stroke.rect) {
    if (fromIndex !== 0) return;
    const r = stroke.rect;
    removeStampInRegion(
      ctx,
      r.x0 * w,
      r.y0 * h,
      r.x1 * w,
      r.y1 * h,
      (m, ox, oy) => {
        m.fillRect(r.x0 * w - ox, r.y0 * h - oy, (r.x1 - r.x0) * w, (r.y1 - r.y0) * h);
      },
      strength,
      colorCtx,
      stroke.tool === "recolor" ? "recolor" : "remove",
      stroke.tool === "recolor" ? (stroke.tint ?? null) : null,
    );
    return;
  }
  if (stroke.pts.length === 0) return;
  if (stroke.lasso) {
    if (fromIndex !== 0 || stroke.pts.length < 3) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of stroke.pts) {
      minX = Math.min(minX, p.x * w);
      minY = Math.min(minY, p.y * h);
      maxX = Math.max(maxX, p.x * w);
      maxY = Math.max(maxY, p.y * h);
    }
    removeStampInRegion(
      ctx,
      minX - 2,
      minY - 2,
      maxX + 2,
      maxY + 2,
      (m, ox, oy) => {
        m.beginPath();
        stroke.pts.forEach((p, i) => {
          if (i === 0) m.moveTo(p.x * w - ox, p.y * h - oy);
          else m.lineTo(p.x * w - ox, p.y * h - oy);
        });
        m.closePath();
        m.fill();
        m.lineWidth = 2;
        m.lineJoin = "round";
        m.stroke();
      },
      strength,
      colorCtx,
      stroke.tool === "recolor" ? "recolor" : "remove",
      stroke.tool === "recolor" ? (stroke.tint ?? null) : null,
    );
    return;
  }
  // Free hand: only the newly added part of the line is processed.
  const rPx = Math.max(2, stroke.r * w);
  const start = Math.max(0, fromIndex - 1);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = start; i < stroke.pts.length; i++) {
    minX = Math.min(minX, stroke.pts[i].x * w);
    minY = Math.min(minY, stroke.pts[i].y * h);
    maxX = Math.max(maxX, stroke.pts[i].x * w);
    maxY = Math.max(maxY, stroke.pts[i].y * h);
  }
  removeStampInRegion(
    ctx,
    minX - rPx - 2,
    minY - rPx - 2,
    maxX + rPx + 2,
    maxY + rPx + 2,
    (m, ox, oy) => {
      m.lineCap = "round";
      m.lineJoin = "round";
      m.lineWidth = rPx * 2;
      for (let i = Math.max(0, fromIndex); i < stroke.pts.length; i++) {
        const b = stroke.pts[i];
        m.beginPath();
        if (i === 0) {
          m.arc(b.x * w - ox, b.y * h - oy, rPx, 0, Math.PI * 2);
          m.fill();
        } else {
          const a = stroke.pts[i - 1];
          m.moveTo(a.x * w - ox, a.y * h - oy);
          m.lineTo(b.x * w - ox, b.y * h - oy);
          m.stroke();
        }
      }
    },
    strength,
    colorCtx,
    stroke.tool === "recolor" ? "recolor" : "remove",
      stroke.tool === "recolor" ? (stroke.tint ?? null) : null,
  );
};

/* -------------------------------------------------------------------------- */
/*                             Decorative borders                             */
/* -------------------------------------------------------------------------- */
// Many border designs. The person picks one, drags a box, and the border is
// drawn exactly around that box (so it can be put back after erasing it).
type BorderStyleKey =
  | "single"
  | "thick"
  | "double"
  | "thickThin"
  | "triple"
  | "rounded"
  | "dashed"
  | "dashDot"
  | "dotted"
  | "wavy"
  | "zigzag"
  | "scallop"
  | "chain"
  | "corners"
  | "squares"
  | "certBand"
  | "checkerBand"
  | "greekKey"
  | "railroad"
  | "beads"
  | "diamonds"
  | "stars"
  | "triangles"
  | "notched"
  | "ticket"
  | "dashedDouble"
  | "dotLine"
  | "diagonal"
  | "arches"
  | "waveDouble"
  | "circleCorners"
  | "doubleRounded"
  | "thinThick"
  | "thickThinThick"
  | "cornerDiamonds"
  | "crosses";
const BORDER_STYLES: { key: BorderStyleKey; label: string }[] = [
  { key: "single", label: "Line" },
  { key: "thick", label: "Thick" },
  { key: "double", label: "Double" },
  { key: "thickThin", label: "Thick + thin" },
  { key: "triple", label: "Triple" },
  { key: "rounded", label: "Rounded" },
  { key: "dashed", label: "Dashed" },
  { key: "dashDot", label: "Dash-dot" },
  { key: "dotted", label: "Dotted" },
  { key: "wavy", label: "Wave" },
  { key: "zigzag", label: "Zigzag" },
  { key: "scallop", label: "Scallop" },
  { key: "chain", label: "Chain" },
  { key: "corners", label: "Corners" },
  { key: "squares", label: "Squares" },
  { key: "certBand", label: "Certificate" },
  { key: "checkerBand", label: "Checker band" },
  { key: "greekKey", label: "Greek key" },
  { key: "railroad", label: "Railroad" },
  { key: "beads", label: "Beads" },
  { key: "diamonds", label: "Diamonds" },
  { key: "stars", label: "Stars" },
  { key: "triangles", label: "Sawtooth" },
  { key: "notched", label: "Cut corners" },
  { key: "ticket", label: "Ticket" },
  { key: "dashedDouble", label: "Solid + dashed" },
  { key: "dotLine", label: "Line + dots" },
  { key: "diagonal", label: "Diagonal band" },
  { key: "arches", label: "Arches" },
  { key: "waveDouble", label: "Wave band" },
  { key: "circleCorners", label: "Round knobs" },
  { key: "doubleRounded", label: "Double rounded" },
  { key: "thinThick", label: "Thin + thick" },
  { key: "thickThinThick", label: "Thick-thin-thick" },
  { key: "cornerDiamonds", label: "Corner diamonds" },
  { key: "crosses", label: "Crosses" },
];
// Draws one border inside the box (x0,y0)-(x1,y1). `t` = base line thickness
// in pixels. The border never goes outside the box.
const drawBorderPx = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  t: number,
  style: BorderStyleKey,
  color: string,
) => {
  const rw = x1 - x0;
  const rh = y1 - y0;
  if (rw < 2 || rh < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";
  ctx.setLineDash([]);
  // A plain / rounded rectangle line whose OUTER edge sits `inset` px inside.
  const box = (inset: number, lw: number, round = 0) => {
    const a = x0 + inset + lw / 2;
    const b = y0 + inset + lw / 2;
    const c = x1 - inset - lw / 2;
    const d = y1 - inset - lw / 2;
    if (c - a < 1 || d - b < 1) return;
    ctx.lineWidth = lw;
    if (round > 0) {
      const r = Math.min(round, (c - a) / 2, (d - b) / 2);
      ctx.beginPath();
      ctx.moveTo(a + r, b);
      ctx.lineTo(c - r, b);
      ctx.arcTo(c, b, c, b + r, r);
      ctx.lineTo(c, d - r);
      ctx.arcTo(c, d, c - r, d, r);
      ctx.lineTo(a + r, d);
      ctx.arcTo(a, d, a, d - r, r);
      ctx.lineTo(a, b + r);
      ctx.arcTo(a, b, a + r, b, r);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(a, b, c - a, d - b);
    }
  };
  // The four sides of a rectangle, walked clockwise. Outward normal of a side
  // with direction (ux,uy) is (uy,-ux).
  const sides = (m: number) => {
    const a = x0 + m;
    const b = y0 + m;
    const c = x1 - m;
    const d = y1 - m;
    return [
      { x: a, y: b, ux: 1, uy: 0, len: c - a },
      { x: c, y: b, ux: 0, uy: 1, len: d - b },
      { x: c, y: d, ux: -1, uy: 0, len: c - a },
      { x: a, y: d, ux: 0, uy: -1, len: d - b },
    ];
  };
  const tooSmall = rw < t * 12 || rh < t * 12;
  if (tooSmall && style !== "thick") style = "single";

  // ---- helpers for the extra border designs ----
  type BSide = { x: number; y: number; ux: number; uy: number; len: number };
  // Put one item at even steps along every side. `m` = distance of the item
  // line from the outer edge, `ref` is used to count the items per side.
  const along = (
    m: number,
    spacing: number,
    ref: number,
    cb: (px: number, py: number, sd: BSide, i: number) => void,
  ) => {
    const refSides = sides(ref);
    sides(m).forEach((sd, si) => {
      const k = Math.max(1, Math.round(refSides[si].len / spacing));
      for (let i = 0; i < k; i++) {
        const s0 = (sd.len * i) / k;
        cb(sd.x + sd.ux * s0, sd.y + sd.uy * s0, sd, i);
      }
    });
  };
  const line2 = (ax: number, ay: number, bx: number, by: number, lw: number) => {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  };
  const diamond = (px: number, py: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(px, py - r);
    ctx.lineTo(px + r, py);
    ctx.lineTo(px, py + r);
    ctx.lineTo(px - r, py);
    ctx.closePath();
    ctx.fill();
  };
  const star5 = (px: number, py: number, R: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? R * 0.45 : R;
      const qx = px + Math.cos(ang) * rr;
      const qy = py + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(qx, qy);
      else ctx.lineTo(qx, qy);
    }
    ctx.closePath();
    ctx.fill();
  };
  // Rectangle with the four corners cut off.
  const cham = (inset: number, lw: number, cut: number) => {
    const a = x0 + inset + lw / 2;
    const b = y0 + inset + lw / 2;
    const c = x1 - inset - lw / 2;
    const d = y1 - inset - lw / 2;
    const k = Math.min(cut, (c - a) / 2, (d - b) / 2);
    if (c - a < 1 || d - b < 1) return;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(a + k, b);
    ctx.lineTo(c - k, b);
    ctx.lineTo(c, b + k);
    ctx.lineTo(c, d - k);
    ctx.lineTo(c - k, d);
    ctx.lineTo(a + k, d);
    ctx.lineTo(a, d - k);
    ctx.lineTo(a, b + k);
    ctx.closePath();
    ctx.stroke();
  };
  // Rectangle with the four corners bitten out by quarter circles.
  const ticketBox = (inset: number, lw: number, R0: number) => {
    const a = x0 + inset + lw / 2;
    const b = y0 + inset + lw / 2;
    const c = x1 - inset - lw / 2;
    const d = y1 - inset - lw / 2;
    const R = Math.min(R0, (c - a) / 2, (d - b) / 2);
    if (c - a < 1 || d - b < 1) return;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(a + R, b);
    ctx.lineTo(c - R, b);
    ctx.arc(c, b, R, Math.PI, Math.PI / 2, true);
    ctx.lineTo(c, d - R);
    ctx.arc(c, d, R, (3 * Math.PI) / 2, Math.PI, true);
    ctx.lineTo(a + R, d);
    ctx.arc(a, d, R, 0, -Math.PI / 2, true);
    ctx.lineTo(a, b + R);
    ctx.arc(a, b, R, Math.PI / 2, 0, true);
    ctx.closePath();
    ctx.stroke();
  };
  const WIDE_STYLES: BorderStyleKey[] = [
    "certBand", "checkerBand", "greekKey", "railroad", "beads", "diamonds",
    "stars", "triangles", "diagonal", "arches", "waveDouble", "crosses",
    "cornerDiamonds", "circleCorners", "thickThinThick", "dotLine",
    "dashedDouble",
  ];
  if (WIDE_STYLES.includes(style) && Math.min(rw, rh) < t * 22) style = "double";

  switch (style) {
    case "thick":
      box(0, t * 2.4);
      break;
    case "double":
      box(0, t * 0.85);
      box(t * 2.6, t * 0.85);
      break;
    case "thickThin":
      box(0, t * 2);
      box(t * 3.2, t * 0.6);
      break;
    case "triple": {
      const g = t * 1.9;
      box(0, t * 0.55);
      box(g, t * 0.55);
      box(g * 2, t * 0.55);
      break;
    }
    case "rounded":
      ctx.lineJoin = "round";
      box(0, t, Math.max(t * 3, Math.min(rw, rh) * 0.12));
      break;
    case "dashed":
    case "dashDot": {
      const lw = t;
      const unit =
        style === "dashed" ? [t * 4, t * 2.4] : [t * 4.2, t * 1.6, t * 0.9, t * 1.6];
      const period = unit.reduce((p, q) => p + q, 0);
      ctx.lineWidth = lw;
      for (const sd of sides(lw / 2)) {
        const k = Math.max(1, Math.round(sd.len / period));
        const f = sd.len / (k * period);
        ctx.setLineDash(unit.map((u) => u * f));
        ctx.lineDashOffset = (unit[0] * f) / 2;
        ctx.beginPath();
        ctx.moveTo(sd.x, sd.y);
        ctx.lineTo(sd.x + sd.ux * sd.len, sd.y + sd.uy * sd.len);
        ctx.stroke();
      }
      break;
    }
    case "dotted": {
      const dr = t * 0.7;
      for (const sd of sides(dr + t * 0.2)) {
        const k = Math.max(1, Math.round(sd.len / (t * 2.8)));
        for (let i = 0; i < k; i++) {
          const s = (sd.len * i) / k;
          ctx.beginPath();
          ctx.arc(sd.x + sd.ux * s, sd.y + sd.uy * s, dr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "wavy": {
      const amp = t * 1.1;
      ctx.lineWidth = t * 0.9;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const sd of sides(amp + t * 0.6)) {
        const k = Math.max(1, Math.round(sd.len / (t * 7)));
        const steps = Math.max(8, Math.ceil(sd.len / 2));
        const nx = sd.uy;
        const ny = -sd.ux;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const s = (sd.len * i) / steps;
          const off = amp * Math.sin((2 * Math.PI * k * i) / steps);
          const px = sd.x + sd.ux * s + nx * off;
          const py = sd.y + sd.uy * s + ny * off;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      break;
    }
    case "zigzag": {
      const amp = t * 1.3;
      ctx.lineWidth = t * 0.8;
      for (const sd of sides(amp + t * 0.6)) {
        const m = 2 * Math.max(1, Math.round(sd.len / (t * 6.4)));
        const nx = sd.uy;
        const ny = -sd.ux;
        ctx.beginPath();
        for (let i = 0; i <= m; i++) {
          const s = (sd.len * i) / m;
          const off = i === 0 || i === m ? 0 : i % 2 ? amp : -amp;
          const px = sd.x + sd.ux * s + nx * off;
          const py = sd.y + sd.uy * s + ny * off;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      break;
    }
    case "scallop": {
      ctx.lineWidth = t * 0.9;
      ctx.lineCap = "round";
      const R0 = t * 3.2;
      for (const sd of sides(R0 + t * 0.6)) {
        const k = Math.max(1, Math.round(sd.len / (R0 * 2)));
        const wdt = sd.len / k;
        const R = wdt / 2;
        const a0 = Math.atan2(-sd.uy, -sd.ux);
        for (let i = 0; i < k; i++) {
          const s = wdt * (i + 0.5);
          ctx.beginPath();
          ctx.arc(sd.x + sd.ux * s, sd.y + sd.uy * s, R, a0, a0 + Math.PI, false);
          ctx.stroke();
        }
      }
      break;
    }
    case "chain": {
      const rr = t * 1.5;
      ctx.lineWidth = t * 0.6;
      for (const sd of sides(rr + t * 0.6)) {
        const k = Math.max(1, Math.round(sd.len / (rr * 1.7)));
        for (let i = 0; i < k; i++) {
          const s = (sd.len * i) / k;
          ctx.beginPath();
          ctx.arc(sd.x + sd.ux * s, sd.y + sd.uy * s, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
    case "corners": {
      box(0, t * 0.6);
      const L = Math.max(t * 6, Math.min(rw, rh) * 0.18);
      const lw = t * 1.9;
      ctx.lineWidth = lw;
      const a = x0 + lw / 2;
      const b = y0 + lw / 2;
      const c = x1 - lw / 2;
      const d = y1 - lw / 2;
      ctx.beginPath();
      ctx.moveTo(a, b + L); ctx.lineTo(a, b); ctx.lineTo(a + L, b);
      ctx.moveTo(c - L, b); ctx.lineTo(c, b); ctx.lineTo(c, b + L);
      ctx.moveTo(c, d - L); ctx.lineTo(c, d); ctx.lineTo(c - L, d);
      ctx.moveTo(a + L, d); ctx.lineTo(a, d); ctx.lineTo(a, d - L);
      ctx.stroke();
      break;
    }
    case "squares": {
      box(t * 1.2, t * 0.8);
      const q = t * 3.6;
      ctx.fillRect(x0, y0, q, q);
      ctx.fillRect(x1 - q, y0, q, q);
      ctx.fillRect(x0, y1 - q, q, q);
      ctx.fillRect(x1 - q, y1 - q, q, q);
      break;
    }

    case "certBand": {
      const lw = t * 1.7;
      const q = t * 1.4;
      const gap = t * 0.5;
      box(0, lw);
      const m = lw + gap + q / 2;
      along(m, q * 2, m, (px, py) => ctx.fillRect(px - q / 2, py - q / 2, q, q));
      box(lw + gap * 2 + q, t * 0.6);
      break;
    }
    case "checkerBand": {
      const q = t * 1.1;
      const lw = t * 0.8;
      box(0, lw);
      const base = lw + t * 0.4;
      for (let r = 0; r < 2; r++) {
        const m = base + q / 2 + r * q;
        along(m, q, base + q / 2, (px, py, _sd, i) => {
          if ((i + r) % 2 === 0) ctx.fillRect(px - q / 2, py - q / 2, q, q);
        });
      }
      box(base + 2 * q + t * 0.4, lw);
      break;
    }
    case "greekKey": {
      const lw = t * 0.8;
      const u = t * 0.75;
      box(0, lw);
      const top = lw + t * 0.5;
      ctx.lineWidth = t * 0.55;
      for (const sd of sides(top)) {
        ctx.save();
        ctx.translate(sd.x, sd.y);
        ctx.rotate(Math.atan2(sd.uy, sd.ux));
        const k = Math.max(1, Math.round(sd.len / (4 * u)));
        for (let i = 0; i < k; i++) {
          const x = (sd.len * i) / k;
          ctx.beginPath();
          ctx.moveTo(x, 3 * u);
          ctx.lineTo(x, 0);
          ctx.lineTo(x + 3 * u, 0);
          ctx.lineTo(x + 3 * u, 2 * u);
          ctx.lineTo(x + u, 2 * u);
          ctx.lineTo(x + u, u);
          ctx.lineTo(x + 2 * u, u);
          ctx.stroke();
        }
        ctx.restore();
      }
      box(top + 3 * u + t * 0.5, lw);
      break;
    }
    case "railroad": {
      const lw = t * 0.8;
      const gap = t * 2.2;
      box(0, lw);
      box(lw + gap, lw);
      const m = lw + gap / 2;
      along(m, t * 2.2, m, (px, py, sd) => {
        const nx = -sd.uy;
        const ny = sd.ux;
        line2(px - (nx * gap) / 2, py - (ny * gap) / 2, px + (nx * gap) / 2, py + (ny * gap) / 2, t * 0.6);
      });
      break;
    }
    case "beads": {
      const lw = t * 0.7;
      const r = t * 1.1;
      const gap = t * 0.4;
      box(0, lw);
      const m = lw + gap + r;
      along(m, r * 2.5, m, (px, py) => {
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      });
      box(lw + gap * 2 + 2 * r, lw);
      break;
    }
    case "diamonds":
    case "stars": {
      const lw = t * 0.7;
      const d = t * 1.3;
      box(0, lw);
      const m = lw + t * 0.4 + d;
      along(m, d * 2.6, m, (px, py) => {
        if (style === "stars") star5(px, py, d * 1.1);
        else diamond(px, py, d);
      });
      box(lw + t * 0.8 + 2 * d, lw);
      break;
    }
    case "triangles": {
      const lw = t * 0.8;
      const h = t * 2;
      const wd = t * 2.4;
      box(0, lw);
      const m = lw + h / 2;
      along(m, wd * 1.05, m, (px, py, sd) => {
        const nx = -sd.uy;
        const ny = sd.ux;
        const bx = px - (nx * h) / 2;
        const by = py - (ny * h) / 2;
        ctx.beginPath();
        ctx.moveTo(bx - (sd.ux * wd) / 2, by - (sd.uy * wd) / 2);
        ctx.lineTo(bx + (sd.ux * wd) / 2, by + (sd.uy * wd) / 2);
        ctx.lineTo(px + (nx * h) / 2, py + (ny * h) / 2);
        ctx.closePath();
        ctx.fill();
      });
      box(lw + h + t * 0.4, t * 0.5);
      break;
    }
    case "notched":
      ctx.lineJoin = "miter";
      cham(0, t * 0.85, t * 4.5);
      cham(t * 2.7, t * 0.85, t * 2.4);
      break;
    case "ticket":
      ticketBox(0, t * 0.9, Math.max(t * 4, Math.min(rw, rh) * 0.08));
      break;
    case "dashedDouble": {
      const lw = t * 0.9;
      box(0, lw);
      const lw2 = t * 0.7;
      ctx.lineWidth = lw2;
      for (const sd of sides(lw + t * 1.6 + lw2 / 2)) {
        const k = Math.max(1, Math.round(sd.len / (t * 5)));
        const f = sd.len / (k * t * 5);
        ctx.setLineDash([t * 3 * f, t * 2 * f]);
        ctx.lineDashOffset = (t * 3 * f) / 2;
        ctx.beginPath();
        ctx.moveTo(sd.x, sd.y);
        ctx.lineTo(sd.x + sd.ux * sd.len, sd.y + sd.uy * sd.len);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      break;
    }
    case "dotLine": {
      const lw = t * 0.9;
      const r = t * 0.55;
      box(0, lw);
      const m = lw + t * 0.9 + r;
      along(m, t * 2.4, m, (px, py) => {
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case "diagonal": {
      const lw = t * 0.7;
      const w = t * 2.6;
      box(0, lw);
      const m = lw + t * 0.4 + w / 2;
      along(m, t * 1.8, m, (px, py, sd) => {
        const nx = -sd.uy;
        const ny = sd.ux;
        line2(
          px - (nx * w) / 2 - (sd.ux * w) / 2,
          py - (ny * w) / 2 - (sd.uy * w) / 2,
          px + (nx * w) / 2 + (sd.ux * w) / 2,
          py + (ny * w) / 2 + (sd.uy * w) / 2,
          t * 0.55,
        );
      });
      box(lw + t * 0.8 + w, lw);
      break;
    }
    case "arches": {
      const lw = t * 0.8;
      box(0, lw);
      ctx.lineWidth = t * 0.7;
      ctx.lineCap = "round";
      const R0 = t * 1.7;
      for (const sd of sides(lw)) {
        const k = Math.max(1, Math.round(sd.len / (R0 * 2)));
        const wd = sd.len / k;
        const R = wd / 2;
        const a0 = Math.atan2(-sd.uy, -sd.ux);
        for (let i = 0; i < k; i++) {
          const s0 = wd * (i + 0.5);
          ctx.beginPath();
          ctx.arc(sd.x + sd.ux * s0, sd.y + sd.uy * s0, R, a0, a0 - Math.PI, true);
          ctx.stroke();
        }
      }
      break;
    }
    case "waveDouble": {
      const lw = t * 0.7;
      const gap = t * 3.4;
      box(0, lw);
      box(lw + gap, lw);
      const amp = t * 0.8;
      ctx.lineWidth = t * 0.5;
      ctx.lineJoin = "round";
      for (const sd of sides(lw + gap / 2)) {
        const k = Math.max(1, Math.round(sd.len / (t * 5)));
        const steps = Math.max(8, Math.ceil(sd.len / 2));
        const nx = sd.uy;
        const ny = -sd.ux;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const s0 = (sd.len * i) / steps;
          const off = amp * Math.sin((2 * Math.PI * k * i) / steps);
          const px = sd.x + sd.ux * s0 + nx * off;
          const py = sd.y + sd.uy * s0 + ny * off;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      break;
    }
    case "circleCorners": {
      box(0, t * 0.8);
      box(t * 1.9, t * 0.5);
      const r = t * 1.7;
      const o = t * 1.9;
      for (const [cx, cy] of [
        [x0 + o, y0 + o],
        [x1 - o, y0 + o],
        [x1 - o, y1 - o],
        [x0 + o, y1 - o],
      ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "doubleRounded": {
      ctx.lineJoin = "round";
      const rr = Math.max(t * 3.5, Math.min(rw, rh) * 0.1);
      box(0, t * 0.85, rr);
      box(t * 2.6, t * 0.85, Math.max(t, rr - t * 2.6));
      break;
    }
    case "thinThick":
      box(0, t * 0.6);
      box(t * 2.2, t * 2);
      break;
    case "thickThinThick":
      box(0, t * 1.6);
      box(t * 2.4, t * 0.5);
      box(t * 3.6, t * 1.6);
      break;
    case "cornerDiamonds": {
      box(0, t * 1.5);
      box(t * 2.8, t * 0.6);
      const o = t * 3;
      for (const [cx, cy] of [
        [x0 + o, y0 + o],
        [x1 - o, y0 + o],
        [x1 - o, y1 - o],
        [x0 + o, y1 - o],
      ]) {
        diamond(cx, cy, t * 2.3);
      }
      break;
    }
    case "crosses": {
      const lw = t * 0.7;
      const arm = t * 0.9;
      box(0, lw);
      const m = lw + t * 0.5 + arm;
      ctx.lineWidth = t * 0.5;
      along(m, t * 3.2, m, (px, py) => {
        line2(px - arm, py, px + arm, py, t * 0.5);
        line2(px, py - arm, px, py + arm, t * 0.5);
      });
      box(lw + t * 1 + 2 * arm + t * 0.4, lw);
      break;
    }
    case "single":
    default:
      box(0, t);
  }
  ctx.restore();
};
// Small preview picture of one border style (for the style picker).
function BorderPreview({ style }: { style: BorderStyleKey }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawBorderPx(ctx, 3, 3, cv.width - 3, cv.height - 3, 2.6, style, "#3B2F1E");
  }, [style]);
  return <canvas ref={ref} width={110} height={70} className="w-full h-[30px]" />;
}

/* -------------------------------------------------------------------------- */
/*                         Ready-made seals (editable)                        */
/* -------------------------------------------------------------------------- */
// The person picks a seal design, types the text of the seal, picks the ink
// colour and drags a box on the page — the seal is stamped inside that box.
// It is drawn like real stamp ink ("multiply" on the paper), so writing under
// it stays visible and the paper texture shows through.
type SealStyleKey =
  | "round2"
  | "round1"
  | "roundDot"
  | "roundStar"
  | "oval"
  | "ovalSingle"
  | "rect"
  | "rectRound"
  | "banner"
  | "roundBand"
  | "ovalBand"
  | "roundGear"
  | "rectThin"
  | "rectBold"
  | "rectLeft"
  | "noBorder";
type SealShape = "round" | "oval" | "rect";
const SEAL_STYLES: { key: SealStyleKey; label: string; shape: SealShape }[] = [
  { key: "round2", label: "Round double", shape: "round" },
  { key: "round1", label: "Round single", shape: "round" },
  { key: "roundDot", label: "Round dotted", shape: "round" },
  { key: "roundStar", label: "Round star", shape: "round" },
  { key: "oval", label: "Oval double", shape: "oval" },
  { key: "ovalSingle", label: "Oval single", shape: "oval" },
  { key: "rect", label: "Rectangle", shape: "rect" },
  { key: "rectRound", label: "Rounded box", shape: "rect" },
  { key: "banner", label: "Banner", shape: "rect" },
  { key: "roundBand", label: "Round date band", shape: "round" },
  { key: "ovalBand", label: "Oval date band", shape: "oval" },
  { key: "roundGear", label: "Round serrated", shape: "round" },
  { key: "rectThin", label: "Thin box", shape: "rect" },
  { key: "rectBold", label: "Bold box", shape: "rect" },
  { key: "rectLeft", label: "Left-aligned lines", shape: "rect" },
  { key: "noBorder", label: "Text only", shape: "rect" },
];
// Quick texts for the middle of a seal (most used in Bangladesh).
const SEAL_QUICK_TEXTS = [
  "সত্যায়িত",
  "প্রাপ্ত",
  "বাতিল",
  "পরিশোধিত",
  "জরুরি",
  "গোপনীয়",
  "অনুলিপি",
  "মূল কপির সাথে সঠিক",
  "প্রধান শিক্ষক",
  "অধ্যক্ষ",
  "চেয়ারম্যান",
  "নোটারি পাবলিক",
];
// Seals copied from a real document ("Take seal from the page"). The picture
// of each one is kept here so a stroke can be painted again (undo / replay).
type CustomSeal = { id: string; data: string };
const customSealCanvases = new Map<string, HTMLCanvasElement>();
const CUSTOM_SEAL_KEY = "sohoj_custom_seals_v1";
const SEAL_FONTS: HandStyleKey[] = ["printBold", "printSerif", "printClassic"];
type SealOpts = {
  style: string;
  color: string;
  top: string;
  bottom: string;
  center: string;
  font: string;
  ownColor?: boolean; // custom (copied) seals: keep the colours of the picture
  rot: number; // degrees
  ink: number; // 0.2 .. 1
  wear: number; // 0 .. 1
  seed: number;
};
const splitGraphemes = (t: string): string[] => {
  const Seg = (
    Intl as unknown as {
      Segmenter?: new (
        l?: string,
        o?: { granularity: string },
      ) => { segment: (s: string) => Iterable<{ segment: string }> };
    }
  ).Segmenter;
  if (Seg) {
    try {
      return Array.from(
        new Seg("bn", { granularity: "grapheme" }).segment(t),
        (x) => x.segment,
      );
    } catch {
      /* fall through */
    }
  }
  return Array.from(t);
};
const drawSealPx = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  rw: number,
  rh: number,
  o: SealOpts,
) => {
  const W = Math.round(rw);
  const H = Math.round(rh);
  if (W < 10 || H < 10 || typeof document === "undefined") return;
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const c = off.getContext("2d");
  if (!c) return;
  const customId = o.style.startsWith("custom:") ? o.style.slice(7) : "";
  let customSrc: HTMLCanvasElement | null = customId
    ? (customSealCanvases.get(customId) ?? null)
    : null;
  if (customId && !customSrc) return;
  // Copied seal in a new colour: ink strength is kept, colour is replaced.
  if (customSrc && o.ownColor === false) {
    const rgb = hexToRgb(o.color);
    const tc = document.createElement("canvas");
    tc.width = customSrc.width;
    tc.height = customSrc.height;
    const tctx = tc.getContext("2d", { willReadFrequently: true });
    if (tctx && rgb) {
      tctx.drawImage(customSrc, 0, 0);
      const im = tctx.getImageData(0, 0, tc.width, tc.height);
      for (let i = 0; i < im.data.length; i += 4) {
        const lum = 0.299 * im.data[i] + 0.587 * im.data[i + 1] + 0.114 * im.data[i + 2];
        const d = Math.min(1, Math.max(0, 1 - lum / 255) * 1.25);
        im.data[i] = 255 * (1 - d) + rgb[0] * d;
        im.data[i + 1] = 255 * (1 - d) + rgb[1] * d;
        im.data[i + 2] = 255 * (1 - d) + rgb[2] * d;
      }
      tctx.putImageData(im, 0, 0);
      customSrc = tc;
    }
  }
  const def = SEAL_STYLES.find((s) => s.key === o.style) || SEAL_STYLES[0];
  const st = handStyleOf(SEAL_FONTS.includes(o.font as HandStyleKey) ? o.font : "printBold");
  const rand = mulberry32(o.seed || 1);
  const top = (o.top || "").replace(/\s+/g, " ").trim();
  const bottom = (o.bottom || "").replace(/\s+/g, " ").trim();
  const centerLines = (o.center || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const fontAt = (size: number) => `${st.weight} ${size}px ${handFontStack(st)}`;

  // Keep the whole seal inside the box even when it is turned.
  const a = ((o.rot || 0) * Math.PI) / 180;
  const ca = Math.abs(Math.cos(a));
  const sa = Math.abs(Math.sin(a));
  const fit = Math.min(W / (W * ca + H * sa), H / (W * sa + H * ca));
  const t = Math.max(1.2, Math.min(W, H) * 0.014); // base line thickness

  c.save();
  c.translate(W / 2, H / 2);
  c.rotate(a);
  c.scale(fit, fit);
  c.fillStyle = o.color;
  c.strokeStyle = o.color;
  c.lineJoin = "round";
  c.textAlign = "center";
  c.textBaseline = "middle";

  const star = (cx: number, cy: number, r: number) => {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r : r * 0.42;
      const px = cx + Math.cos(ang) * rr;
      const py = cy + Math.sin(ang) * rr;
      if (i) c.lineTo(px, py);
      else c.moveTo(px, py);
    }
    c.closePath();
    c.fill();
  };
  // Biggest text size so the lines fit in maxW x maxH (then capped by maxFs).
  const fitLines = (lines: string[], maxW: number, maxH: number, maxFs: number) => {
    c.font = fontAt(100);
    let widest = 1;
    for (const l of lines) widest = Math.max(widest, c.measureText(l).width);
    const byW = (maxW / widest) * 100;
    const byH = (maxH / (lines.length * 1.18)) ;
    return Math.max(5, Math.min(maxFs, byW, byH));
  };
  const drawLines = (lines: string[], cx: number, cy: number, fs: number) => {
    c.font = fontAt(fs);
    const lh = fs * 1.18;
    let y = cy - ((lines.length - 1) * lh) / 2;
    for (const l of lines) {
      c.fillText(l, cx, y);
      y += lh;
    }
  };

  if (customSrc) {
    const sc = Math.min(W / customSrc.width, H / customSrc.height);
    const dw = customSrc.width * sc;
    const dh = customSrc.height * sc;
    // Final size on the page (the seal is scaled by `fit` when it is turned).
    let tw = Math.max(1, Math.round(dw * fit));
    let th = Math.max(1, Math.round(dh * fit));
    let src: HTMLCanvasElement = customSrc;
    // Shrinking in one go drops thin ink lines (the seal turns pale). Halve
    // step by step so every line is averaged, not skipped.
    while (src.width > tw * 2 || src.height > th * 2) {
      const hw = Math.max(tw, Math.round(src.width / 2));
      const hh = Math.max(th, Math.round(src.height / 2));
      const step = document.createElement("canvas");
      step.width = hw;
      step.height = hh;
      const sctx = step.getContext("2d");
      if (!sctx) break;
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.fillStyle = "#ffffff";
      sctx.fillRect(0, 0, hw, hh);
      sctx.drawImage(src, 0, 0, hw, hh);
      src = step;
    }
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
    c.drawImage(src, -dw / 2, -dh / 2, dw, dh);
  } else if (def.shape !== "rect") {
    const rx0 = def.shape === "round" ? (Math.min(W, H) / 2) * 0.97 : (W / 2) * 0.97;
    const ry0 = def.shape === "round" ? rx0 : (H / 2) * 0.97;
    const m = Math.min(rx0, ry0);
    const hasArc = !!(top || bottom);
    const band = m * (hasArc ? 0.3 : 0.16);
    const double = o.style === "round2" || o.style === "roundStar" || o.style === "oval";
    const ring = (inset: number, lw: number) => {
      c.lineWidth = lw;
      c.beginPath();
      c.ellipse(0, 0, Math.max(1, rx0 - inset - lw / 2), Math.max(1, ry0 - inset - lw / 2), 0, 0, Math.PI * 2);
      c.stroke();
    };
    if (o.style === "roundDot") {
      ring(0, 1.1 * t);
      const dr = t * 0.55;
      const rxd = rx0 - 2.8 * t;
      const ryd = ry0 - 2.8 * t;
      const per = Math.PI * (3 * (rxd + ryd) - Math.sqrt((3 * rxd + ryd) * (rxd + 3 * ryd)));
      const n = Math.max(12, Math.round(per / (t * 3.4)));
      for (let i = 0; i < n; i++) {
        const th = (i / n) * Math.PI * 2;
        c.beginPath();
        c.arc(Math.cos(th) * rxd, Math.sin(th) * ryd, dr, 0, Math.PI * 2);
        c.fill();
      }
    } else if (o.style === "roundGear") {
      // serrated (gear-like) outer edge
      const teeth = Math.max(24, Math.round(m / (t * 1.6)));
      const depth = 2.6 * t;
      c.lineWidth = 1.1 * t;
      c.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const th = (i / (teeth * 2)) * Math.PI * 2;
        const k = i % 2 === 0 ? 0 : depth;
        c.lineTo(Math.cos(th) * (rx0 - k - t), Math.sin(th) * (ry0 - k - t));
      }
      c.closePath();
      c.stroke();
      ring(4.6 * t, 0.8 * t);
    } else if (double) {
      ring(0, 1.9 * t);
      ring(2.9 * t, 0.7 * t);
    } else {
      ring(0, 1.7 * t);
    }
    ring(band, (double ? 1.1 : 0.9) * t);

    const edge =
      o.style === "roundGear"
        ? 5.6 * t
        : double
          ? 3.8 * t
          : o.style === "roundDot"
            ? 4.2 * t
            : 2.2 * t;
    const textBand = Math.max(4, band - edge);
    const midInset = (edge + band) / 2;
    const rxm = rx0 - midInset;
    const rym = ry0 - midInset;
    const baseFs = Math.max(5, textBand * 0.74);
    const per = Math.PI * (3 * (rxm + rym) - Math.sqrt((3 * rxm + rym) * (rxm + 3 * rym)));
    const arcText = (text: string, isTop: boolean) => {
      if (!text) return;
      const chars = splitGraphemes(text);
      let fs = baseFs;
      const widthsAt = (size: number) => {
        c.font = fontAt(size);
        return chars.map((ch) => c.measureText(ch).width);
      };
      let ws = widthsAt(fs);
      let spacing = fs * 0.08;
      let total = ws.reduce((p, q) => p + q, 0) + spacing * (chars.length - 1);
      const limit = (per / 2) * 0.84;
      if (total > limit) {
        fs = Math.max(4, (fs * limit) / total);
        ws = widthsAt(fs);
        spacing = fs * 0.08;
        total = ws.reduce((p, q) => p + q, 0) + spacing * (chars.length - 1);
      }
      c.font = fontAt(fs);
      const th0 = isTop ? -Math.PI / 2 : Math.PI / 2;
      const dir = isTop ? 1 : -1;
      // Angle after walking `s` px along the ellipse from the top / bottom.
      const thetaAt = (s: number) => {
        let th = th0;
        let acc = 0;
        const sign = s < 0 ? -1 : 1;
        const target = Math.abs(s);
        const step = 0.004;
        while (acc < target && Math.abs(th - th0) < Math.PI * 1.2) {
          const sp = Math.hypot(rxm * Math.sin(th), rym * Math.cos(th));
          acc += sp * step;
          th += dir * sign * step;
        }
        return th;
      };
      let s = -total / 2;
      for (let i = 0; i < chars.length; i++) {
        const th = thetaAt(s + ws[i] / 2);
        const px = Math.cos(th) * rxm;
        const py = Math.sin(th) * rym;
        const tx = -rxm * Math.sin(th) * dir;
        const ty = rym * Math.cos(th) * dir;
        c.save();
        c.translate(px, py);
        c.rotate(Math.atan2(ty, tx));
        c.fillText(chars[i], 0, 0);
        c.restore();
        s += ws[i] + spacing;
      }
    };
    arcText(top, true);
    arcText(bottom, false);
    if (top && bottom) {
      star(rxm, 0, textBand * 0.2);
      star(-rxm, 0, textBand * 0.2);
    }
    const rxIn = rx0 - band - t * 1.5;
    const ryIn = ry0 - band - t * 1.5;
    if (o.style === "roundStar") {
      star(0, -ryIn * 0.46, Math.min(rxIn, ryIn) * 0.26);
      if (centerLines.length) {
        const fs = fitLines(centerLines, 2 * rxIn * 0.74, ryIn * 0.82, ryIn * 0.55);
        drawLines(centerLines, 0, ryIn * 0.24, fs);
      }
    } else if (o.style === "roundBand" || o.style === "ovalBand") {
      // Date-stamp look: a horizontal band across the middle holds the text.
      const hb = ryIn * 0.32;
      const chord = (y: number) =>
        rxIn * Math.sqrt(Math.max(0, 1 - (y / ryIn) * (y / ryIn)));
      c.lineWidth = 0.9 * t;
      for (const y of [-hb, hb]) {
        c.beginPath();
        c.moveTo(-chord(y), y);
        c.lineTo(chord(y), y);
        c.stroke();
      }
      if (centerLines.length) {
        const fs = fitLines(centerLines, 2 * chord(hb) * 0.9, 2 * hb * 0.86, hb * 1.3);
        drawLines(centerLines, 0, 0, fs);
      }
    } else if (centerLines.length) {
      const fs = fitLines(centerLines, 2 * rxIn * 0.8, 2 * ryIn * 0.66, ryIn * 0.7);
      drawLines(centerLines, 0, 0, fs);
    }
  } else {
    const w = W * 0.97;
    const h = H * 0.97;
    const rad = o.style === "rectRound" ? Math.min(w, h) * 0.14 : 0;
    const box = (inset: number, lw: number, r: number) => {
      c.lineWidth = lw;
      const bx = -w / 2 + inset + lw / 2;
      const by = -h / 2 + inset + lw / 2;
      const bw = w - 2 * inset - lw;
      const bh = h - 2 * inset - lw;
      c.beginPath();
      if (r > 0 && typeof c.roundRect === "function") c.roundRect(bx, by, bw, bh, Math.max(0, r - inset));
      else c.rect(bx, by, bw, bh);
      c.stroke();
    };
    const rule = (y: number, lw: number, xi: number) => {
      c.lineWidth = lw;
      c.beginPath();
      c.moveTo(-w / 2 + xi, y);
      c.lineTo(w / 2 - xi, y);
      c.stroke();
    };
    let inset = 4.6 * t;
    let sideInset = inset;
    const listLines = [top, ...centerLines, bottom].filter(Boolean);
    if (o.style === "rectLeft" || o.style === "noBorder") {
      const left = o.style === "rectLeft";
      if (left) box(0, 1.4 * t, 0);
      const ins = left ? 3.6 * t : 0.5 * t;
      if (listLines.length) {
        const fs = fitLines(listLines, w - 2 * ins, h - 2 * ins, h * 0.5);
        c.font = fontAt(fs);
        c.textAlign = left ? "left" : "center";
        const lh = fs * 1.18;
        let y = -((listLines.length - 1) * lh) / 2;
        for (const l of listLines) {
          c.fillText(l, left ? -w / 2 + ins : 0, y);
          y += lh;
        }
      }
    } else {
    if (o.style === "banner") {
      rule(-h / 2 + 0.85 * t, 1.7 * t, 0);
      rule(-h / 2 + 3.4 * t, 0.7 * t, 0);
      rule(h / 2 - 0.85 * t, 1.7 * t, 0);
      rule(h / 2 - 3.4 * t, 0.7 * t, 0);
      inset = 5.8 * t;
      sideInset = w * 0.04;
    } else if (o.style === "rectThin") {
      box(0, 1.3 * t, rad);
      inset = 3.4 * t;
      sideInset = inset;
    } else if (o.style === "rectBold") {
      box(0, 3.2 * t, rad);
      box(4.6 * t, 0.8 * t, rad);
      inset = 7.2 * t;
      sideInset = inset;
    } else {
      box(0, 1.9 * t, rad);
      box(2.9 * t, 0.7 * t, rad);
    }
    const cl = -w / 2 + sideInset;
    const cw = w - 2 * sideInset;
    const ct = -h / 2 + inset;
    const chh = h - 2 * inset;
    const topH = top ? chh * 0.22 : 0;
    const botH = bottom ? chh * 0.22 : 0;
    const midH = chh - topH - botH;
    const cx = cl + cw / 2;
    if (top) {
      const fs = fitLines([top], cw * 0.94, topH * 0.8, topH * 0.8);
      drawLines([top], cx, ct + topH / 2, fs);
      rule(ct + topH, 0.6 * t, sideInset);
    }
    if (bottom) {
      const fs = fitLines([bottom], cw * 0.94, botH * 0.8, botH * 0.8);
      drawLines([bottom], cx, ct + chh - botH / 2, fs);
      rule(ct + chh - botH, 0.6 * t, sideInset);
    }
    if (centerLines.length) {
      const fs = fitLines(centerLines, cw * 0.94, midH * 0.86, midH * 0.7);
      drawLines(centerLines, cx, ct + topH + midH / 2, fs);
    }
    }
  }
  c.restore();

  // Old / worn ink: tiny gaps where the ink did not take.
  if (o.wear > 0) {
    c.save();
    c.globalCompositeOperation = "destination-out";
    const n = Math.round(o.wear * (W * H) / 70);
    for (let i = 0; i < n; i++) {
      c.globalAlpha = 0.35 + rand() * 0.65;
      c.beginPath();
      c.arc(rand() * W, rand() * H, t * (0.15 + rand() * 0.55), 0, Math.PI * 2);
      c.fill();
    }
    // a few bigger faint patches (uneven pressure)
    for (let i = 0; i < Math.round(o.wear * 6); i++) {
      c.globalAlpha = 0.12 + rand() * 0.18;
      c.beginPath();
      c.arc(rand() * W, rand() * H, t * (2 + rand() * 5), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = Math.min(1, Math.max(0.2, o.ink));
  ctx.drawImage(off, Math.round(x0), Math.round(y0));
  ctx.restore();
};
const drawSealStroke = (ctx: CanvasRenderingContext2D, stroke: EraseStroke) => {
  const r = stroke.rect;
  if (!r) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  drawSealPx(
    ctx,
    r.x0 * w,
    r.y0 * h,
    (r.x1 - r.x0) * w,
    (r.y1 - r.y0) * h,
    {
      style: stroke.style || "round2",
      color: stroke.color,
      top: stroke.sealTop || "",
      bottom: stroke.sealBottom || "",
      center: stroke.text || "",
      font: stroke.sealFont || "printBold",
      rot: stroke.sealRot || 0,
      ink: stroke.sealInk ?? 0.9,
      wear: stroke.sealWear || 0,
      ownColor: stroke.sealOwnColor !== false,
      seed: stroke.seed ?? 1,
    },
  );
};
// Small picture of one seal design (for the design picker).
function SealPreview({ style, color }: { style: string; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let dead = false;
    const draw = () => {
      if (dead) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const shape = SEAL_STYLES.find((s) => s.key === style)?.shape ?? "round";
      const hh = style.startsWith("custom:")
        ? 80
        : shape === "round"
          ? 92
          : shape === "oval"
            ? 62
            : 56;
      drawSealPx(ctx, 2, (cv.height - hh) / 2, 92, hh, {
        style,
        color,
        top: "প্রতিষ্ঠান",
        bottom: "ঠিকানা",
        center: "সিল",
        font: "printBold",
        ownColor: true,
        rot: 0,
        ink: 1,
        wear: 0,
        seed: 1,
      });
    };
    draw();
    void ensureHandwritingFont(handStyleOf("printBold")).then(draw);
    return () => {
      dead = true;
    };
  }, [style, color]);
  return <canvas ref={ref} width={96} height={96} className="w-full h-auto" />;
}

/* -------------------------------------------------------------------------- */
/*                        "Select area" mode for the brush                    */
/* -------------------------------------------------------------------------- */
// One box instead of a free line: the whole box is erased (painted over with
// the paper colour), highlighted, blacked out, or framed with the pen.
const drawEraseArea = (
  ctx: CanvasRenderingContext2D,
  rect: FractionRect,
  radiusFrac: number,
  tool: BrushTool,
  paintColor: string,
  borderStyle?: string,
) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const x0 = Math.round(rect.x0 * w);
  const y0 = Math.round(rect.y0 * h);
  const x1 = Math.round(rect.x1 * w);
  const y1 = Math.round(rect.y1 * h);
  const rw = x1 - x0;
  const rh = y1 - y0;
  if (rw < 2 || rh < 2) return;
  ctx.save();
  if (tool === "highlight") {
    ctx.globalCompositeOperation = "darken";
    ctx.fillStyle = paintColor;
    ctx.fillRect(x0, y0, rw, rh);
  } else if (tool === "redact") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(x0, y0, rw, rh);
  } else if (tool === "pen") {
    ctx.strokeStyle = paintColor;
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, radiusFrac * w * 2);
    ctx.strokeRect(x0, y0, rw, rh);
  } else if (tool === "border") {
    drawBorderPx(
      ctx,
      x0,
      y0,
      x1,
      y1,
      Math.max(1.5, radiusFrac * w * 2),
      (borderStyle || "single") as BorderStyleKey,
      paintColor,
    );
  } else {
    // Erase: cover the box with overlapping round patches, each one painted
    // with the paper colour found right around it (so shadows / tint match).
    ctx.beginPath();
    ctx.rect(x0, y0, rw, rh);
    ctx.clip();
    const R = Math.max(
      12,
      Math.min(80, Math.min(rw, rh) / 3),
      Math.sqrt((rw * rh) / 150),
    );
    const step = R * 0.8;
    const feather = Math.min(R * 0.35, 10);
    for (let cy = y0; cy < y1 + step; cy += step) {
      for (let cx = x0; cx < x1 + step; cx += step) {
        const px = Math.min(x1, cx);
        const py = Math.min(y1, cy);
        const color = samplePaperColor(ctx, px, py, R);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = feather;
        ctx.beginPath();
        ctx.arc(px, py, R, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
};
/* -------------------------------------------------------------------------- */
/*                 Dotted line / underline (drag from A to B)                 */
/* -------------------------------------------------------------------------- */
// Brings back dots (".........") or an underline that Document Clean / the
// eraser removed. The person drags from where it should start to where it
// should end; a nearly straight drag snaps perfectly horizontal / vertical.
// Estimates how much the page text lines are tilted (degrees, + = clockwise).
// Projection-profile method: the angle where dark pixels line up in the
// fewest, sharpest rows is the text direction. Cropped pages give ~0.
// A drag that is within LINE_AXIS_TOL_DEG of horizontal / vertical becomes a
// straight line. If `src` (the page on screen) is given, the line also
// follows the tilt of the text around it, so on a slightly tilted scan the
// line runs parallel to the page's own lines (not just to the screen).
const LINE_AXIS_TOL_DEG = 8;
const snapLineEnd = (
  a: Point,
  b: Point,
  w: number,
  h: number,
  src?: HTMLCanvasElement | null,
): Point => {
  const dx = (b.x - a.x) * w;
  const dy = (b.y - a.y) * h;
  if (Math.hypot(dx, dy) < 1) return b;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  let base: number | null = null;
  for (const t of [0, 90, 180, -90, -180]) {
    if (Math.abs(ang - t) <= LINE_AXIS_TOL_DEG) {
      base = t;
      break;
    }
  }
  if (base === null) return b;
  let t = base;
  if (src) {
    try {
      const local = estimateLocalAngleDeg(src, a, b, base);
      if (local !== null) t = local;
    } catch {
      /* keep the plain axis */
    }
  }
  const r = (t * Math.PI) / 180;
  const ux = Math.cos(r);
  const uy = Math.sin(r);
  const proj = dx * ux + dy * uy; // keep the length the person dragged
  return {
    x: Math.min(1, Math.max(0, a.x + (proj * ux) / w)),
    y: Math.min(1, Math.max(0, a.y + (proj * uy) / h)),
  };
};
const estimateSkewDeg = (src: HTMLCanvasElement): number => {
  const k = Math.min(1, 1400 / Math.max(src.width, src.height));
  const w = Math.max(32, Math.round(src.width * k));
  const h = Math.max(32, Math.round(src.height * k));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  if (!cx) return 0;
  cx.drawImage(src, 0, 0, w, h);
  const d = cx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  let mean = 0;
  for (let i = 0; i < w * h; i++) {
    lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    mean += lum[i];
  }
  mean /= w * h;
  const thr = mean * 0.78;
  const xs: number[] = [];
  const ys: number[] = [];
  const stride = Math.max(1, Math.floor((w * h) / 250000));
  for (let i = 0; i < w * h; i += stride) {
    if (lum[i] < thr) {
      xs.push(i % w);
      ys.push(Math.floor(i / w));
    }
  }
  if (xs.length < 300) return 0;
  const bins = new Float64Array(w + h + 4);
  const score = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    bins.fill(0);
    for (let i = 0; i < xs.length; i++) {
      const p = Math.round(ys[i] * c - xs[i] * s) + w;
      bins[p]++;
    }
    let sc = 0;
    for (let i = 0; i < bins.length; i++) sc += bins[i] * bins[i];
    return sc;
  };
  let best = 0;
  let bestSc = -1;
  for (let deg = -12; deg <= 12; deg += 0.25) {
    const sc = score(deg);
    if (sc > bestSc) {
      bestSc = sc;
      best = deg;
    }
  }
  const mid = best;
  for (let deg = mid - 0.3; deg <= mid + 0.3; deg += 0.02) {
    const sc = score(deg);
    if (sc > bestSc) {
      bestSc = sc;
      best = deg;
    }
  }
  // Even a small tilt (a few tenths of a degree) is visible on a long line.
  return Math.abs(best) < 0.08 ? 0 : best;
};
// Direction of the text right around a dragged line. Looks only at a strip
// along the line, searching a few degrees either side of `baseDeg`
// (0 = horizontal, 90 = vertical). Returns null when the strip has no clear
// lines to follow, so the caller can fall back to the plain axis.
const LOCAL_SEARCH_DEG = 6;
const estimateLocalAngleDeg = (
  src: HTMLCanvasElement,
  a: Point,
  b: Point,
  baseDeg: number,
): number | null => {
  const W = src.width;
  const H = src.height;
  const ax = a.x * W;
  const ay = a.y * H;
  const bx = b.x * W;
  const by = b.y * H;
  const pad = Math.min(160, Math.max(30, H * 0.04));
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - pad));
  const y0 = Math.max(0, Math.floor(Math.min(ay, by) - pad));
  const x1 = Math.min(W, Math.ceil(Math.max(ax, bx) + pad));
  const y1 = Math.min(H, Math.ceil(Math.max(ay, by) + pad));
  const sw = x1 - x0;
  const sh = y1 - y0;
  if (sw < 8 || sh < 8) return null;
  const k = Math.min(1, 900 / Math.max(sw, sh));
  const w = Math.max(8, Math.round(sw * k));
  const h = Math.max(8, Math.round(sh * k));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  if (!cx) return null;
  cx.drawImage(src, x0, y0, sw, sh, 0, 0, w, h);
  const d = cx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  let mean = 0;
  for (let i = 0; i < w * h; i++) {
    lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    mean += lum[i];
  }
  mean /= w * h;
  const thr = mean * 0.78;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (lum[i] < thr) {
      xs.push(i % w);
      ys.push(Math.floor(i / w));
    }
  }
  if (xs.length < 80) return null;
  const off = w + h;
  const bins = new Float64Array(off * 2 + 4);
  const score = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    bins.fill(0);
    for (let i = 0; i < xs.length; i++) {
      bins[Math.round(ys[i] * c - xs[i] * s) + off]++;
    }
    let sc = 0;
    for (let i = 0; i < bins.length; i++) sc += bins[i] * bins[i];
    return sc;
  };
  let best = baseDeg;
  let bestSc = -1;
  let total = 0;
  let n = 0;
  for (
    let deg = baseDeg - LOCAL_SEARCH_DEG;
    deg <= baseDeg + LOCAL_SEARCH_DEG + 1e-6;
    deg += 0.25
  ) {
    const sc = score(deg);
    total += sc;
    n++;
    if (sc > bestSc) {
      bestSc = sc;
      best = deg;
    }
  }
  // No sharper than the average angle = no lines to follow.
  if (bestSc / (total / n) < 1.05) return null;
  const mid = best;
  for (let deg = mid - 0.3; deg <= mid + 0.3; deg += 0.05) {
    const sc = score(deg);
    if (sc > bestSc) {
      bestSc = sc;
      best = deg;
    }
  }
  return best;
};
// Turns the page by `deg` degrees (+ = clockwise). The canvas grows so no
// corner of the page is cut off; the new corners get the paper colour.
const rotateCanvasByDeg = (
  src: HTMLCanvasElement,
  deg: number,
): HTMLCanvasElement => {
  const a = (deg * Math.PI) / 180;
  const ca = Math.abs(Math.cos(a));
  const sa = Math.abs(Math.sin(a));
  const out = makeCanvas(
    src.width * ca + src.height * sa,
    src.width * sa + src.height * ca,
  );
  const ctx = out.getContext("2d", { willReadFrequently: true });
  const sctx = src.getContext("2d", { willReadFrequently: true });
  if (!ctx || !sctx) return src;
  ctx.fillStyle = samplePaperColor(
    sctx,
    src.width / 2,
    src.height / 2,
    Math.min(src.width, src.height) / 2,
  );
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(a);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
};
const drawLineMark = (
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  radiusFrac: number,
  tool: BrushTool,
  color: string,
) => {
  if (pts.length < 2) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const r = Math.max(1, radiusFrac * w);
  const x0 = pts[0].x * w;
  const y0 = pts[0].y * h;
  const x1 = pts[pts.length - 1].x * w;
  const y1 = pts[pts.length - 1].y * h;
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 1) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (tool === "underline") {
    ctx.lineCap = "round";
    ctx.lineWidth = r * 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  } else {
    const spacing = Math.max(3, r * 4.4);
    const ux = (x1 - x0) / len;
    const uy = (y1 - y0) / len;
    const count = Math.floor(len / spacing);
    for (let i = 0; i <= count; i++) {
      ctx.beginPath();
      ctx.arc(x0 + ux * i * spacing, y0 + uy * i * spacing, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
};
/* -------------------------------------------------------------------------- */
/*                     Handwriting (typed text -> human hand)                 */
/* -------------------------------------------------------------------------- */
// The person types Bangla / English text, picks a hand style and drags a box.
// The text is drawn inside that box so it looks like it was written by a real
// hand: every word gets its own tiny tilt, height wobble and spacing, and the
// ink slightly bleeds into the paper. The random numbers come from a fixed
// seed, so "undo last stroke" (which replays all strokes) draws the very same
// handwriting again.
// Each style = a Latin handwriting font + a Bangla handwriting font. The
// browser uses the first font for English letters and falls back to the second
// one for Bangla letters automatically. (Fonts are loaded from Google Fonts in
// the page <style> below.)
type HandStyleKey = string;
type HandStyle = {
  key: HandStyleKey;
  label: string;
  latin: string;
  bangla: string;
  weight: number;
  jitter: number; // how shaky the hand is (1 = normal)
  slant: number; // negative = leaning to the right
  alpha: number;
  color: string; // ink colour that suits this style (the person can change it)
  stroke?: number; // extra outline (in em) for a heavier print, 0 = none
  thumb?: string; // picture of the copied text (styles taken from a document)
  custom?: boolean; // taken from a document by the person
};
const HANDWRITING_STYLES: HandStyle[] = [
  { key: "ballpen", label: "Ball pen", latin: "Caveat", bangla: "Atma", weight: 600, jitter: 1, slant: -0.1, alpha: 0.96, color: "#1E3A8A" },
  { key: "neat", label: "Neat", latin: "Patrick Hand", bangla: "Atma", weight: 400, jitter: 0.6, slant: 0, alpha: 0.96, color: "#111111" },
  { key: "quick", label: "Quick note", latin: "Reenie Beanie", bangla: "Atma", weight: 400, jitter: 1.5, slant: -0.2, alpha: 0.94, color: "#1D4ED8" },
  { key: "cursive", label: "Cursive", latin: "Dancing Script", bangla: "Galada", weight: 500, jitter: 0.8, slant: -0.05, alpha: 0.96, color: "#1E3A8A" },
  { key: "script", label: "Pen script", latin: "Homemade Apple", bangla: "Galada", weight: 400, jitter: 1.1, slant: -0.08, alpha: 0.95, color: "#111111" },
  { key: "marker", label: "Marker", latin: "Gloria Hallelujah", bangla: "Atma", weight: 700, jitter: 0.9, slant: 0, alpha: 0.97, color: "#111111" },
  { key: "pencil", label: "Pencil", latin: "Nanum Pen Script", bangla: "Atma", weight: 400, jitter: 1.2, slant: -0.06, alpha: 0.82, color: "#4B5563" },
  { key: "bold", label: "Bold", latin: "Baloo Da 2", bangla: "Baloo Da 2", weight: 600, jitter: 0.5, slant: 0, alpha: 0.97, color: "#111111" },
  // Printed-document looks (no shaky hand): to patch a word of a typed form.
  { key: "printSans", label: "Print sans", latin: "Hind Siliguri", bangla: "Hind Siliguri", weight: 500, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printSerif", label: "Print serif", latin: "Noto Serif", bangla: "Noto Serif Bengali", weight: 500, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printBold", label: "Print bold", latin: "Hind Siliguri", bangla: "Hind Siliguri", weight: 700, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printClassic", label: "Print classic", latin: "Noto Serif", bangla: "Tiro Bangla", weight: 400, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  // ---- more printed-document looks (government forms, certificates, books) ----
  { key: "printNoto", label: "Noto sans", latin: "Noto Sans", bangla: "Noto Sans Bengali", weight: 400, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printNotoBold", label: "Noto sans bold", latin: "Noto Sans", bangla: "Noto Sans Bengali", weight: 700, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printAnek", label: "Anek", latin: "Anek Bangla", bangla: "Anek Bangla", weight: 500, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printAnekBold", label: "Anek bold", latin: "Anek Bangla", bangla: "Anek Bangla", weight: 700, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printMina", label: "Mina", latin: "Mina", bangla: "Mina", weight: 400, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printMinaBold", label: "Mina bold", latin: "Mina", bangla: "Mina", weight: 700, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printTimes", label: "Times like", latin: "Tinos", bangla: "Noto Serif Bengali", weight: 400, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printTimesBold", label: "Times bold", latin: "Tinos", bangla: "Noto Serif Bengali", weight: 700, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printArial", label: "Arial like", latin: "Arimo", bangla: "Hind Siliguri", weight: 400, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printLight", label: "Print light", latin: "Hind Siliguri", bangla: "Hind Siliguri", weight: 300, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printBook", label: "Book", latin: "Libre Baskerville", bangla: "Tiro Bangla", weight: 400, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printSlab", label: "Slab", latin: "Roboto Slab", bangla: "Noto Serif Bengali", weight: 600, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printHeading", label: "Heading", latin: "Playfair Display", bangla: "Noto Serif Bengali", weight: 700, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printRound", label: "Rounded", latin: "Baloo Da 2", bangla: "Baloo Da 2", weight: 500, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printTypewriter", label: "Typewriter", latin: "Special Elite", bangla: "Noto Sans Bengali", weight: 400, jitter: 0.25, slant: 0, alpha: 0.93, color: "#1F1F1F" },
  { key: "printMono", label: "Mono", latin: "Courier Prime", bangla: "Noto Sans Bengali", weight: 400, jitter: 0, slant: 0, alpha: 1, color: "#111111" },
  { key: "printFaded", label: "Faded print", latin: "Noto Serif", bangla: "Noto Serif Bengali", weight: 400, jitter: 0.15, slant: 0, alpha: 0.82, color: "#2B2B2B" },
  // ---- more handwriting looks ----
  { key: "blackPen", label: "Black pen", latin: "Caveat", bangla: "Atma", weight: 600, jitter: 0.9, slant: -0.1, alpha: 0.97, color: "#111111" },
  { key: "redPen", label: "Teacher red", latin: "Patrick Hand", bangla: "Atma", weight: 500, jitter: 0.8, slant: -0.04, alpha: 0.96, color: "#DC2626" },
  { key: "fountain", label: "Fountain pen", latin: "Dancing Script", bangla: "Galada", weight: 600, jitter: 0.7, slant: -0.12, alpha: 0.92, color: "#1F2A5A" },
  { key: "kalam", label: "Kalam", latin: "Kalam", bangla: "Atma", weight: 400, jitter: 0.8, slant: -0.05, alpha: 0.96, color: "#1E3A8A" },
  { key: "indie", label: "Indie", latin: "Indie Flower", bangla: "Atma", weight: 400, jitter: 0.9, slant: 0, alpha: 0.95, color: "#111111" },
  { key: "shadows", label: "Light hand", latin: "Shadows Into Light", bangla: "Atma", weight: 400, jitter: 1, slant: -0.03, alpha: 0.9, color: "#374151" },
  { key: "handlee", label: "Handlee", latin: "Handlee", bangla: "Atma", weight: 400, jitter: 0.7, slant: 0, alpha: 0.96, color: "#111111" },
  { key: "architect", label: "Draft hand", latin: "Architects Daughter", bangla: "Atma", weight: 400, jitter: 0.6, slant: 0, alpha: 0.96, color: "#1E3A8A" },
  { key: "permMarker", label: "Thick marker", latin: "Permanent Marker", bangla: "Baloo Da 2", weight: 400, jitter: 0.7, slant: 0, alpha: 0.98, color: "#111111" },
  { key: "rockSalt", label: "Rough pen", latin: "Rock Salt", bangla: "Atma", weight: 400, jitter: 1.3, slant: -0.1, alpha: 0.95, color: "#111111" },
  { key: "satisfy", label: "Brush script", latin: "Satisfy", bangla: "Galada", weight: 400, jitter: 0.6, slant: -0.05, alpha: 0.96, color: "#1E3A8A" },
  { key: "sacramento", label: "Thin script", latin: "Sacramento", bangla: "Galada", weight: 400, jitter: 0.6, slant: -0.05, alpha: 0.94, color: "#111111" },
  { key: "kristi", label: "Signature", latin: "Kristi", bangla: "Galada", weight: 400, jitter: 0.8, slant: -0.08, alpha: 0.95, color: "#1E3A8A" },
  { key: "zeyada", label: "Quick hand", latin: "Zeyada", bangla: "Atma", weight: 400, jitter: 1.1, slant: -0.12, alpha: 0.95, color: "#111111" },
  { key: "coveredBy", label: "Round hand", latin: "Covered By Your Grace", bangla: "Atma", weight: 400, jitter: 1, slant: -0.05, alpha: 0.95, color: "#1D4ED8" },
  { key: "gochi", label: "Gochi", latin: "Gochi Hand", bangla: "Atma", weight: 400, jitter: 0.9, slant: 0, alpha: 0.96, color: "#111111" },
  { key: "tallHand", label: "Tall hand", latin: "Just Another Hand", bangla: "Atma", weight: 400, jitter: 0.8, slant: -0.04, alpha: 0.96, color: "#111111" },
  { key: "walter", label: "Notebook", latin: "Walter Turncoat", bangla: "Atma", weight: 400, jitter: 0.9, slant: 0, alpha: 0.95, color: "#1E3A8A" },
  { key: "schoolbell", label: "School hand", latin: "Schoolbell", bangla: "Atma", weight: 400, jitter: 0.9, slant: 0, alpha: 0.95, color: "#111111" },
  { key: "banglaSoft", label: "Soft Bangla", latin: "Caveat", bangla: "Baloo Da 2", weight: 500, jitter: 0.7, slant: -0.06, alpha: 0.96, color: "#1E3A8A" },
  { key: "banglaTall", label: "Tall Bangla", latin: "Patrick Hand", bangla: "Anek Bangla", weight: 400, jitter: 0.8, slant: -0.1, alpha: 0.96, color: "#111111" },
  { key: "banglaSlant", label: "Slanted Bangla", latin: "Reenie Beanie", bangla: "Mina", weight: 400, jitter: 1, slant: -0.18, alpha: 0.95, color: "#1D4ED8" },
];
// Styles the person copied from a document ("Take writing style from the page").
const customTextStyles = new Map<string, HandStyle>();
const CUSTOM_TEXT_KEY = "sohoj_custom_text_styles_v1";
const WRITE_COLORS = ["#1E3A8A", "#111111", "#DC2626", "#4B5563"];
const handStyleOf = (key?: string): HandStyle =>
  HANDWRITING_STYLES.find((s) => s.key === key) ||
  (key ? customTextStyles.get(key) : undefined) ||
  HANDWRITING_STYLES[0];
const handFontStack = (s: HandStyle): string =>
  `"${s.latin}", "${s.bangla}", "Atma", cursive`;
const loadedHandFonts = new Set<string>();
// Canvas can only use a web font once it has been downloaded, so wait for it.
const ensureHandwritingFont = async (s: HandStyle): Promise<void> => {
  if (typeof document === "undefined" || !document.fonts) return;
  if (loadedHandFonts.has(s.key)) return;
  try {
    await Promise.all([
      document.fonts.load(`${s.weight} 40px "${s.latin}"`, "Abc abc 0123"),
      document.fonts.load(
        `${s.weight} 40px "${s.bangla}"`,
        "অআকখ কিছু ০১২৩",
      ),
    ]);
    loadedHandFonts.add(s.key);
  } catch {
    // Fall back to the system font; the text is still written.
  }
};
const mulberry32 = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const drawHandwriting = (
  ctx: CanvasRenderingContext2D,
  rect: FractionRect,
  stroke: EraseStroke,
) => {
  const text = (stroke.text || "").replace(/\r/g, "").trim();
  if (!text) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const x0 = Math.round(rect.x0 * w);
  const y0 = Math.round(rect.y0 * h);
  const x1 = Math.round(rect.x1 * w);
  const y1 = Math.round(rect.y1 * h);
  const rw = x1 - x0;
  const rh = y1 - y0;
  if (rw < 4 || rh < 4) return;
  const st = handStyleOf(stroke.style);
  const rand = mulberry32(stroke.seed ?? 1);
  // Optionally wipe the old writing in the box first (paper-coloured patches).
  if (stroke.clearFirst) drawEraseArea(ctx, rect, 0, "erase", "#000000");
  const pad = Math.max(1, Math.min(rw, rh) * 0.02);
  const bw = (rw - pad * 2) * 0.98;
  const bh = rh - pad * 2;
  const LINE_H = 1.22;
  const fontAt = (size: number) =>
    `${st.weight} ${size}px ${handFontStack(st)}`;
  const paragraphs = text.split("\n");
  type Line = { words: { t: string; w: number }[]; width: number };
  const layout = (size: number) => {
    ctx.font = fontAt(size);
    const space = ctx.measureText(" ").width || size * 0.3;
    const lines: Line[] = [];
    let tooWide = false;
    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push({ words: [], width: 0 });
        continue;
      }
      let cur: Line = { words: [], width: 0 };
      for (const t of words) {
        const ww = ctx.measureText(t).width;
        if (ww > bw) tooWide = true;
        if (cur.words.length && cur.width + space + ww > bw) {
          lines.push(cur);
          cur = { words: [], width: 0 };
        }
        cur.width += (cur.words.length ? space : 0) + ww;
        cur.words.push({ t, w: ww });
      }
      lines.push(cur);
    }
    // Real ink height (tallest mark of the first line above the baseline, the
    // deepest mark of the last line below it) so the text sits exactly inside
    // the box that was dragged, not a bit too high or too low.
    let asc = 0;
    let desc = 0;
    for (const wd of lines[0]?.words ?? [])
      asc = Math.max(asc, ctx.measureText(wd.t).actualBoundingBoxAscent || 0);
    for (const wd of lines[lines.length - 1]?.words ?? [])
      desc = Math.max(desc, ctx.measureText(wd.t).actualBoundingBoxDescent || 0);
    if (!asc) asc = size * 0.8;
    if (!desc) desc = size * 0.2;
    const inkH = asc + (lines.length - 1) * size * LINE_H + desc;
    return { lines, space, asc, inkH, fits: !tooWide && inkH <= bh * 0.96 };
  };
  // Biggest text that still fits the box (binary search), then scale it down by
  // the person's size slider.
  let lo = 6;
  let hi = Math.max(8, Math.min(bh * 1.4, 900));
  if (layout(hi).fits) {
    lo = hi;
  } else {
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      if (layout(mid).fits) lo = mid;
      else hi = mid;
    }
  }
  const size = Math.max(5, lo * Math.min(1, Math.max(0.3, stroke.sizeMul ?? 1)));
  const L = layout(size);
  const jit = st.jitter;
  ctx.save();
  ctx.fillStyle = stroke.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = fontAt(size);
  let y = y0 + pad + (bh - L.inkH) / 2 + L.asc;
  for (const line of L.lines) {
    const startX = x0 + pad + (rand() - 0.5) * size * 0.06 * jit;
    const lineSlope = (rand() - 0.5) * 0.016 * jit; // each line drifts a little
    let x = startX;
    for (const wd of line.words) {
      const dy = (rand() - 0.5) * size * 0.05 * jit + lineSlope * (x - startX);
      const ang = (((rand() - 0.5) * 3.2 * jit) * Math.PI) / 180;
      const sc = 1 + (rand() - 0.5) * 0.08 * jit;
      ctx.save();
      ctx.translate(x + wd.w / 2, y + dy);
      ctx.rotate(ang);
      ctx.transform(1, 0, st.slant, 1, 0, 0);
      ctx.scale(sc, sc);
      ctx.globalAlpha = st.alpha * (1 - rand() * 0.1 * Math.min(1, jit));
      if (jit > 0) {
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = Math.max(0, size * 0.012);
      }
      ctx.fillText(wd.t, -wd.w / 2, 0);
      if (st.stroke && st.stroke > 0) {
        // Heavier ink than the font itself (copied from a bold document).
        ctx.lineWidth = Math.max(0.3, size * st.stroke);
        ctx.lineJoin = "round";
        ctx.strokeStyle = stroke.color;
        ctx.strokeText(wd.t, -wd.w / 2, 0);
      }
      ctx.restore();
      x += wd.w + L.space * (1 + (rand() - 0.3) * 0.4 * Math.min(1.5, jit));
    }
    y += size * LINE_H;
  }
  ctx.restore();
};
/* -------------------------------------------------------------------------- */
/*              Take the writing style (font) from a document                 */
/* -------------------------------------------------------------------------- */
// The person drags a box around a word / line of the document. We measure the
// ink (colour, lean, thickness), read the words, draw those words in every
// font we have and keep the font whose shape matches the document best.
type InkRead = {
  w: number;
  h: number;
  v: Float32Array; // ink strength 0..1 (paper = 0)
  mask: Uint8Array; // 1 = ink
  bx0: number;
  by0: number;
  bx1: number;
  by1: number; // trimmed box around the ink (x1 / y1 exclusive)
  color: string;
};
const inkBoxOf = (mask: Uint8Array, w: number, h: number) => {
  const rows = new Int32Array(h);
  const cols = new Int32Array(w);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (mask[y * w + x]) {
        rows[y]++;
        cols[x]++;
      }
  let mr = 0;
  let mc = 0;
  for (let y = 0; y < h; y++) mr = Math.max(mr, rows[y]);
  for (let x = 0; x < w; x++) mc = Math.max(mc, cols[x]);
  if (!mr || !mc) return null;
  const tr = Math.max(1, Math.round(mr * 0.04));
  const tc = Math.max(1, Math.round(mc * 0.04));
  let y0 = 0;
  while (y0 < h && rows[y0] < tr) y0++;
  let y1 = h;
  while (y1 > y0 && rows[y1 - 1] < tr) y1--;
  let x0 = 0;
  while (x0 < w && cols[x0] < tc) x0++;
  let x1 = w;
  while (x1 > x0 && cols[x1 - 1] < tc) x1--;
  if (x1 - x0 < 3 || y1 - y0 < 3) return null;
  return { x0, y0, x1, y1 };
};
const readInkFromCanvas = (
  src: HTMLCanvasElement,
  rect: FractionRect,
): InkRead | null => {
  const sx = Math.max(0, Math.round(rect.x0 * src.width));
  const sy = Math.max(0, Math.round(rect.y0 * src.height));
  const sw = Math.min(src.width - sx, Math.round((rect.x1 - rect.x0) * src.width));
  const sh = Math.min(src.height - sy, Math.round((rect.y1 - rect.y0) * src.height));
  if (sw < 6 || sh < 6) return null;
  const k = Math.max(0.25, Math.min(2, 140 / sh, 1200 / sw));
  const w = Math.max(6, Math.round(sw * k));
  const h = Math.max(6, Math.round(sh * k));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  if (!cx) return null;
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = "high";
  cx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
  const d = cx.getImageData(0, 0, w, h).data;
  const n = w * h;
  const lums = new Float32Array(n);
  for (let i = 0; i < n; i++)
    lums[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  // paper colour = mean of the brightest third
  const sorted = Float32Array.from(lums).sort();
  const cutoff = sorted[Math.min(n - 1, Math.floor(n * 0.67))];
  let pr = 0;
  let pg = 0;
  let pb = 0;
  let pc = 0;
  for (let i = 0; i < n; i++)
    if (lums[i] >= cutoff) {
      pr += d[i * 4];
      pg += d[i * 4 + 1];
      pb += d[i * 4 + 2];
      pc++;
    }
  pr = Math.max(1, pr / Math.max(1, pc));
  pg = Math.max(1, pg / Math.max(1, pc));
  pb = Math.max(1, pb / Math.max(1, pc));
  const v = new Float32Array(n);
  const nr = new Float32Array(n);
  const ng = new Float32Array(n);
  const nb = new Float32Array(n);
  const hist = new Float64Array(64);
  for (let i = 0; i < n; i++) {
    nr[i] = Math.min(255, (d[i * 4] / pr) * 255);
    ng[i] = Math.min(255, (d[i * 4 + 1] / pg) * 255);
    nb[i] = Math.min(255, (d[i * 4 + 2] / pb) * 255);
    const l = 0.299 * nr[i] + 0.587 * ng[i] + 0.114 * nb[i];
    v[i] = Math.min(1, Math.max(0, 1 - l / 255));
    hist[Math.min(63, Math.floor(v[i] * 64))]++;
  }
  // Otsu threshold between paper and ink
  let sumAll = 0;
  for (let b = 0; b < 64; b++) sumAll += b * hist[b];
  let wB = 0;
  let sumB = 0;
  let best = -1;
  let thrBin = 8;
  for (let b = 0; b < 64; b++) {
    wB += hist[b];
    if (!wB) continue;
    const wF = n - wB;
    if (!wF) break;
    sumB += b * hist[b];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      thrBin = b;
    }
  }
  const thr = Math.max(0.15, (thrBin + 1) / 64);
  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) mask[i] = v[i] >= thr ? 1 : 0;
  const box = inkBoxOf(mask, w, h);
  if (!box) return null;
  // ink colour = average of the darkest 35% of the ink pixels
  const inkVals: number[] = [];
  for (let i = 0; i < n; i++) if (mask[i]) inkVals.push(v[i]);
  inkVals.sort((a, b) => a - b);
  const cut = inkVals[Math.floor(inkVals.length * 0.65)] ?? thr;
  let r = 0;
  let g = 0;
  let b = 0;
  let c = 0;
  for (let i = 0; i < n; i++)
    if (mask[i] && v[i] >= cut) {
      r += nr[i];
      g += ng[i];
      b += nb[i];
      c++;
    }
  r /= Math.max(1, c);
  g /= Math.max(1, c);
  b /= Math.max(1, c);
  let color: string;
  if (Math.max(r, g, b) - Math.min(r, g, b) < 45) {
    const gr = Math.round(Math.min(120, (r + g + b) / 3));
    const hx = gr.toString(16).padStart(2, "0");
    color = `#${hx}${hx}${hx}`;
  } else {
    const hx = (x: number) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0");
    color = `#${hx(r)}${hx(g)}${hx(b)}`;
  }
  return { w, h, v, mask, bx0: box.x0, by0: box.y0, bx1: box.x1, by1: box.y1, color };
};
// How much the writing leans: the shear that makes the up-strokes most
// vertical. Positive = leaning to the right.
const inkLeanOf = (r: InkRead): number => {
  const pts: number[] = [];
  for (let y = r.by0; y < r.by1; y++)
    for (let x = r.bx0; x < r.bx1; x++) if (r.mask[y * r.w + x]) pts.push(x, y);
  if (pts.length < 40) return 0;
  const mid = (r.by0 + r.by1) / 2;
  const off = Math.ceil(0.5 * (r.by1 - r.by0)) + 2;
  const bins = new Int32Array(r.w + off * 2 + 2);
  let bestS = 0;
  let bestScore = -1;
  for (let s = -0.5; s <= 0.5001; s += 0.02) {
    bins.fill(0);
    for (let i = 0; i < pts.length; i += 2) {
      const xs = Math.round(pts[i] + s * (pts[i + 1] - mid)) + off;
      if (xs >= 0 && xs < bins.length) bins[xs]++;
    }
    let sc = 0;
    for (let i = 0; i < bins.length; i++) sc += bins[i] * bins[i];
    if (sc > bestScore) {
      bestScore = sc;
      bestS = s;
    }
  }
  return Math.max(-0.45, Math.min(0.45, bestS));
};
// Average thickness of the strokes (area / half the outline), in pixels.
const inkThicknessOf = (r: InkRead): number => {
  let area = 0;
  let edge = 0;
  for (let y = Math.max(1, r.by0); y < Math.min(r.h - 1, r.by1); y++)
    for (let x = Math.max(1, r.bx0); x < Math.min(r.w - 1, r.bx1); x++) {
      const i = y * r.w + x;
      if (!r.mask[i]) continue;
      area++;
      if (!r.mask[i - 1] || !r.mask[i + 1] || !r.mask[i - r.w] || !r.mask[i + r.w]) edge++;
    }
  return edge ? (2 * area) / edge : 0;
};
// Draws the words in one of our styles (plain, no wobble) and measures them
// the same way as the document crop.
const renderInkSample = (text: string, st: HandStyle): InkRead | null => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (!lines.length) return null;
  const SIZE = 80;
  const font = `${st.weight} ${SIZE}px ${handFontStack(st)}`;
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return null;
  probe.font = font;
  const wide = Math.min(2400, Math.ceil(Math.max(...lines.map((l) => probe.measureText(l).width))) + 60);
  const lh = Math.round(SIZE * 1.5);
  const cv = document.createElement("canvas");
  cv.width = Math.max(40, wide);
  cv.height = lines.length * lh + 40;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  if (!cx) return null;
  cx.fillStyle = "#ffffff";
  cx.fillRect(0, 0, cv.width, cv.height);
  cx.fillStyle = "#000000";
  cx.font = font;
  cx.textBaseline = "alphabetic";
  lines.forEach((l, i) => cx.fillText(l, 30, 30 + SIZE + i * lh));
  const d = cx.getImageData(0, 0, cv.width, cv.height).data;
  const n = cv.width * cv.height;
  const v = new Float32Array(n);
  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    v[i] = 1 - (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    mask[i] = v[i] > 0.5 ? 1 : 0;
  }
  const box = inkBoxOf(mask, cv.width, cv.height);
  if (!box) return null;
  return { w: cv.width, h: cv.height, v, mask, bx0: box.x0, by0: box.y0, bx1: box.x1, by1: box.y1, color: "#000000" };
};
const inkGridOf = (r: InkRead, GW: number, GH: number): Float32Array => {
  const out = new Float32Array(GW * GH);
  const bw = r.bx1 - r.bx0;
  const bh = r.by1 - r.by0;
  for (let gy = 0; gy < GH; gy++) {
    const ya = r.by0 + (gy * bh) / GH;
    const yb = r.by0 + ((gy + 1) * bh) / GH;
    const y0 = Math.floor(ya);
    const y1 = Math.max(y0 + 1, Math.ceil(yb));
    for (let gx = 0; gx < GW; gx++) {
      const xa = r.bx0 + (gx * bw) / GW;
      const xb = r.bx0 + ((gx + 1) * bw) / GW;
      const x0 = Math.floor(xa);
      const x1 = Math.max(x0 + 1, Math.ceil(xb));
      let sum = 0;
      let cnt = 0;
      for (let y = y0; y < y1 && y < r.h; y++)
        for (let x = x0; x < x1 && x < r.w; x++) {
          sum += r.mask[y * r.w + x];
          cnt++;
        }
      out[gy * GW + gx] = cnt ? sum / cnt : 0;
    }
  }
  // a light blur so tiny shifts do not matter
  const tmp = new Float32Array(out.length);
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      let acc = 0;
      let c = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue;
          acc += out[yy * GW + xx];
          c++;
        }
      tmp[y * GW + x] = acc / c;
    }
  return tmp;
};
const matchTextStyle = (
  crop: InkRead,
  text: string,
  candidates: HandStyle[],
): { style: HandStyle; score: number; sample: InkRead } | null => {
  const nLines = Math.min(3, Math.max(1, text.split("\n").filter((l) => l.trim()).length));
  const GW = 128;
  const GH = 28 * nLines;
  const cg = inkGridOf(crop, GW, GH);
  const arC = (crop.bx1 - crop.bx0) / Math.max(1, crop.by1 - crop.by0);
  let best: { style: HandStyle; score: number; sample: InkRead } | null = null;
  for (const st of candidates) {
    const sample = renderInkSample(text, st);
    if (!sample) continue;
    const sg = inkGridOf(sample, GW, GH);
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < cg.length; i++) {
      dot += cg[i] * sg[i];
      na += cg[i] * cg[i];
      nb += sg[i] * sg[i];
    }
    if (!na || !nb) continue;
    const cos = dot / Math.sqrt(na * nb);
    const arS = (sample.bx1 - sample.bx0) / Math.max(1, sample.by1 - sample.by0);
    const arFit = Math.exp(-2 * Math.abs(Math.log(arC / arS)));
    const score = cos * (0.55 + 0.45 * arFit);
    if (!best || score > best.score) best = { style: st, score, sample };
  }
  return best;
};
// Small picture of the copied text (ink colour on a see-through background).
const inkThumbOf = (r: InkRead): string => {
  const bw = r.bx1 - r.bx0;
  const bh = r.by1 - r.by0;
  const src = document.createElement("canvas");
  src.width = bw;
  src.height = bh;
  const sctx = src.getContext("2d");
  if (!sctx) return "";
  const rgb = hexToRgb(r.color) || [17, 17, 17];
  const im = sctx.createImageData(bw, bh);
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      const vv = r.v[(y + r.by0) * r.w + (x + r.bx0)];
      const o = (y * bw + x) * 4;
      im.data[o] = rgb[0];
      im.data[o + 1] = rgb[1];
      im.data[o + 2] = rgb[2];
      im.data[o + 3] = Math.round(Math.min(1, vv * 1.2) * 255);
    }
  sctx.putImageData(im, 0, 0);
  const sc = Math.min(2, 36 / bh, 130 / bw);
  const out = document.createElement("canvas");
  out.width = Math.max(4, Math.round(bw * sc));
  out.height = Math.max(4, Math.round(bh * sc));
  const octx = out.getContext("2d");
  if (!octx) return "";
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(src, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
};
/* -------------------------------------------------------------------------- */
/*                 Punctuation marks (danda, comma, ; : . ? ! ...)            */
/* -------------------------------------------------------------------------- */
// Brings back marks that Document Clean / the eraser removed. One click puts
// one mark; its ink is centred exactly on the clicked point.
// Page margins (in mm) used by Print, PDF download and image Download.
type PageMargins = { top: number; right: number; bottom: number; left: number };
const NO_MARGINS: PageMargins = { top: 0, right: 0, bottom: 0, left: 0 };
const MAX_MARGIN_MM = 40;
const MARGIN_PRESETS: { label: string; mm: number }[] = [
  { label: "None", mm: 0 },
  { label: "Small", mm: 5 },
  { label: "Normal", mm: 10 },
  { label: "Large", mm: 20 },
];
const hasPageMargins = (m: PageMargins): boolean =>
  m.top + m.right + m.bottom + m.left > 0;
const PUNCT_MARKS = [
  "।", "॥", ",", ";", ":", ".",
  "?", "!", "-", "–", "'", "\"",
  "‘", "’", "“", "”", "(", ")",
  "[", "]", "/", "…", "*", "%",
];
const PUNCT_STYLE_KEYS: HandStyleKey[] = [
  "printSans",
  "printSerif",
  "neat",
  "ballpen",
];
const drawPunctuation = (ctx: CanvasRenderingContext2D, stroke: EraseStroke) => {
  const mark = (stroke.text || "").trim();
  const p = stroke.pts[0];
  if (!mark || !p) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const st = handStyleOf(stroke.style);
  const rand = mulberry32(stroke.seed ?? 1);
  const mul = Math.min(1, Math.max(0.01, stroke.sizeMul ?? 0.35));
  const size = Math.max(8, w * (0.012 + mul * 0.045));
  const cx = p.x * w;
  const cy = p.y * h;
  ctx.save();
  ctx.font = `${st.weight} ${size}px ${handFontStack(st)}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(mark);
  const left = m.actualBoundingBoxLeft ?? 0;
  const right = m.actualBoundingBoxRight ?? m.width;
  const asc = m.actualBoundingBoxAscent ?? size * 0.7;
  const desc = m.actualBoundingBoxDescent ?? size * 0.1;
  // Move so the middle of the real ink sits on the clicked point.
  const ox = -(right - left) / 2;
  const oy = -(desc - asc) / 2;
  ctx.translate(cx, cy);
  if (st.jitter > 0) {
    ctx.rotate((((rand() - 0.5) * 3 * st.jitter) * Math.PI) / 180);
    ctx.globalAlpha = st.alpha * (1 - rand() * 0.08);
  }
  ctx.fillStyle = stroke.color;
  ctx.fillText(mark, ox, oy);
  ctx.restore();
};
// "Erase the old writing first" for the other tools: before the new mark is
// drawn, the paper under it is painted over with the paper colour.
const clearUnderLine = (ctx: CanvasRenderingContext2D, pts: Point[], r: number) => {
  if (pts.length < 2) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const a = pts[0];
  const b = pts[pts.length - 1];
  const band = Math.max(r * 2.5, 0.004);
  const len = Math.hypot((b.x - a.x) * w, (b.y - a.y) * h);
  if (len < 1) return;
  const step = Math.max(2, band * w * 0.7);
  const n = Math.max(1, Math.ceil(len / step));
  const dense: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    dense.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  drawEraseSegments(ctx, dense, band, 0, "erase", "#000000");
};
const clearUnderPunct = (ctx: CanvasRenderingContext2D, stroke: EraseStroke) => {
  const p = stroke.pts[0];
  if (!p) return;
  const mul = Math.min(1, Math.max(0.01, stroke.sizeMul ?? 0.35));
  drawEraseSegments(ctx, [p], (0.012 + mul * 0.045) * 0.6, 0, "erase", "#000000");
};
// A border only needs the thin band along its four edges cleared (clearing the
// whole box would wipe the text inside it).
const clearBorderRing = (
  ctx: CanvasRenderingContext2D,
  rect: FractionRect,
  r: number,
) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const x0 = rect.x0 * w;
  const y0 = rect.y0 * h;
  const x1 = rect.x1 * w;
  const y1 = rect.y1 * h;
  const t = Math.max(1.5, r * w * 2);
  const band = Math.min(Math.max(6, t * 6), Math.min(x1 - x0, y1 - y0) / 3);
  const strip = (ax: number, ay: number, bx: number, by: number) =>
    drawEraseArea(
      ctx,
      { x0: ax / w, y0: ay / h, x1: bx / w, y1: by / h },
      0,
      "erase",
      "#000000",
    );
  strip(x0, y0, x1, y0 + band);
  strip(x0, y1 - band, x1, y1);
  strip(x0, y0 + band, x0 + band, y1 - band);
  strip(x1 - band, y0 + band, x1, y1 - band);
};
const paintStrokeOn = (
  ctx: CanvasRenderingContext2D,
  stroke: EraseStroke,
  fromIndex: number,
  colorCtx?: CanvasRenderingContext2D | null,
) => {
  if (stroke.tool === "stamp" || stroke.tool === "recolor") {
    paintStampStroke(ctx, stroke, fromIndex, colorCtx);
    return;
  }
  if (stroke.tool === "seal" && stroke.rect) {
    if (fromIndex === 0) drawSealStroke(ctx, stroke);
    return;
  }
  if (stroke.tool === "punct") {
    if (fromIndex === 0) {
      if (stroke.clearFirst) clearUnderPunct(ctx, stroke);
      drawPunctuation(ctx, stroke);
    }
    return;
  }
  if (stroke.tool === "write" && stroke.rect) {
    if (fromIndex === 0) drawHandwriting(ctx, stroke.rect, stroke);
    return;
  }
  if (stroke.tool === "dots" || stroke.tool === "underline") {
    if (fromIndex === 0) {
      if (stroke.clearFirst) clearUnderLine(ctx, stroke.pts, stroke.r);
      drawLineMark(ctx, stroke.pts, stroke.r, stroke.tool, stroke.color);
    }
    return;
  }
  if (stroke.rect) {
    if (fromIndex === 0 && stroke.clearFirst && stroke.tool === "border")
      clearBorderRing(ctx, stroke.rect, stroke.r);
    if (fromIndex === 0)
      drawEraseArea(
        ctx,
        stroke.rect,
        stroke.r,
        stroke.tool,
        stroke.color,
        stroke.style,
      );
    return;
  }
  drawEraseSegments(ctx, stroke.pts, stroke.r, fromIndex, stroke.tool, stroke.color);
};

/* -------------------------------------------------------------------------- */
/*                      One-click document tool: invert                       */
/* -------------------------------------------------------------------------- */
const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};
const copyCanvas = (src: HTMLCanvasElement): HTMLCanvasElement => {
  const out = makeCanvas(src.width, src.height);
  out.getContext("2d")?.drawImage(src, 0, 0);
  return out;
};
const invertCanvas = (src: HTMLCanvasElement): HTMLCanvasElement => {
  const out = copyCanvas(src);
  const ctx = out.getContext("2d");
  if (!ctx) return src;
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
  ctx.putImageData(img, 0, 0);
  return out;
};

/* -------------------------------------------------------------------------- */
/*            Page-specific natural Bangla translation layer                 */
/* -------------------------------------------------------------------------- */
const DOCUMENT_EXACT: Record<string, string> = {
  "document print": "ডকুমেন্ট প্রিন্ট",
  "document clean": "ডকুমেন্ট পরিষ্কার করুন",
  "color document": "ডকুমেন্টে রঙ দিন",
  eraser: "ইরেজার",
  "eraser size": "ব্রাশের সাইজ",
  "undo last stroke": "শেষ স্ট্রোক ফেরান",
  "done editing": "কাজ শেষ",
  "free hand": "ফ্রি হ্যান্ড",
  "select area": "এরিয়া (বক্স)",
  "drag a box over the area — it is erased or marked as soon as you let go.":
    "বক্স টেনে এরিয়া সিলেক্ট করুন — ছেড়ে দিলেই ওই অংশে কাজ হয়ে যাবে।",
  "document tools": "ডকুমেন্ট টুলস",
  "remove stamp": "সিল / স্ট্যাম্প সরান",
  "circle (drag out)": "গোল (টেনে বড় করুন)",
  "stamp removal strength": "সিল মোছার শক্তি",
  "restore color": "রঙ ফিরিয়ে আনুন",
  "colour restore strength": "রঙ ফিরিয়ে আনার শক্তি",
  "press at one edge of the stamp and drag to the opposite edge — the circle is drawn between the two points. let go and the stamp gets its colour back inside it.":
    "সিলের এক কিনারায় চেপে ধরে উল্টো কিনারা পর্যন্ত টানুন — দুই পয়েন্টের মাঝে বৃত্ত তৈরি হবে। ছেড়ে দিলে বৃত্তের ভেতরের সিলের রঙ ফিরে আসবে।",
  "drag a box over the stamp — it gets its colour back as soon as you let go.":
    "সিলের ওপর বক্স টেনে ছেড়ে দিন — সাথে সাথে সিলের রঙ ফিরে আসবে।",
  "press at one edge of the stamp and drag to the opposite edge — the circle is drawn between the two points. let go and the stamp inside it is removed.":
    "সিলের এক কিনারায় চেপে ধরে উল্টো কিনারা পর্যন্ত টানুন — দুই পয়েন্টের মাঝে বৃত্ত তৈরি হবে। ছেড়ে দিলে বৃত্তের ভেতরের সিল মুছে যাবে।",
  "drag a box over the stamp — it is removed as soon as you let go.":
    "সিলের ওপর বক্স টেনে ছেড়ে দিন — সাথে সাথে সিল মুছে যাবে।",
  "paint over the stamp with the brush — coloured stamp ink is removed, black writing stays.":
    "ব্রাশ দিয়ে সিলের ওপর ঘষুন — সিলের রঙ মুছে যাবে, কালো লেখা থেকে যাবে।",
  "faint stamp still visible? raise the strength and try again. works on coloured stamps (blue, red, purple).":
    "সিলের হালকা দাগ থেকে গেলে শক্তি বাড়িয়ে আবার চেষ্টা করুন। রঙিন সিলে (নীল, লাল, বেগুনি) কাজ করে।",
  "markup & eraser": "মার্কআপ ও ইরেজার",
  pen: "কলম",
  highlighter: "হাইলাইটার",
  "black marker": "কালো মার্কার",
  "pen color": "কলমের রঙ",
  "highlighter color": "হাইলাইটারের রঙ",
  "invert colors": "রঙ উল্টান",
  "eraser / pen": "ইরেজার / কলম",
  "drag over writing or marks to erase them from the paper.":
    "কাগজের লেখা বা দাগের ওপর টেনে এনে মুছে ফেলুন।",
  "scanned document": "স্ক্যান করা ডকুমেন্ট",
  "remove the last deblur & sharpen step.":
    "সর্বশেষ ঝাপসা দূর ও লেখা স্পষ্ট করার ধাপটি সরান।",
  "this cannot be removed separately after cropping or erasing — press undo.":
    "ক্রপ বা ইরেজার ব্যবহারের পর এটি আলাদাভাবে সরানো যাবে না—পূর্বাবস্থায় ফিরতে আনডু চাপুন।",

  "all kind of documents print ready.":
    "বিভিন্ন ধরনের ডকুমেন্ট প্রিন্টের জন্য প্রস্তুত করুন।",
  print: "প্রিন্ট করুন",
  "pdf download": "PDF ডাউনলোড করুন",
  download: "ডাউনলোড করুন",
  "full reset": "সবকিছু পুনরায় সেট করুন",
  replace: "ছবি পরিবর্তন করুন",
  rotate: "ঘোরান",
  "upload document": "ডকুমেন্ট আপলোড করুন",
  cancel: "বাতিল করুন",
  "saving document...": "ডকুমেন্ট সেভ করা হচ্ছে...",
  "uploading image and saving your record":
    "ছবি আপলোড ও আপনার তথ্য সেভ করা হচ্ছে",
  "reset view": "দৃশ্য পুনরায় সেট করুন",
  "x - use + / − to zoom": "× — + / − দিয়ে জুম করুন",
  "x - ctrl + scroll to zoom, drag to move":
    "× — Ctrl + স্ক্রল করে জুম, টেনে সরান",
  "custom color": "নিজের পছন্দের রঙ",
  move: "সরান (হাত)",
  "move the document (drag)": "ডকুমেন্ট ধরে সরান (টেনে)",
  crop: "ক্রপ",
  "auto crop": "স্বয়ংক্রিয় ক্রপ",
  "manual crop": "ম্যানুয়াল ক্রপ",
  magic: "ডকুমেন্ট উন্নত করুন",
  "enhance document": "ডকুমেন্ট উন্নত করুন",
  undo: "পূর্বাবস্থায় ফিরুন",
  mode: "মোড",
  "showing original...": "মূল ছবি দেখানো হচ্ছে...",
  "hold for normal (original)": "মূল ছবি (চেপে ধরুন)",
  adjustments: "ছবির সমন্বয়",
  reset: "পুনরায় সেট করুন",
  black: "কালচে ভাব",
  color: "রঙ",
  contrast: "কনট্রাস্ট",
  "saved document preview": "সেভ করা ডকুমেন্টের পূর্বরূপ",
  "modify document": "ডকুমেন্ট পরিবর্তন করুন",
  "save current document?": "বর্তমান ডকুমেন্টটি সেভ করবেন?",
  "you can save your current work before switching to another document.":
    "অন্য ডকুমেন্টে যাওয়ার আগে আপনার বর্তমান কাজটি সেভ করে নিতে পারেন।",
  no: "না",
  "saving...": "সেভ করা হচ্ছে...",
  "yes, save": "হ্যাঁ, সেভ করুন",
  "saved documents": "সেভ করা ডকুমেন্ট",
  "saved documents are linked to your account.":
    "সেভ করা ডকুমেন্ট আপনার অ্যাকাউন্টের সঙ্গে যুক্ত থাকে।",
  saved: "সেভ করা হয়েছে",
  "saved documents load হচ্ছে...": "সেভ করা ডকুমেন্ট লোড হচ্ছে...",
  "এখনও কোনো document save করা হয়নি।": "এখনও কোনো ডকুমেন্ট সেভ করা হয়নি।",
  "crop, clean এবং adjustment শেষ করে উপরের save document চাপো।":
    "ক্রপ, পরিষ্কার ও ছবির সমন্বয় শেষ করে উপরের “ডকুমেন্ট সেভ করুন” বোতামে চাপুন।",
  "deleting...": "মুছে ফেলা হচ্ছে...",
  "just now": "এইমাত্র",
  "document clean দিয়ে document আরও সুন্দর ও clean করুন a4 print ready":
    "ডকুমেন্ট ক্লিন ব্যবহার করে ডকুমেন্ট আরও পরিষ্কার করে A4 প্রিন্টের জন্য প্রস্তুত করুন।",
  "download image": "ছবি ডাউনলোড করুন",
  "fix blur": "ঝাপসা ঠিক করুন",
  "fix blur again": "আবারও ঝাপসা ঠিক করুন",
  "fix blur has reached the maximum.":
    "ঝাপসা ঠিক করার সর্বোচ্চ সীমায় পৌঁছে গেছে।",
  "remove the last fix blur step.":
    "সর্বশেষ ঝাপসা ঠিক করার ধাপটি সরান।",
  "blurry photo?": "ছবি ঝাপসা?",
  important: "গুরুত্বপূর্ণ",
  "photo blurry? first press fix blur.":
    "ছবি ঝাপসা? আগে “ঝাপসা ঠিক করুন” চাপুন।",
  "then press document clean.": "তারপর “ডকুমেন্ট ক্লিন” চাপুন।",
  "photo already sharp? skip fix blur — go straight to document clean.":
    "ছবি আগে থেকেই পরিষ্কার? ঝাপসা ঠিক করার দরকার নেই — সরাসরি ডকুমেন্ট ক্লিন করুন।",
  "dotted line & underline": "ডটেড লাইন ও আন্ডারলাইন",
  "lines & borders": "লাইন ও বাউন্ডারি",
  border: "বাউন্ডারি",
  "border thickness": "বাউন্ডারির মোটা-চিকন",
  "pick a border style, then drag a box — the border is drawn around it as soon as you let go.":
    "একটা বাউন্ডারির ডিজাইন বেছে নিয়ে বক্স টানুন — ছেড়ে দিলেই বক্সের চারপাশে বাউন্ডারি বসে যাবে।",
  line: "সাধারণ লাইন",
  thick: "মোটা লাইন",
  double: "ডবল লাইন",
  "thick + thin": "মোটা + চিকন",
  triple: "ট্রিপল লাইন",
  rounded: "গোল কোণা",
  dashed: "ড্যাশ",
  "dash-dot": "ড্যাশ-ডট",
  dotted: "ডটেড",
  wave: "ঢেউ",
  zigzag: "জিগজ্যাগ",
  scallop: "স্ক্যালপ",
  chain: "চেইন",
  corners: "কোণা",
  squares: "চৌকো কোণা",
  "certificate": "সার্টিফিকেট",
  "checker band": "চেকার ব্যান্ড",
  "greek key": "গ্রিক কী",
  "railroad": "রেলপথ",
  "beads": "পুঁতির মালা",
  "diamonds": "হীরা",
  "stars": "তারা",
  "sawtooth": "করাত দাঁত",
  "cut corners": "কাটা কোণা",
  "ticket": "টিকিট কোণা",
  "solid + dashed": "লাইন + ড্যাশ",
  "line + dots": "লাইন + ডট",
  "diagonal band": "তির্যক ব্যান্ড",
  "arches": "খিলান",
  "wave band": "ঢেউ ব্যান্ড",
  "round knobs": "গোল নব কোণা",
  "double rounded": "ডবল গোল কোণা",
  "thin + thick": "চিকন + মোটা",
  "thick-thin-thick": "মোটা-চিকন-মোটা",
  "corner diamonds": "কোণায় হীরা",
  "crosses": "ক্রস",
  handwriting: "হাতের লেখা",
  "write text": "লেখা বসান",
  "handwriting style": "হাতের লেখার স্টাইল",
  "text color": "লেখার রঙ",
  "text size": "লেখার সাইজ",
  "type your text here (bangla or english)…":
    "এখানে লিখুন (বাংলা বা ইংরেজি)…",
  "type your text, pick a hand style, then drag a box where it should go — it is written there like real handwriting.":
    "লেখাটি টাইপ করুন, হাতের লেখার স্টাইল বেছে নিন, তারপর যেখানে বসাতে চান সেখানে বক্স টানুন — ছেড়ে দিলেই সেখানে আসল হাতের লেখার মতো বসে যাবে।",
  "type some text first, then drag a box.":
    "আগে কিছু লিখুন, তারপর বক্স টানুন।",
  "erase the old writing in the box first":
    "বক্সের ভেতরের পুরনো লেখা আগে মুছে নিন",
  "ball pen": "বলপেন",
  neat: "গোছানো",
  "quick note": "দ্রুত নোট",
  cursive: "কার্সিভ",
  "pen script": "কলমের লেখা",
  marker: "মার্কার",
  pencil: "পেন্সিল",
  bold: "মোটা",
  "print sans": "ছাপা সাধারণ",
  "print serif": "ছাপা সেরিফ",
  "print bold": "ছাপা মোটা",
  "print classic": "ছাপা ক্লাসিক",
  "tool options": "টুলের অপশন",
  "loading handwriting font…": "হাতের লেখার ফন্ট লোড হচ্ছে…",
  "dotted line": "ডটেড লাইন",
  underline: "আন্ডারলাইন",
  punctuation: "যতিচিহ্ন",
  "page margin": "পাতার মার্জিন",
  "applies to print, pdf download and download.":
    "প্রিন্ট, পিডিএফ ডাউনলোড ও ডাউনলোডে প্রযোজ্য।",
  none: "কোনো মার্জিন নয়",
  small: "ছোট",
  normal: "মাঝারি",
  large: "বড়",
  top: "ওপর",
  bottom: "নিচ",
  left: "বাম",
  right: "ডান",
  "same on all sides": "চারদিকে সমান",
  "document style (printed)": "ডকুমেন্টের লেখার স্টাইল (ছাপা)",
  "read text from the document": "ডকুমেন্ট থেকে লেখা পড়ুন",
  "cancel reading": "পড়া বাতিল করুন",
  "drag a box over the text in the document — it is read and put in the text box below.":
    "ডকুমেন্টের যে লেখাটা নিতে চান তার ওপর বক্স টানুন — লেখাটা পড়ে নিচের বক্সে বসে যাবে।",
  "reading text…": "লেখা পড়া হচ্ছে…",
  "no text found in that area. try a tighter box.":
    "ওই এলাকায় কোনো লেখা পাওয়া যায়নি। আরেকটু ছোট করে বক্স টানুন।",
  "could not read the text. check your internet and try again.":
    "লেখা পড়া যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।",
  "tip: you can also paste a screenshot (ctrl + v) into the text box. the first time it downloads bangla reading data.":
    "টিপস: টেক্সট বক্সে স্ক্রিনশট পেস্ট (Ctrl + V) করলেও লেখা পড়ে নেবে। প্রথমবার বাংলা পড়ার ডেটা ডাউনলোড হবে।",
  "pick a mark": "একটা চিহ্ন বেছে নিন",
  "or type your own mark…": "অথবা নিজের চিহ্ন লিখুন…",
  "pick a mark first.": "আগে একটা চিহ্ন বেছে নিন।",
  "mark style": "চিহ্নের স্টাইল",
  "mark color": "চিহ্নের রঙ",
  "mark size": "চিহ্নের সাইজ",
  "pick a mark (or type your own), then click where it should go — it is placed there. on touch, drag to fine-tune before you lift.":
    "একটা চিহ্ন বেছে নিন (বা নিজের চিহ্ন লিখুন), তারপর যেখানে বসাতে চান সেখানে ক্লিক করুন — চিহ্নটি ঠিক সেখানে বসে যাবে। টাচ স্ক্রিনে আঙুল তোলার আগে টেনে ঠিক জায়গায় নিন।",
  "line color": "লাইনের রঙ",
  "dot / line size": "ডট / লাইনের সাইজ",
  "drag from where the line should start to where it should end — dots or underline are drawn there.":
    "যেখান থেকে লাইন শুরু হবে সেখান থেকে যেখানে শেষ হবে সেই পর্যন্ত টানুন — ওই জায়গায় ডট বা আন্ডারলাইন বসে যাবে।",
  "if your photo is blurry, first press fix blur, then document clean. if it is already sharp, skip fix blur and go straight to document clean.":
    "ছবি ঝাপসা হলে আগে “ঝাপসা ঠিক করুন” চাপুন, তারপর “ডকুমেন্ট ক্লিন” করুন। ছবি আগে থেকেই পরিষ্কার থাকলে ঝাপসা ঠিক করার দরকার নেই, সরাসরি ডকুমেন্ট ক্লিন করুন।",
  "deblur & sharpen again": "আবারও ঝাপসা দূর ও লেখা স্পষ্ট করুন",
  "deblur & sharpen": "ঝাপসা দূর ও লেখা স্পষ্ট করুন",
  "deblur & sharpen has reached the maximum.":
    "ঝাপসা দূর ও লেখা স্পষ্ট করার সর্বোচ্চ সীমায় পৌঁছে গেছে।",
  "reset only adjustments": "শুধু ছবির সমন্বয়গুলো পুনরায় সেট করুন",
  "back to tools": "টুলস-এ ফিরে যান",
  "close preview": "পূর্বরূপ বন্ধ করুন",
  "compare original & cleaned": "মূল ছবি ও পরিষ্কার করা ছবির তুলনা করুন",
  "delete saved document": "সেভ করা ডকুমেন্ট মুছুন",
  "next document page": "পরের ডকুমেন্টে যান",
  preview: "পূর্বরূপ",
  "previous document page": "আগের ডকুমেন্টে যান",
  "replace current image with a new file": "বর্তমান ছবির পরিবর্তে নতুন ছবি দিন",
  "reset all edits, crops, and adjustments to original state":
    "সব সম্পাদনা, ক্রপ ও সমন্বয় মূল অবস্থায় ফিরিয়ে দিন",
  "save the current final document to cloudinary and mongodb":
    "বর্তমান চূড়ান্ত ডকুমেন্টটি সেভ করুন",
  thumbnail: "ছবির ক্ষুদ্র পূর্বরূপ",
  "document to print": "প্রিন্ট করার ডকুমেন্ট",
  cleaned: "পরিষ্কার করা ছবি",
  original: "মূল ছবি",
  "finish manual crop first": "আগে ম্যানুয়াল ক্রপ শেষ করুন",
  "rotate document 90°": "ডকুমেন্ট ৯০° ঘোরান",
  "save changes": "পরিবর্তন সেভ করুন",
  "save document": "ডকুমেন্ট সেভ করুন",
  process: "প্রক্রিয়া",
  "processing image...": "ছবি প্রক্রিয়াকরণ করা হচ্ছে...",
  "starting ai engine…": "AI ইঞ্জিন চালু হচ্ছে…",
  "loading opencv… auto crop will start as soon as it is ready.":
    "OpenCV লোড হচ্ছে… প্রস্তুত হলেই স্বয়ংক্রিয় ক্রপ শুরু হবে।",
  "auto crop is running…": "স্বয়ংক্রিয় ক্রপ চলছে…",
  "cleaning document…": "ডকুমেন্ট পরিষ্কার করা হচ্ছে…",
  "coloring document…": "ডকুমেন্টে রঙ প্রয়োগ করা হচ্ছে…",
  "saved.": "সেভ করা হয়েছে।",
};

const DOCUMENT_EXTRA: Record<string, string> = {
  "straighten page": "পেজ সোজা করুন",
  "the page already looks straight.": "পেজ আগে থেকেই সোজা আছে।",
  "noto sans": "নোটো সান্স",
  "noto sans bold": "নোটো সান্স মোটা",
  anek: "অনেক",
  "anek bold": "অনেক মোটা",
  mina: "মিনা",
  "mina bold": "মিনা মোটা",
  "times like": "টাইমস ধাঁচ",
  "times bold": "টাইমস মোটা",
  "arial like": "এরিয়াল ধাঁচ",
  "print light": "ছাপা হালকা",
  book: "বইয়ের লেখা",
  slab: "স্ল্যাব",
  heading: "শিরোনাম",
  rounded: "গোলাকার",
  typewriter: "টাইপরাইটার",
  mono: "মনো",
  "faded print": "ফিকে ছাপা",
  "black pen": "কালো কলম",
  "teacher red": "শিক্ষকের লাল",
  "fountain pen": "ফাউন্টেন পেন",
  kalam: "কলম হাত",
  indie: "ইন্ডি",
  "light hand": "হালকা হাত",
  handlee: "হ্যান্ডলি",
  "draft hand": "খসড়া হাত",
  "thick marker": "মোটা মার্কার",
  "rough pen": "এবড়োখেবড়ো কলম",
  "brush script": "ব্রাশ লেখা",
  "thin script": "সরু কার্সিভ",
  signature: "স্বাক্ষর ধাঁচ",
  "quick hand": "দ্রুত হাত",
  "round hand": "গোল হাত",
  gochi: "গোচি",
  "tall hand": "লম্বা হাত",
  notebook: "খাতার লেখা",
  "school hand": "স্কুলের লেখা",
  "soft bangla": "নরম বাংলা",
  "tall bangla": "লম্বা বাংলা",
  "slanted bangla": "ঢালু বাংলা",
  "copied style": "কপি করা স্টাইল",
  "take writing style from the page": "ডকুমেন্ট থেকে লেখার স্টাইল নিন",
  "copying writing style…": "লেখার স্টাইল কপি হচ্ছে…",
  "now drag a box around the text… (click to cancel)":
    "এখন লেখার চারপাশে বক্স টানুন… (বাতিল করতে ক্লিক করুন)",
  "drag a box tightly around a word or line of the document text — its writing style is copied and saved.":
    "ডকুমেন্টের একটা শব্দ বা লাইনের ঠিক চারপাশে বক্স টানুন — ওই লেখার স্টাইল কপি হয়ে সেভ হবে। পরে যেকোনো ডকুমেন্টে ব্যবহার করতে পারবেন।",
  "closest font": "সবচেয়ে কাছের ফন্ট",
  "could not match a font. colour, lean and thickness were copied.":
    "ফন্ট মেলানো যায়নি। রঙ, ঢাল আর মোটা-পাতলা ভাবটা কপি হয়েছে।",
  "could not copy the writing style. please try again.":
    "লেখার স্টাইল কপি করা যায়নি। আবার চেষ্টা করুন।",
  "add seal": "সিল বসান",
  "paint by hand": "হাত দিয়ে রং দিন",
  "brush size": "ব্রাশের সাইজ",
  "rub the brush over the seal — only the seal's ink under the brush changes colour (same result as box and circle). writing stays black.":
    "সিলের ওপর ব্রাশ ঘষুন — ব্রাশের নিচের সিলের কালিটাই শুধু নতুন রঙ হবে (বক্স ও গোলের মতোই একই ফল)। কালো লেখা কালোই থাকবে। ঘষা শেষে ছেড়ে দিলে রং বসবে।",
  "take seal from the page": "ছবি থেকে সিল নিন (কপি করে ডিজাইনে রাখুন)",
  "now drag a box around the seal… (click to cancel)":
    "এখন সিলের চারপাশে বক্স টানুন… (বাতিল করতে ক্লিক করুন)",
  "drag a box tightly around the seal on the page — it is copied and saved as a new seal design.":
    "পেজে সিলের ঠিক চারপাশে বক্স টানুন — সিলটা কপি হয়ে নতুন সিল ডিজাইন হিসেবে সেভ হবে। পরে যেকোনো ডকুমেন্টে ব্যবহার করতে পারবেন।",
  "keep the seal's own colour (exactly as copied)":
    "সিলের নিজের রঙ রাখুন (হুবহু যেমন কপি করা)",
  "round date band": "গোল (তারিখ ব্যান্ড)",
  "oval date band": "ডিম্বাকৃতি (তারিখ ব্যান্ড)",
  "round serrated": "গোল (করাত-কাটা কিনারা)",
  "thin box": "পাতলা বক্স",
  "bold box": "মোটা বক্স",
  "left-aligned lines": "বাম-সারিবদ্ধ লাইন",
  "text only": "শুধু লেখা (বর্ডার ছাড়া)",
  "seal colour": "সিলের রঙ",
  "keep original colour": "মূল রঙ রাখুন",
  "choose a new colour": "নতুন রঙ বেছে নিন",
  "pick a colour, then drag a box over the seal — its ink changes to that colour. works on the original coloured page and on a cleaned page.":
    "একটা রঙ বেছে নিন, তারপর সিলের ওপর বক্স টানুন — সিলের কালি ওই রঙে বদলে যাবে। মূল রঙিন ডকুমেন্টে এবং পরিষ্কার করা ডকুমেন্ট — দুটোতেই কাজ করে।",
  "pick a seal design, type the seal text, pick the ink colour, then drag a box where the seal should go — it is stamped there like real ink.":
    "সিলের ডিজাইন বাছুন, সিলের লেখা লিখুন, কালির রঙ বাছুন, তারপর যেখানে সিল বসাতে চান সেখানে বক্স টানুন — আসল কালির মতো সিল বসে যাবে।",
  "seal design": "সিলের ডিজাইন",
  "top curved text": "উপরের বাঁকানো লেখা",
  "bottom curved text": "নিচের বাঁকানো লেখা",
  "top line": "উপরের লাইন",
  "bottom line": "নিচের লাইন",
  "middle text (new line = next line)": "মাঝের লেখা (নতুন লাইন = পরের লাইন)",
  "seal font": "সিলের ফন্ট",
  turn: "ঘোরান",
  "ink strength": "কালির গাঢ়তা",
  "old / worn look": "পুরোনো / ক্ষয়ে যাওয়া ভাব",
  "loading font…": "ফন্ট লোড হচ্ছে…",
  "round double": "গোল (ডবল বৃত্ত)",
  "round single": "গোল (একক বৃত্ত)",
  "round dotted": "গোল (ফোঁটা বর্ডার)",
  "round star": "গোল (তারা)",
  "oval double": "ডিম্বাকৃতি (ডবল)",
  "oval single": "ডিম্বাকৃতি (একক)",
  rectangle: "আয়তাকার",
  "rounded box": "গোলকোণা বক্স",
  banner: "ব্যানার",
  "saved documents could not be loaded. please try again.":
    "সেভ করা ডকুমেন্ট লোড করা যায়নি। আবার চেষ্টা করুন।",
  "there was a problem loading the opencv script.":
    "OpenCV স্ক্রিপ্ট লোড করতে সমস্যা হয়েছে।",
  "document saving was cancelled or timed out. please try again.":
    "ডকুমেন্ট সেভ বাতিল হয়েছে বা সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন।",
  "the document could not be saved. please try again.":
    "ডকুমেন্ট সেভ করা যায়নি। আবার চেষ্টা করুন।",
  "the saved document url could not be found.":
    "সেভ করা ডকুমেন্টের URL পাওয়া যায়নি।",
  "the pdf could not be created. please try again.":
    "PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "the print preview could not be opened. please try again.":
    "প্রিন্টের পূর্বরূপ খোলা যায়নি। আবার চেষ্টা করুন।",
  "printing failed. please try again.": "প্রিন্ট করা যায়নি। আবার চেষ্টা করুন।",
  "the print preview could not be created. please try again.":
    "প্রিন্টের পূর্বরূপ তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "the document could not be loaded in the print preview. please try again.":
    "প্রিন্টের পূর্বরূপে ডকুমেন্ট লোড করা যায়নি। আবার চেষ্টা করুন।",
  "the image could not be loaded for editing the saved document.":
    "সেভ করা ডকুমেন্ট এডিট করার জন্য ছবিটি লোড করা যায়নি।",
  "the document could not be deleted. please try again.":
    "ডকুমেন্ট মুছে ফেলা যায়নি। আবার চেষ্টা করুন।",
  "opencv could not be loaded. check your internet connection and try again, or use manual crop.":
    "OpenCV লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন, অথবা ম্যানুয়াল ক্রপ ব্যবহার করুন।",
  "the document edges could not be detected. use manual crop.":
    "ডকুমেন্টের কিনারা শনাক্ত করা যায়নি। ম্যানুয়াল ক্রপ ব্যবহার করুন।",
  "auto crop could not be completed. please try again.":
    "স্বয়ংক্রিয় ক্রপ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
  "the ai model could not be loaded. check your internet connection and try again.":
    "AI মডেল লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।",
  "document processing could not be completed. please try again.":
    "ডকুমেন্ট প্রক্রিয়াকরণ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
  "the current document has unsaved changes. do you want to discard them and edit the saved document?":
    "বর্তমান ডকুমেন্টে সেভ না করা পরিবর্তন আছে। এগুলো বাদ দিয়ে সেভ করা ডকুমেন্টটি এডিট করতে চান?",
  "updating...": "আপডেট করা হচ্ছে...",
  "save changes": "পরিবর্তন সেভ করুন",
  "save document": "ডকুমেন্ট সেভ করুন",
  delete: "মুছুন",
  view: "দেখুন",
  download: "ডাউনলোড করুন",
  remove: "সরান",
  add: "যোগ করুন",
  close: "বন্ধ করুন",
  "are you sure you want to delete": "আপনি কি এই ডকুমেন্টটি মুছতে চান",
  "the image could not be loaded. please try again.":
    "ছবিটি লোড করা যায়নি। আবার চেষ্টা করুন।",
  "the device is out of memory. close other tabs and try again.":
    "ডিভাইসের মেমোরি শেষ হয়ে গেছে। অন্য ট্যাব বন্ধ করে আবার চেষ্টা করুন।",
};

const normalizeDocumentText = (value: string) =>
  value.replace(/\s+/g, " ").trim().toLowerCase();

const translateDocumentText = (
  source: string,
  fallback: (value: string) => string,
  locale: "en" | "bn",
): string => {
  // English must always render the original English source text.
  if (locale === "en") return source;
  const compact = normalizeDocumentText(source);
  if (!compact) return source;

  const exact = DOCUMENT_EXACT[compact] ?? DOCUMENT_EXTRA[compact];
  if (exact) {
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    return `${leading}${exact}${trailing}`;
  }

  let match = source.match(/^Undo:\s*(.+)$/i);
  if (match) {
    const label = match[1].trim();
    const labels: Record<string, string> = {
      "Color Document": "ডকুমেন্টে রঙ দিন",
      "Fix Blur": "ঝাপসা ঠিক করুন",
      "Deblur & Sharpen": "ঝাপসা দূর ও লেখা স্পষ্ট",
      "Document Clean": "ডকুমেন্ট পরিষ্কার",
      "Auto crop": "স্বয়ংক্রিয় ক্রপ",
      "Manual crop": "ম্যানুয়াল ক্রপ",
      "Eraser / Pen": "ইরেজার / কলম",
      "Invert colors": "রঙ উল্টান",
      "Straighten page": "পেজ সোজা করুন",
    };
    return `পূর্বাবস্থায় ফিরুন: ${labels[label] ?? fallback(label)}`;
  }

  match = source.match(/^Downloading AI model…\s*(\d+)%\s*\(first run\)$/i);
  if (match) return `AI মডেল ডাউনলোড হচ্ছে… ${match[1]}% (প্রথমবার)`;

  match = source.match(/^(?:Fix Blur|Deblur & Sharpen) in progress…\s*(\d+)%$/i);
  if (match) return `ঝাপসা ঠিক করা হচ্ছে… ${match[1]}%`;

  // Common action phrases used in dynamically generated labels/titles.
  match = source.match(/^Remove (.+)$/i);
  if (match)
    return `সরান: ${translateDocumentText(match[1], fallback, locale)}`;

  match = source.match(/^Add (.+)$/i);
  if (match)
    return `যোগ করুন: ${translateDocumentText(match[1], fallback, locale)}`;

  // Keep unknown backend/file names as-is rather than producing awkward mixed text.
  return fallback(source);
};

function DocumentText({ children }: { children: React.ReactNode }) {
  const { L, locale } = useSebaLagbeToolsI18n();
  if (typeof children !== "string") return <>{children}</>;
  return <>{translateDocumentText(children, L, locale)}</>;
}

// Before / after slider. Both images are fitted ("contain") inside the same
// frame, so the document keeps exactly the size it has in the normal preview
// (no extra zoom), and the colours follow the site's red + warm sand theme.
function CompareSlider({
  leftSrc,
  rightSrc,
  leftLabel,
  rightLabel,
}: {
  leftSrc: string;
  rightSrc: string;
  leftLabel: string;
  rightLabel: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<boolean>(false);
  const [position, setPosition] = useState<number>(50);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, next)));
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative w-full h-full overflow-hidden cursor-ew-resize touch-none select-none"
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) updateFromClientX(e.clientX);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      {/* Original (right side, underneath) */}
      <img
        src={rightSrc}
        alt={rightLabel}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
      {/* Cleaned (left side, clipped at the slider) */}
      <img
        src={leftSrc}
        alt={leftLabel}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      <span className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-[#FBF6E8]/95 border border-[#E3D6B8] text-[12px] font-bold text-[#DC2626] shadow-xs pointer-events-none">
        {leftLabel}
      </span>
      <span className="absolute top-2 right-2 z-10 px-2.5 py-1 rounded-lg bg-[#FBF6E8]/95 border border-[#E3D6B8] text-[12px] font-bold text-[#5A4A32] shadow-xs pointer-events-none">
        {rightLabel}
      </span>

      {/* Slider line + handle */}
      <div
        className="absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-[#DC2626] shadow-[0_0_0_1px_rgba(251,246,232,0.9)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#DC2626] border-[3px] border-[#FBF6E8] shadow-md flex items-center justify-center text-white">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l-6 6 6 6" />
            <path d="M15 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function DocumentScanner() {
  const { L, locale } = useSebaLagbeToolsI18n();
  const DL = useCallback(
    (value: string) => translateDocumentText(value, L, locale),
    [L, locale],
  );
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [processedImageSrc, setProcessedImageSrc] = useState<string>("");
  const [pageMargins, setPageMargins] = useState<PageMargins>(NO_MARGINS);
  const [marginsLinked, setMarginsLinked] = useState<boolean>(true);
  const [cleanBaseSrc, setCleanBaseSrc] = useState<string>("");
  const [uncroppedSrc, setUncroppedSrc] = useState<string>("");
  const [croppedOriginalSrc, setCroppedOriginalSrc] = useState<string>("");
  const [rotatedOriginalSrc, setRotatedOriginalSrc] = useState<string>("");
  const [autoCrop, setAutoCrop] = useState<boolean>(false);
  const [isManualCropping, setIsManualCropping] = useState<boolean>(false);
  const [corners, setCorners] = useState<Point[]>(DEFAULT_CORNERS);
  const [draggingCorner, setDraggingCorner] = useState<number | null>(null);
  const [effects, setEffects] = useState<Effects>(NO_EFFECTS);
  const [activeStage, setActiveStage] = useState<EffectKey | null>(null);
  const [blackness, setBlackness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [bakedRotation, setBakedRotation] = useState<number>(0);
  const [manualCropSourceSrc, setManualCropSourceSrc] = useState<string>("");
  // Effect-free twin of manualCropSourceSrc, cropped with the same corners.
  const [manualCropOriginalSrc, setManualCropOriginalSrc] =
    useState<string>("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [manualCropSourceBakedRotation, setManualCropSourceBakedRotation] =
    useState<number>(0);
  const debouncedBlackness = useDebounce(blackness, 30);
  const debouncedContrast = useDebounce(contrast, 30);
  const debouncedBrightness = useDebounce(brightness, 30);
  const debouncedCorners = useDebounce(corners, 40);
  const [zoom, setZoom] = useState<number>(100);
  // Pan (drag to move) – in screen pixels, applied before the zoom scale.
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [handMode, setHandMode] = useState<boolean>(false);
  const [spaceHeld, setSpaceHeld] = useState<boolean>(false);
  const spaceHeldRef = useRef<boolean>(false);
  const panDragRef = useRef<{
    sx: number;
    sy: number;
    px: number;
    py: number;
  } | null>(null);
  const zoomRef = useRef<number>(100);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  // Whole-page "fit to screen" scale (desktop fit mode only). Everything is laid
  // out at a comfortable design size and scaled down together, so all tools,
  // the note and the saved documents are visible at 100% browser zoom with no
  // scrolling and no broken text.
  const [pageScale, setPageScale] = useState<number>(1);
  const pageScaleRef = useRef<number>(1);
  useEffect(() => {
    pageScaleRef.current = pageScale;
  }, [pageScale]);
  useEffect(() => {
    const DESIGN_W = 1760;
    // Tallest content (right tools column incl. stacked page-margin card)
    // needs ~1160px at scale 1, so the design height must be at least that;
    // otherwise at 100% browser zoom the sidebar overflows and needs scrolling.
    const DESIGN_H = 1160;
    const calc = () => {
      const fit = window.matchMedia(
        "(min-width: 1280px) and (min-height: 720px)",
      ).matches;
      if (!fit) {
        setPageScale(1);
        return;
      }
      const sc = Math.min(
        1,
        window.innerWidth / DESIGN_W,
        (window.innerHeight - 60) / DESIGN_H,
      );
      setPageScale(Math.max(0.55, Math.round(sc * 1000) / 1000));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [isLoadingSavedDocuments, setIsLoadingSavedDocuments] =
    useState<boolean>(true);
  const savedDocumentCounterRef = useRef<number>(0);
  const [isSavingDocument, setIsSavingDocument] = useState<boolean>(false);
  const [deletingSavedDocumentId, setDeletingSavedDocumentId] = useState<
    string | null
  >(null);
  const [previewSavedDocument, setPreviewSavedDocument] =
    useState<SavedDocument | null>(null);
  const [editingSavedDocumentId, setEditingSavedDocumentId] = useState<
    string | null
  >(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [pendingNavigationIndex, setPendingNavigationIndex] = useState<
    number | null
  >(null);
  const [cropReady, setCropReady] = useState<boolean>(false);
  // Eraser tool state.
  const [isErasing, setIsErasing] = useState<boolean>(false);
  // "Color Document": after Document Clean has run, open the Restore color tool.
  const [pendingRecolor, setPendingRecolor] = useState<boolean>(false);
  // The cleanBaseSrc the on-screen preview (processedImageSrc) was built from.
  // The preview is made a moment AFTER cleanBaseSrc changes, so the tool must
  // wait until this matches, or it would open on the old picture.
  const [processedBaseKey, setProcessedBaseKey] = useState<string>("");
  const [eraserSize, setEraserSize] = useState<number>(30);
  const [eraseStrokeCount, setEraseStrokeCount] = useState<number>(0);
  const [eraserCursor, setEraserCursor] = useState<{
    x: number;
    y: number;
    d: number;
  } | null>(null);
  const [brushTool, setBrushTool] = useState<BrushTool>("erase");
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
  const [highlightColor, setHighlightColor] = useState<string>(
    HIGHLIGHT_COLORS[0],
  );
  const [brushShape, setBrushShape] = useState<"free" | "area" | "lasso">(
    "free",
  );
  const [stampStrength, setStampStrength] = useState<number>(50);
  // Restore-stamp-colour: null = keep the original colour, else the new ink colour.
  const [stampTint, setStampTint] = useState<string | null>(null);
  // Seal tool: design, texts, font, ink colour, turn, ink strength, worn look.
  const [sealStyle, setSealStyle] = useState<string>("round2");
  const [customSeals, setCustomSeals] = useState<CustomSeal[]>([]);
  const [sealCapture, setSealCapture] = useState<boolean>(false);
  const [sealOwnColor, setSealOwnColor] = useState<boolean>(true);
  const [sealTop, setSealTop] = useState<string>("প্রতিষ্ঠানের নাম");
  const [sealBottom, setSealBottom] = useState<string>("ঠিকানা");
  const [sealCenter, setSealCenter] = useState<string>("অধ্যক্ষ");
  const [sealFont, setSealFont] = useState<HandStyleKey>("printBold");
  const [sealColor, setSealColor] = useState<string>(SEAL_COLORS[0]);
  const [sealRot, setSealRot] = useState<number>(0);
  const [sealInk, setSealInk] = useState<number>(90);
  const [sealWear, setSealWear] = useState<number>(0);
  const [lassoDraft, setLassoDraft] = useState<Point[] | null>(null);
  // Colour tool, "paint by hand": the brush path is only shown as a preview
  // while dragging; the seal ink under it is re-coloured once, on release.
  const [handDraft, setHandDraft] = useState<Point[] | null>(null);
  const lassoRef = useRef<Point[] | null>(null);
  const lassoCenterRef = useRef<Point | null>(null);
  // Coloured original of the page (same shape as the page on screen). After
  // "Document Clean" the page itself is black & white, so the stamp is found
  // here instead.
  const eraseColorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Untouched copy of the coloured reference at the start of an erase session
  // (used to replay strokes when the person presses undo).
  const eraseColorStartRef = useRef<HTMLCanvasElement | null>(null);
  // The coloured reference lives on between erase sessions, so a seal that was
  // placed / copied earlier can still be found (and re-coloured perfectly)
  // later, even after "Document Clean" made the page black & white.
  const eraseColorKeepRef = useRef<{ key: string; base: string; canvas: HTMLCanvasElement } | null>(null);
  const eraseEffectedRef = useRef<boolean>(false);
  const [areaRect, setAreaRect] = useState<FractionRect | null>(null);
  const areaStartRef = useRef<Point | null>(null);
  // Dotted line / underline: start point + the live preview while dragging.
  const [borderStyle, setBorderStyle] = useState<BorderStyleKey>("single");
  // Handwriting tool: what to write, in which hand style, colour and size.
  const [writeText, setWriteText] = useState<string>("");
  const [writeStyle, setWriteStyle] = useState<HandStyleKey>("ballpen");
  // Writing styles copied from a document ("Take writing style from the page").
  const [customTextList, setCustomTextList] = useState<HandStyle[]>([]);
  const [textStyleCapture, setTextStyleCapture] = useState<boolean>(false);
  const [isStyleBusy, setIsStyleBusy] = useState<boolean>(false);
  const [styleNote, setStyleNote] = useState<string>("");
  const [writeColor, setWriteColor] = useState<string>(HANDWRITING_STYLES[0].color);
  const [writeSize, setWriteSize] = useState<number>(100);
  const [writeClearFirst, setWriteClearFirst] = useState<boolean>(false);
  const [writeHint, setWriteHint] = useState<boolean>(false);
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const writeSeedRef = useRef<number>(1);
  // Punctuation tool: which mark, in which look, colour and size.
  const [punctMark, setPunctMark] = useState<string>("।");
  const [punctStyle, setPunctStyle] = useState<HandStyleKey>("printSans");
  const [punctColor, setPunctColor] = useState<string>(PEN_COLORS[0]);
  const [punctSize, setPunctSize] = useState<number>(35);
  const [punctHint, setPunctHint] = useState<boolean>(false);
  const [punctPos, setPunctPos] = useState<Point | null>(null);
  const punctDownRef = useRef<boolean>(false);
  const punctSeedRef = useRef<number>(1);
  // "Read text from the document" (OCR) for the Handwriting tool.
  const [ocrMode, setOcrMode] = useState<boolean>(false);
  const [isOcrRunning, setIsOcrRunning] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrNote, setOcrNote] = useState<string>("");
  const ocrWorkerRef = useRef<any>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement>(null);
  const lineStartRef = useRef<Point | null>(null);
  const [lineDraft, setLineDraft] = useState<FractionRect | null>(null);
  const eraseCanvasRef = useRef<HTMLCanvasElement>(null);
  const eraseBaseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const eraseStartRef = useRef<{ base: string; display: string } | null>(null);
  const eraseStrokesRef = useRef<EraseStroke[]>([]);
  const eraseCurrentRef = useRef<EraseStroke | null>(null);
  const eraseReadyRef = useRef<boolean>(false);
  const eraseCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // "Busy" flag for every canvas job (Color Document, Magic Clean, Document
  // Clean, Auto crop): disables the buttons and shows the overlay.
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isWaitingForOpenCv, setIsWaitingForOpenCv] = useState<boolean>(false);
  const [isAutoCropping, setIsAutoCropping] = useState<boolean>(false);
  // Only carries the Magic Clean progress text / percent.
  const [enhanceProgress, setEnhanceProgress] =
    useState<EnhanceProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const processingIdRef = useRef<number>(0);
  const openCvFailedRef = useRef<boolean>(false);
  const enhanceAbortRef = useRef<AbortController | null>(null);
  const cloudinarySaveRequestRef = useRef<AbortController | null>(null);
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => () => enhanceAbortRef.current?.abort(), []);
  const createTrackedObjectURL = useCallback((blob: Blob | File): string => {
    const url = URL.createObjectURL(blob);
    createdBlobUrlsRef.current.add(url);
    return url;
  }, []);
  const revokeTrackedObjectURL = useCallback((url: string) => {
    if (url && url.startsWith("blob:") && createdBlobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      createdBlobUrlsRef.current.delete(url);
    }
  }, []);
  // Stops the running canvas job (if any).
  const cancelActiveProcessing = useCallback(() => {
    enhanceAbortRef.current?.abort();
  }, []);
  const cancelCloudinarySaveRequest = useCallback(() => {
    const controller = cloudinarySaveRequestRef.current;
    if (controller) {
      controller.abort();
      cloudinarySaveRequestRef.current = null;
    }
  }, []);
  const resetCorners = useCallback(
    () => setCorners(DEFAULT_CORNERS.map((p) => ({ ...p }))),
    [],
  );
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load image"));
      img.src = src;
    });
  }, []);
  const createRotatedCanvas = useCallback(
    (
      img: HTMLImageElement,
      angle: number,
      maxSize?: number,
    ): HTMLCanvasElement => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (!width || !height) throw new Error("Invalid image dimensions");
      let scale = 1;
      if (maxSize) scale = Math.min(1, maxSize / Math.max(width, height));
      const scaledWidth = Math.max(1, Math.round(width * scale));
      const scaledHeight = Math.max(1, Math.round(height * scale));
      const normalizedAngle = normalizeAngle(angle);
      const swap = normalizedAngle === 90 || normalizedAngle === 270;
      const canvas = document.createElement("canvas");
      canvas.width = swap ? scaledHeight : scaledWidth;
      canvas.height = swap ? scaledWidth : scaledHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((normalizedAngle * Math.PI) / 180);
      ctx.drawImage(
        img,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight,
      );
      ctx.restore();
      return canvas;
    },
    [],
  );
  const selectedImageSrc = images[selectedIndex] || "";
  const loadSavedDocuments = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingSavedDocuments(true);
    try {
      const response = await fetch("/api/scanned-documents", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        signal,
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to fetch saved documents.");
      }
      const documents = Array.isArray(result.data) ? result.data : [];
      const normalized: SavedDocument[] = documents.map((item: any) => ({
        id: String(item.id || item._id),
        name: item.title || "Scanned Document",
        src: item.imageUrl,
        publicId: item.publicId || "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      const highestNumber = normalized.reduce((max, item) => {
        const match = item.name.match(/(\d+)$/);
        const number = match ? Number(match[1]) : 0;
        return Number.isFinite(number) ? Math.max(max, number) : max;
      }, 0);
      savedDocumentCounterRef.current = highestNumber;
      setSavedDocuments(normalized);
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error("Failed to load saved documents:", error);
      setErrorMessage("Saved documents could not be loaded. Please try again.");
    } finally {
      if (!signal?.aborted) setIsLoadingSavedDocuments(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void loadSavedDocuments(controller.signal);
    return () => controller.abort();
  }, [loadSavedDocuments]);
  useEffect(() => {
    if (!previewSavedDocument) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewSavedDocument(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [previewSavedDocument]);
  useEffect(() => {
    return () => {
      cloudinarySaveRequestRef.current?.abort();
      cloudinarySaveRequestRef.current = null;
      createdBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdBlobUrlsRef.current.clear();
    };
  }, []);
  useEffect(() => {
    let active = true;
    processingIdRef.current += 1;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    enhanceAbortRef.current?.abort();
    setIsProcessing(false);
    setErrorMessage(null);
    setRotation(0);
    setBakedRotation(0);
    setEffects(NO_EFFECTS);
    setHistory([]);
    setManualCropOriginalSrc("");
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setIsComparing(false);
    setIsHoldingOriginal(false);
    setHasUnsavedChanges(false);
    setPendingNavigationIndex(null);
    setAutoCrop(false);
    setIsManualCropping(false);
    setCropReady(false);
    setManualCropSourceSrc("");
    setManualCropSourceBakedRotation(0);
    resetCorners();
    if (!selectedImageSrc) {
      setUncroppedSrc("");
      setCroppedOriginalSrc("");
      setCleanBaseSrc("");
      setRotatedOriginalSrc("");
      setProcessedImageSrc("");
      return () => {
        active = false;
      };
    }
    loadImage(selectedImageSrc)
      .then((img) => {
        if (!active) return;
        const canvas = createRotatedCanvas(img, 0);
        const src = canvas.toDataURL("image/png");
        setUncroppedSrc(src);
        setCroppedOriginalSrc(src);
        setCleanBaseSrc(src);
        setRotatedOriginalSrc(src);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to initialize selected image:", error);
        setErrorMessage("The image could not be loaded. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [
    selectedIndex,
    selectedImageSrc,
    loadImage,
    createRotatedCanvas,
    cancelActiveProcessing,
    cancelCloudinarySaveRequest,
    resetCorners,
  ]);
  useEffect(() => {
    let active = true;
    if (!selectedImageSrc || isManualCropping) {
      return () => {
        active = false;
      };
    }
    loadImage(selectedImageSrc)
      .then((img) => {
        if (!active) return;
        const rotatedCanvas = createRotatedCanvas(img, rotation);
        setUncroppedSrc(rotatedCanvas.toDataURL("image/png"));
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to update rotated preview:", error);
      });
    return () => {
      active = false;
    };
  }, [
    selectedImageSrc,
    rotation,
    isManualCropping,
    loadImage,
    createRotatedCanvas,
  ]);
  const orderPoints = useCallback((points: Point[]): Point[] => {
    if (points.length !== 4) return points;
    let topLeft = points[0];
    let topRight = points[0];
    let bottomRight = points[0];
    let bottomLeft = points[0];
    let minSum = Infinity;
    let maxSum = -Infinity;
    let minDiff = Infinity;
    let maxDiff = -Infinity;
    for (const point of points) {
      const sum = point.x + point.y;
      const diff = point.x - point.y;
      if (sum < minSum) {
        minSum = sum;
        topLeft = point;
      }
      if (sum > maxSum) {
        maxSum = sum;
        bottomRight = point;
      }
      if (diff > maxDiff) {
        maxDiff = diff;
        topRight = point;
      }
      if (diff < minDiff) {
        minDiff = diff;
        bottomLeft = point;
      }
    }
    return [topLeft, topRight, bottomRight, bottomLeft];
  }, []);
  const uiPointsToImage = useCallback(
    (uiPoints: Point[], imageWidth: number, imageHeight: number): Point[] => {
      if (!containerRef.current) return uiPoints;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) {
        return uiPoints;
      }
      const containerAspect = containerWidth / containerHeight;
      const imageAspect = imageWidth / imageHeight;
      let renderWidth = containerWidth;
      let renderHeight = containerHeight;
      let offsetX = 0;
      let offsetY = 0;
      if (imageAspect > containerAspect) {
        renderHeight = containerWidth / imageAspect;
        offsetY = (containerHeight - renderHeight) / 2;
      } else {
        renderWidth = containerHeight * imageAspect;
        offsetX = (containerWidth - renderWidth) / 2;
      }
      return uiPoints.map((point) => {
        const px = (point.x / 100) * containerWidth;
        const py = (point.y / 100) * containerHeight;
        const imgPx = px - offsetX;
        const imgPy = py - offsetY;
        const normX = Math.max(0, Math.min(1, imgPx / renderWidth));
        const normY = Math.max(0, Math.min(1, imgPy / renderHeight));
        return {
          x: normX * imageWidth,
          y: normY * imageHeight,
        };
      });
    },
    [],
  );
  // Starts downloading OpenCV.js as soon as the page opens, so it is usually
  // ready by the time Auto crop / Manual crop is used.
  useEffect(() => {
    if (window.cv && window.cv.Mat) return;
    if (document.getElementById(OPENCV_SCRIPT_ID)) return;
    openCvFailedRef.current = false;
    injectOpenCvScript(
      () => undefined,
      () => {
        openCvFailedRef.current = true;
        setErrorMessage("There was a problem loading the OpenCV script.");
      },
    );
  }, []);
  // Auto crop never falls back to a server: if OpenCV.js is still loading, we
  // show the loading state and continue as soon as it is ready.
  const ensureOpenCvReady = useCallback(
    async (signal: AbortSignal): Promise<boolean> => {
      const isReady = () => !!(window.cv && window.cv.Mat);
      if (isReady()) return true;
      setIsWaitingForOpenCv(true);
      try {
        if (openCvFailedRef.current) {
          // The first download failed: try once more.
          document.getElementById(OPENCV_SCRIPT_ID)?.remove();
          openCvFailedRef.current = false;
          injectOpenCvScript(
            () => undefined,
            () => {
              openCvFailedRef.current = true;
            },
          );
        }
        const startedAt = Date.now();
        while (!isReady()) {
          if (signal.aborted) return false;
          if (
            openCvFailedRef.current ||
            Date.now() - startedAt > OPENCV_WAIT_TIMEOUT_MS
          ) {
            return false;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return true;
      } finally {
        setIsWaitingForOpenCv(false);
      }
    },
    [],
  );
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEditingSavedDocumentId(null);
      const filesArray = Array.from(e.target.files);
      const newImages = filesArray.map((file) => createTrackedObjectURL(file));
      setImages((prev) => {
        const updated = [...prev, ...newImages];
        if (prev.length === 0) setSelectedIndex(0);
        return updated;
      });
      e.target.value = "";
    }
  };
  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newUrl = createTrackedObjectURL(file);
      const oldUrl = images[selectedIndex];
      setImages((prev) => {
        const updated = [...prev];
        updated[selectedIndex] = newUrl;
        return updated;
      });
      if (oldUrl) revokeTrackedObjectURL(oldUrl);
      e.target.value = "";
    }
  };
  const handleRemoveImage = (index: number) => {
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    const removedUrl = images[index];
    if (removedUrl) revokeTrackedObjectURL(removedUrl);
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (selectedIndex >= updated.length) {
      setSelectedIndex(Math.max(0, updated.length - 1));
    }
    if (updated.length === 0) {
      setProcessedImageSrc("");
      setCleanBaseSrc("");
      setUncroppedSrc("");
      setCroppedOriginalSrc("");
      setRotatedOriginalSrc("");
      setManualCropSourceSrc("");
      setManualCropSourceBakedRotation(0);
      setBakedRotation(0);
      setRotation(0);
      setEffects(NO_EFFECTS);
      setHistory([]);
      setManualCropOriginalSrc("");
      setBlackness(0);
      setContrast(0);
      setBrightness(0);
      setZoom(100);
      setPan({ x: 0, y: 0 });
      resetCorners();
      setCropReady(false);
      setAutoCrop(false);
      setIsComparing(false);
      setIsManualCropping(false);
      setIsHoldingOriginal(false);
      setIsProcessing(false);
      setHasUnsavedChanges(false);
    }
  };
  // Core warp: `imagePoints` are already in pixel coordinates of sourceCanvas.
  const warpByImagePoints = useCallback(
    (
      sourceCanvas: HTMLCanvasElement,
      imagePoints: Point[],
      maxOutputSize: number = 2500,
    ): HTMLCanvasElement | null => {
      if (!window.cv || !window.cv.Mat || imagePoints.length !== 4) return null;
      const cv = window.cv;
      let src: any = null;
      let srcTri: any = null;
      let dstTri: any = null;
      let matrix: any = null;
      let warped: any = null;
      try {
        src = cv.imread(sourceCanvas);
        const ordered = orderPoints(imagePoints);
        const distance = (a: Point, b: Point) =>
          Math.hypot(b.x - a.x, b.y - a.y);
        const widthTop = distance(ordered[0], ordered[1]);
        const widthBottom = distance(ordered[3], ordered[2]);
        const heightLeft = distance(ordered[0], ordered[3]);
        const heightRight = distance(ordered[1], ordered[2]);
        let outputWidth = Math.max(
          100,
          Math.round(Math.max(widthTop, widthBottom)),
        );
        let outputHeight = Math.max(
          100,
          Math.round(Math.max(heightLeft, heightRight)),
        );
        const outputScale = Math.min(
          1,
          maxOutputSize / Math.max(outputWidth, outputHeight),
        );
        outputWidth = Math.max(100, Math.round(outputWidth * outputScale));
        outputHeight = Math.max(100, Math.round(outputHeight * outputScale));
        srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          ordered[0].x,
          ordered[0].y,
          ordered[1].x,
          ordered[1].y,
          ordered[2].x,
          ordered[2].y,
          ordered[3].x,
          ordered[3].y,
        ]);
        dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0,
          0,
          outputWidth,
          0,
          outputWidth,
          outputHeight,
          0,
          outputHeight,
        ]);
        matrix = cv.getPerspectiveTransform(srcTri, dstTri);
        warped = new cv.Mat();
        cv.warpPerspective(
          src,
          warped,
          matrix,
          new cv.Size(outputWidth, outputHeight),
          cv.INTER_CUBIC,
          cv.BORDER_REPLICATE,
        );
        const resultCanvas = document.createElement("canvas");
        resultCanvas.width = outputWidth;
        resultCanvas.height = outputHeight;
        cv.imshow(resultCanvas, warped);
        return resultCanvas;
      } catch (error) {
        console.error("Perspective warp failed:", error);
        return null;
      } finally {
        if (src) src.delete();
        if (srcTri) srcTri.delete();
        if (dstTri) dstTri.delete();
        if (matrix) matrix.delete();
        if (warped) warped.delete();
      }
    },
    [orderPoints],
  );
  // Warp using corner handles that live in UI (container %) coordinates.
  const applyPerspectiveWarp = useCallback(
    (
      sourceCanvas: HTMLCanvasElement,
      uiCorners: Point[],
      maxOutputSize: number = 2500,
    ): HTMLCanvasElement | null => {
      if (uiCorners.length !== 4) return null;
      return warpByImagePoints(
        sourceCanvas,
        uiPointsToImage(uiCorners, sourceCanvas.width, sourceCanvas.height),
        maxOutputSize,
      );
    },
    [warpByImagePoints, uiPointsToImage],
  );
  /**
   * Finds the document corners in the browser with OpenCV.js (see
   * documentCorners.ts). Returns 0..1 fractions of the image so the corners
   * fit an image of ANY size (e.g. the 2x Magic Clean image).
   */
  const detectDocumentCorners = useCallback(
    (source: HTMLCanvasElement): Point[] | null =>
      detectDocumentCornersCv(window.cv, source),
    [],
  );
  useEffect(() => {
    if (!isManualCropping || !selectedImageSrc) return;
    // Don't re-warp / re-encode the image on every pixel of a drag (that was
    // the lag); the preview updates once the corner is released.
    if (draggingCorner !== null) return;
    let active = true;
    const currentProcessingId = ++processingIdRef.current;
    const sourceSrc = manualCropSourceSrc || selectedImageSrc;
    const originalSrc = manualCropOriginalSrc || sourceSrc;
    const sourceBakedRotation = manualCropSourceSrc
      ? manualCropSourceBakedRotation
      : 0;
    loadImage(sourceSrc)
      .then(async (img) => {
        if (!active || currentProcessingId !== processingIdRef.current) return;
        const angle = normalizeAngle(rotation - sourceBakedRotation);
        const displayCanvas = createRotatedCanvas(img, angle);
        setUncroppedSrc(displayCanvas.toDataURL("image/png"));
        if (!cropReady || debouncedCorners.length !== 4) return;
        // Effects are already baked into the source, so allow the larger size.
        const warpedCanvas = applyPerspectiveWarp(
          displayCanvas,
          debouncedCorners,
          MAX_ENHANCE_SIDE,
        );
        if (
          !warpedCanvas ||
          !active ||
          currentProcessingId !== processingIdRef.current
        ) {
          return;
        }
        const cropUrl = warpedCanvas.toDataURL("image/png");
        let originalCropUrl = cropUrl;
        // Crop the effect-free "Normal" twin with the same corners so the
        // compare / hold view stays aligned.
        if (originalSrc !== sourceSrc) {
          try {
            const originalImg = await loadImage(originalSrc);
            if (!active || currentProcessingId !== processingIdRef.current)
              return;
            const originalCanvas = createRotatedCanvas(originalImg, angle);
            const sameShape =
              Math.abs(
                originalCanvas.width / originalCanvas.height -
                  displayCanvas.width / displayCanvas.height,
              ) < 0.02;
            const warpedOriginal = sameShape
              ? applyPerspectiveWarp(
                  originalCanvas,
                  debouncedCorners,
                  MAX_ENHANCE_SIDE,
                )
              : null;
            if (warpedOriginal)
              originalCropUrl = warpedOriginal.toDataURL("image/png");
          } catch (error) {
            console.error("Manual crop original preview failed:", error);
          }
        }
        if (!active || currentProcessingId !== processingIdRef.current) return;
        setCroppedOriginalSrc(originalCropUrl);
        setCleanBaseSrc(cropUrl);
        setRotatedOriginalSrc(originalCropUrl);
        setBakedRotation(rotation);
        setAutoCrop(false);
        setHasUnsavedChanges(true);
      })
      .catch((error) => {
        if (active) console.error("Manual crop preview failed:", error);
      });
    return () => {
      active = false;
    };
  }, [
    isManualCropping,
    cropReady,
    debouncedCorners,
    draggingCorner,
    selectedImageSrc,
    manualCropSourceSrc,
    manualCropOriginalSrc,
    manualCropSourceBakedRotation,
    rotation,
    loadImage,
    createRotatedCanvas,
    applyPerspectiveWarp,
  ]);
  const applyAdjustments = useCallback(async () => {
    if (!cleanBaseSrc) {
      setProcessedImageSrc("");
      setRotatedOriginalSrc("");
      return;
    }
    try {
      const baseImg = await loadImage(cleanBaseSrc);
      const pendingRotation = normalizeAngle(rotation - bakedRotation);
      const rotatedCanvas = createRotatedCanvas(baseImg, pendingRotation);
      const sourceOriginal = croppedOriginalSrc || selectedImageSrc;
      if (sourceOriginal) {
        try {
          const originalImg = await loadImage(sourceOriginal);
          const originalCanvas = createRotatedCanvas(
            originalImg,
            pendingRotation,
          );
          setRotatedOriginalSrc(originalCanvas.toDataURL("image/png"));
        } catch (error) {
          console.error("Failed to update original comparison image:", error);
        }
      }
      const canvas = processedCanvasRef.current;
      if (!canvas) return;
      canvas.width = rotatedCanvas.width;
      canvas.height = rotatedCanvas.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(rotatedCanvas, 0, 0);
      if (
        debouncedBlackness !== 0 ||
        debouncedContrast !== 0 ||
        debouncedBrightness !== 0
      ) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const cFactor =
          (259 * (debouncedContrast + 255)) / (255 * (259 - debouncedContrast));
        const bOffset = debouncedBrightness * 1.25;
        const blackFactor = debouncedBlackness * 1.8;
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          r += bOffset;
          g += bOffset;
          b += bOffset;
          r = cFactor * (r - 128) + 128;
          g = cFactor * (g - 128) + 128;
          b = cFactor * (b - 128) + 128;
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          const shadowWeight = Math.pow(Math.max(0, 1 - luminance / 255), 1.5);
          r -= shadowWeight * blackFactor;
          g -= shadowWeight * blackFactor;
          b -= shadowWeight * blackFactor;
          data[i] = Math.min(255, Math.max(0, Math.round(r)));
          data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
          data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
        }
        ctx.putImageData(imageData, 0, 0);
      }
      setProcessedImageSrc(canvas.toDataURL("image/png", 1));
      setProcessedBaseKey(cleanBaseSrc);
    } catch (error) {
      console.error("Local image processing failed:", error);
    }
  }, [
    cleanBaseSrc,
    croppedOriginalSrc,
    selectedImageSrc,
    rotation,
    bakedRotation,
    debouncedBlackness,
    debouncedContrast,
    debouncedBrightness,
    loadImage,
    createRotatedCanvas,
  ]);
  useEffect(() => {
    void applyAdjustments();
  }, [applyAdjustments]);
  // Corner dragging uses pointer capture: once a corner is grabbed it keeps
  // following the pointer everywhere (even outside the preview box or over
  // other elements), so it never "sticks" or drops mid-drag. The heavy crop
  // preview is only recomputed after the corner is released.
  const cornerMoveRafRef = useRef<number | null>(null);
  const cornerPendingRef = useRef<{ x: number; y: number } | null>(null);
  const handleCornerPointerDown = (
    index: number,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture not supported – dragging still works on the handle */
    }
    setDraggingCorner(index);
  };
  const handleCornerPointerMove = (
    index: number,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (draggingCorner !== index || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cornerPendingRef.current = {
      x: Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.max(
        0,
        Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
      ),
    };
    if (cornerMoveRafRef.current !== null) return;
    cornerMoveRafRef.current = requestAnimationFrame(() => {
      cornerMoveRafRef.current = null;
      const point = cornerPendingRef.current;
      if (!point) return;
      setCorners((prev) => {
        const updated = [...prev];
        updated[index] = point;
        return updated;
      });
      setCropReady(true);
      setHasUnsavedChanges(true);
    });
  };
  const handleCornerPointerUp = (
    index: number,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (draggingCorner !== index) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    // Flush the last position so the corner lands exactly where it was dropped.
    const point = cornerPendingRef.current;
    if (cornerMoveRafRef.current !== null) {
      cancelAnimationFrame(cornerMoveRafRef.current);
      cornerMoveRafRef.current = null;
    }
    if (point) {
      setCorners((prev) => {
        const updated = [...prev];
        updated[index] = point;
        return updated;
      });
    }
    cornerPendingRef.current = null;
    setDraggingCorner(null);
  };
  const handleRotate = () => {
    if (
      !selectedImageSrc ||
      isProcessing ||
      isManualCropping ||
      isErasing ||
      isSavingDocument
    )
      return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    setErrorMessage(null);
    setHasUnsavedChanges(true);
    setRotation((prev) => normalizeAngle(prev + 90));
  };
  const continueToPage = useCallback(
    (index: number) => {
      if (
        images.length === 0 ||
        isProcessing ||
        isManualCropping ||
        isErasing ||
        isSavingDocument ||
        index < 0 ||
        index >= images.length ||
        index === selectedIndex
      ) {
        return;
      }
      cancelActiveProcessing();
      cancelCloudinarySaveRequest();
      processingIdRef.current += 1;
      setDraggingCorner(null);
      setPendingNavigationIndex(null);
      setEditingSavedDocumentId(null);
      setSelectedIndex(index);
    },
    [
      images.length,
      isProcessing,
      isManualCropping,
      isErasing,
      isSavingDocument,
      selectedIndex,
      cancelActiveProcessing,
      cancelCloudinarySaveRequest,
    ],
  );
  const requestPageNavigation = useCallback(
    (index: number) => {
      if (
        images.length === 0 ||
        isProcessing ||
        isManualCropping ||
        isErasing ||
        isSavingDocument ||
        index < 0 ||
        index >= images.length ||
        index === selectedIndex
      ) {
        return;
      }
      if (hasUnsavedChanges) {
        setPendingNavigationIndex(index);
        return;
      }
      continueToPage(index);
    },
    [
      images.length,
      isProcessing,
      isManualCropping,
      isErasing,
      isSavingDocument,
      selectedIndex,
      hasUnsavedChanges,
      continueToPage,
    ],
  );
  const handlePageNavigation = useCallback(
    (direction: -1 | 1) => {
      requestPageNavigation(selectedIndex + direction);
    },
    [selectedIndex, requestPageNavigation],
  );
  const createProcessedCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    if (!cleanBaseSrc) throw new Error("No processed document available");
    const baseImg = await loadImage(cleanBaseSrc);
    const pendingRotation = normalizeAngle(rotation - bakedRotation);
    const rotatedCanvas = createRotatedCanvas(baseImg, pendingRotation);
    const canvas = document.createElement("canvas");
    canvas.width = rotatedCanvas.width;
    canvas.height = rotatedCanvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(rotatedCanvas, 0, 0);
    if (blackness !== 0 || contrast !== 0 || brightness !== 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const bOffset = brightness * 1.25;
      const blackFactor = blackness * 1.8;
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        r += bOffset;
        g += bOffset;
        b += bOffset;
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const shadowWeight = Math.pow(Math.max(0, 1 - luminance / 255), 1.5);
        r -= shadowWeight * blackFactor;
        g -= shadowWeight * blackFactor;
        b -= shadowWeight * blackFactor;
        data[i] = Math.min(255, Math.max(0, Math.round(r)));
        data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
        data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }
      ctx.putImageData(imageData, 0, 0);
    }
    // The intermediate rotated canvas is no longer needed: free its memory now.
    rotatedCanvas.width = 0;
    rotatedCanvas.height = 0;
    return canvas;
  }, [
    cleanBaseSrc,
    rotation,
    bakedRotation,
    blackness,
    contrast,
    brightness,
    loadImage,
    createRotatedCanvas,
  ]);
  // Cloud upload copy. Encodes straight to a Blob (no huge base64 string) and
  // keeps the file under the host's request-body limit so saving does not fail
  // for large pages: PNG first, then high-quality JPEG, then a smaller JPEG.
  const createProcessedUploadBlob = useCallback(async (): Promise<{
    blob: Blob;
    ext: "png" | "jpg";
  }> => {
    const canvas = await createProcessedCanvas();
    const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
    const encode = (type: string, quality?: number) =>
      new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), type, quality),
      );
    try {
      const png = await encode("image/png");
      if (png && png.size > 0 && png.size <= MAX_UPLOAD_BYTES) {
        return { blob: png, ext: "png" };
      }
      // JPEG has no alpha: paint white under the page first.
      const flat = document.createElement("canvas");
      flat.width = canvas.width;
      flat.height = canvas.height;
      const fctx = flat.getContext("2d");
      if (!fctx) throw new Error("Canvas context unavailable");
      fctx.fillStyle = "#ffffff";
      fctx.fillRect(0, 0, flat.width, flat.height);
      fctx.drawImage(canvas, 0, 0);
      try {
        for (const quality of [0.95, 0.9, 0.82, 0.74]) {
          const jpg = await new Promise<Blob | null>((resolve) =>
            flat.toBlob((b) => resolve(b), "image/jpeg", quality),
          );
          if (jpg && jpg.size > 0 && jpg.size <= MAX_UPLOAD_BYTES) {
            return { blob: jpg, ext: "jpg" };
          }
        }
        // Still too big: scale down once and encode again.
        const small = document.createElement("canvas");
        small.width = Math.max(1, Math.round(flat.width * 0.7));
        small.height = Math.max(1, Math.round(flat.height * 0.7));
        const sctx = small.getContext("2d");
        if (!sctx) throw new Error("Canvas context unavailable");
        sctx.imageSmoothingQuality = "high";
        sctx.drawImage(flat, 0, 0, small.width, small.height);
        const last = await new Promise<Blob | null>((resolve) =>
          small.toBlob((b) => resolve(b), "image/jpeg", 0.85),
        );
        small.width = 0;
        small.height = 0;
        if (last && last.size > 0) return { blob: last, ext: "jpg" };
        throw new Error("Final document image could not be encoded.");
      } finally {
        flat.width = 0;
        flat.height = 0;
      }
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }, [createProcessedCanvas]);
  const handleSaveDocument = async (): Promise<boolean> => {
    if (
      !selectedImageSrc ||
      isProcessing ||
      isManualCropping ||
      isErasing ||
      isSavingDocument
    ) {
      return false;
    }
    cancelCloudinarySaveRequest();
    const controller = new AbortController();
    cloudinarySaveRequestRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 45000);
    setIsSavingDocument(true);
    setErrorMessage(null);
    let uploadedPublicId = "";
    try {
      const { blob, ext } = await createProcessedUploadBlob();
      if (!blob.size) {
        throw new Error("Final document image is empty.");
      }
      const formData = new FormData();
      formData.append("file", blob, `scanned-document-${Date.now()}.${ext}`);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        cache: "no-store",
        credentials: "include",
      });
      let uploadResult: any = null;
      try {
        uploadResult = await uploadResponse.json();
      } catch {
        throw new Error("Cloudinary upload API returned an invalid response.");
      }
      if (!uploadResponse.ok || !uploadResult?.success) {
        throw new Error(uploadResult?.error || "Cloudinary upload failed.");
      }
      const cloudinaryUrl =
        typeof uploadResult?.imageUrl === "string"
          ? uploadResult.imageUrl
          : typeof uploadResult?.url === "string"
            ? uploadResult.url
            : "";
      const cloudinaryPublicId =
        typeof uploadResult?.publicId === "string" ? uploadResult.publicId : "";
      if (!cloudinaryUrl) {
        throw new Error("Cloudinary did not return a secure image URL.");
      }
      if (!cloudinaryPublicId) {
        throw new Error("Cloudinary did not return a public_id.");
      }
      uploadedPublicId = cloudinaryPublicId;
      const currentEditingId = editingSavedDocumentId;
      const currentSavedDocument = currentEditingId
        ? savedDocuments.find((item) => item.id === currentEditingId)
        : null;
      if (currentEditingId && !currentSavedDocument) {
        throw new Error("The saved document being edited could not be found.");
      }
      if (currentEditingId) {
        const databaseResponse = await fetch(
          `/api/scanned-documents?id=${encodeURIComponent(currentEditingId)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: currentSavedDocument?.name || "Scanned Document",
              imageUrl: cloudinaryUrl,
              publicId: cloudinaryPublicId,
              adjustments: {
                blackness,
                contrast,
                brightness,
                rotation: normalizeAngle(rotation),
              },
            }),
            signal: controller.signal,
            cache: "no-store",
            credentials: "include",
          },
        );
        let databaseResult: any = null;
        try {
          databaseResult = await databaseResponse.json();
        } catch {
          throw new Error(
            "Saved document update API returned an invalid response.",
          );
        }
        if (
          !databaseResponse.ok ||
          !databaseResult?.success ||
          !databaseResult?.data
        ) {
          throw new Error(
            databaseResult?.error || "Document record could not be updated.",
          );
        }
        const updated = databaseResult.data;
        const updatedDocument: SavedDocument = {
          id: String(updated.id || updated._id || currentEditingId),
          name:
            updated.title || currentSavedDocument?.name || "Scanned Document",
          src: updated.imageUrl || cloudinaryUrl,
          publicId: updated.publicId || cloudinaryPublicId,
          createdAt:
            updated.createdAt ||
            currentSavedDocument?.createdAt ||
            new Date().toISOString(),
          updatedAt: updated.updatedAt,
        };
        setSavedDocuments((prev) =>
          prev.map((item) =>
            item.id === currentEditingId ? updatedDocument : item,
          ),
        );
        setEditingSavedDocumentId(currentEditingId);
        setHasUnsavedChanges(false);
        setErrorMessage(null);
        return true;
      }
      const nextDocumentNumber = savedDocumentCounterRef.current + 1;
      const title = `Document ${String(nextDocumentNumber).padStart(2, "0")}`;
      const databaseResponse = await fetch("/api/scanned-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          imageUrl: cloudinaryUrl,
          publicId: cloudinaryPublicId,
          adjustments: {
            blackness,
            contrast,
            brightness,
            rotation: normalizeAngle(rotation),
          },
        }),
        signal: controller.signal,
        cache: "no-store",
        credentials: "include",
      });
      let databaseResult: any = null;
      try {
        databaseResult = await databaseResponse.json();
      } catch {
        throw new Error("Saved document API returned an invalid response.");
      }
      if (
        !databaseResponse.ok ||
        !databaseResult?.success ||
        !databaseResult?.data
      ) {
        throw new Error(
          databaseResult?.error || "Document record could not be saved.",
        );
      }
      const saved = databaseResult.data;
      const newDocument: SavedDocument = {
        id: String(saved.id || saved._id),
        name: saved.title || title,
        src: saved.imageUrl || cloudinaryUrl,
        publicId: saved.publicId || cloudinaryPublicId,
        createdAt: saved.createdAt || new Date().toISOString(),
        updatedAt: saved.updatedAt,
      };
      savedDocumentCounterRef.current = Math.max(
        savedDocumentCounterRef.current,
        nextDocumentNumber,
      );
      setSavedDocuments((prev) => [newDocument, ...prev]);
      setEditingSavedDocumentId(null);
      setHasUnsavedChanges(false);
      setErrorMessage(null);
      return true;
    } catch (error: any) {
      // If a new Cloudinary image was created but MongoDB save/update failed,
      // remove that new image so an orphan is not left behind.
      if (uploadedPublicId) {
        try {
          await fetch("/api/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              publicId: uploadedPublicId,
            }),
            cache: "no-store",
            credentials: "include",
          });
        } catch (cleanupError) {
          console.error(
            "Cloudinary rollback from client failed:",
            cleanupError,
          );
        }
      }
      if (error?.name === "AbortError") {
        setErrorMessage(
          "Document saving was cancelled or timed out. Please try again.",
        );
      } else {
        console.error("Failed to save/update document:", error);
        setErrorMessage("The document could not be saved. Please try again.");
      }
      return false;
    } finally {
      window.clearTimeout(timeoutId);
      if (cloudinarySaveRequestRef.current === controller) {
        cloudinarySaveRequestRef.current = null;
      }
      setIsSavingDocument(false);
    }
  };
  const handleConfirmNavigationSave = async () => {
    if (pendingNavigationIndex === null) return;
    const targetIndex = pendingNavigationIndex;
    const saved = await handleSaveDocument();
    if (saved) continueToPage(targetIndex);
  };
  const handleConfirmNavigationWithoutSave = () => {
    if (pendingNavigationIndex === null) return;
    const targetIndex = pendingNavigationIndex;
    setHasUnsavedChanges(false);
    continueToPage(targetIndex);
  };
  const handleDownloadSavedDocument = (savedDocument: SavedDocument) => {
    if (!savedDocument.src) {
      setErrorMessage("The saved document URL could not be found.");
      return;
    }
    const link = document.createElement("a");
    link.href = savedDocument.src;
    link.download = `${savedDocument.name
      .toLowerCase()
      .replace(/\s+/g, "-")}.png`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  // Puts the image on a white A4 sheet (300 dpi) inside the page margins.
  const composeOnA4 = async (src: string, m: PageMargins): Promise<string> => {
    const img = await loadImage(src);
    const landscape = img.width > img.height;
    const PW = landscape ? 3508 : 2480;
    const PH = landscape ? 2480 : 3508;
    const pxPerMm = 300 / 25.4;
    const aw = Math.max(50, PW - (m.left + m.right) * pxPerMm);
    const ah = Math.max(50, PH - (m.top + m.bottom) * pxPerMm);
    const k = Math.min(aw / img.width, ah / img.height);
    const dw = img.width * k;
    const dh = img.height * k;
    const out = makeCanvas(PW, PH);
    const ctx = out.getContext("2d");
    if (!ctx) return src;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PW, PH);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      m.left * pxPerMm + (aw - dw) / 2,
      m.top * pxPerMm + (ah - dh) / 2,
      dw,
      dh,
    );
    const composed = out.toDataURL("image/png");
    // Free the A4-sized backing store (~35 MB) right away.
    out.width = 0;
    out.height = 0;
    return composed;
  };
  const handleDownloadImage = async () => {
    if (!processedImageSrc) return;
    try {
      const href = hasPageMargins(pageMargins)
        ? await composeOnA4(processedImageSrc, pageMargins)
        : processedImageSrc;
      const link = document.createElement("a");
      link.href = href;
      link.download = "scanned-image.png";
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      setErrorMessage("The image could not be downloaded. Please try again.");
    }
  };
  const handleDownloadPDFForSource = async (
    imageSrc: string,
    fileName = "scanned-document.pdf",
  ) => {
    if (!imageSrc || isProcessing || isSavingDocument) {
      return;
    }
    try {
      const img = await loadImage(imageSrc);
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // The picture is fitted inside the page margins (mm) and centred there.
      const mg = pageMargins;
      const areaX = mg.left;
      const areaY = mg.top;
      const areaW = Math.max(10, pageWidth - mg.left - mg.right);
      const areaH = Math.max(10, pageHeight - mg.top - mg.bottom);
      const imgRatio = img.width / img.height;
      const areaRatio = areaW / areaH;
      let renderWidth = areaW;
      let renderHeight = areaH;
      let xOffset = areaX;
      let yOffset = areaY;
      if (imgRatio > areaRatio) {
        renderHeight = areaW / imgRatio;
        yOffset = areaY + (areaH - renderHeight) / 2;
      } else {
        renderWidth = areaH * imgRatio;
        xOffset = areaX + (areaW - renderWidth) / 2;
      }
      pdf.addImage(
        img,
        "PNG",
        xOffset,
        yOffset,
        renderWidth,
        renderHeight,
        undefined,
        "FAST",
      );
      pdf.save(fileName);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      setErrorMessage("The PDF could not be created. Please try again.");
    }
  };
  const handleDownloadPDF = async () => {
    await handleDownloadPDFForSource(processedImageSrc, "scanned-document.pdf");
  };
  const handlePrintSource = (imageSrc: string) => {
    if (!imageSrc || isProcessing || isSavingDocument) {
      return;
    }
    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.style.position = "fixed";
    printFrame.style.left = "-10000px";
    printFrame.style.top = "0";
    printFrame.style.width = "100vw";
    printFrame.style.height = "100vh";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";
    const cleanup = () => {
      window.setTimeout(() => {
        if (printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
      }, 500);
    };
    let printTriggered = false;
    const triggerPrint = () => {
      if (printTriggered) return;
      printTriggered = true;
      const printWindow = printFrame.contentWindow;
      if (!printWindow) {
        cleanup();
        setErrorMessage(
          "The print preview could not be opened. Please try again.",
        );
        return;
      }
      printWindow.focus();
      printWindow.onafterprint = cleanup;
      window.setTimeout(() => {
        try {
          printWindow.print();
        } catch (error) {
          console.error("Print failed:", error);
          cleanup();
          setErrorMessage("Printing failed. Please try again.");
        }
      }, 50);
    };
    document.body.appendChild(printFrame);
    const printDocument = printFrame.contentDocument;
    if (!printDocument) {
      cleanup();
      setErrorMessage(
        "The print preview could not be created. Please try again.",
      );
      return;
    }
    printDocument.open();
    printDocument.close();
    const style = printDocument.createElement("style");
    style.textContent = `
      @page {
        size: auto;
        margin: 0;
      }
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #fff;
        overflow: hidden;
      }
      .print-page {
        box-sizing: border-box;
        width: 100vw;
        height: 100vh;
        padding: ${pageMargins.top}mm ${pageMargins.right}mm ${pageMargins.bottom}mm ${pageMargins.left}mm;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        break-after: avoid;
        page-break-after: avoid;
      }
      .print-page img {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
      }
    `;
    const page = printDocument.createElement("div");
    page.className = "print-page";
    const image = printDocument.createElement("img");
    image.alt = DL("Document to print");
    image.src = imageSrc;
    image.onload = triggerPrint;
    image.onerror = () => {
      cleanup();
      setErrorMessage(
        "The document could not be loaded in the print preview. Please try again.",
      );
    };
    page.appendChild(image);
    printDocument.head.appendChild(style);
    printDocument.body.appendChild(page);
    if (image.complete) {
      triggerPrint();
    }
  };
  const handlePrint = () => {
    handlePrintSource(processedImageSrc);
  };
  const handleEditSavedDocument = async (savedDocument: SavedDocument) => {
    if (isProcessing || isSavingDocument || deletingSavedDocumentId) {
      return;
    }
    if (hasUnsavedChanges) {
      const proceed = window.confirm(
        DL(
          "The current document has unsaved changes. Do you want to discard them and edit the saved document?",
        ),
      );
      if (!proceed) return;
    }
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    // Release only locally-created blob URLs; Cloudinary URLs are untouched.
    images.forEach((src) => {
      revokeTrackedObjectURL(src);
    });
    setPreviewSavedDocument(null);
    setEditingSavedDocumentId(savedDocument.id);
    setImages([savedDocument.src]);
    setSelectedIndex(0);
    setIsProcessing(false);
    setErrorMessage(null);
    setRotation(0);
    setBakedRotation(0);
    setEffects(NO_EFFECTS);
    setHistory([]);
    setManualCropOriginalSrc("");
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setIsComparing(false);
    setIsHoldingOriginal(false);
    setHasUnsavedChanges(false);
    setPendingNavigationIndex(null);
    setAutoCrop(false);
    setIsManualCropping(false);
    setCropReady(false);
    setManualCropSourceSrc("");
    setManualCropSourceBakedRotation(0);
    resetCorners();
    try {
      const img = await loadImage(savedDocument.src);
      const canvas = createRotatedCanvas(img, 0);
      const source = canvas.toDataURL("image/png");
      setUncroppedSrc(source);
      setCroppedOriginalSrc(source);
      setCleanBaseSrc(source);
      setRotatedOriginalSrc(source);
    } catch (error) {
      console.error("Failed to load saved document for editing:", error);
      setErrorMessage(
        "The image could not be loaded for editing the saved document.",
      );
    }
  };
  const handleOpenSavedPreview = (savedDocument: SavedDocument) => {
    if (!savedDocument.src) {
      setErrorMessage("The saved document URL could not be found.");
      return;
    }
    setPreviewSavedDocument(savedDocument);
  };
  const handleRemoveSavedDocument = async (savedDocument: SavedDocument) => {
    if (!savedDocument?.id || deletingSavedDocumentId) return;
    const shouldDelete = window.confirm(
      `${DL("Are you sure you want to delete")} ${savedDocument.name}?`,
    );
    if (!shouldDelete) return;
    setDeletingSavedDocumentId(savedDocument.id);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `/api/scanned-documents?id=${encodeURIComponent(savedDocument.id)}`,
        {
          method: "DELETE",
          cache: "no-store",
          credentials: "include",
        },
      );
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Document delete failed.");
      }
      setSavedDocuments((prev) =>
        prev.filter((item) => item.id !== savedDocument.id),
      );
      if (previewSavedDocument?.id === savedDocument.id) {
        setPreviewSavedDocument(null);
      }
      if (editingSavedDocumentId === savedDocument.id) {
        setEditingSavedDocumentId(null);
      }
    } catch (error) {
      console.error("Failed to delete saved document:", error);
      setErrorMessage("The document could not be deleted. Please try again.");
    } finally {
      setDeletingSavedDocumentId(null);
    }
  };
  const createCurrentWorkingCanvas =
    useCallback(async (): Promise<HTMLCanvasElement | null> => {
      if (!selectedImageSrc) return null;
      const source = croppedOriginalSrc || selectedImageSrc;
      const img = await loadImage(source);
      return createRotatedCanvas(img, normalizeAngle(rotation - bakedRotation));
    }, [
      selectedImageSrc,
      croppedOriginalSrc,
      rotation,
      bakedRotation,
      loadImage,
      createRotatedCanvas,
    ]);
  const handleResetAdjustments = () => {
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
  };
  const handleReset = () => {
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    const src = selectedImageSrc;
    setBlackness(0);
    setContrast(0);
    setBrightness(0);
    setEffects(NO_EFFECTS);
    setHistory([]);
    setManualCropOriginalSrc("");
    setRotation(0);
    setBakedRotation(0);
    setAutoCrop(false);
    setIsManualCropping(false);
    setCropReady(false);
    setManualCropSourceSrc("");
    setManualCropSourceBakedRotation(0);
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setIsComparing(false);
    setIsHoldingOriginal(false);
    setHasUnsavedChanges(false);
    setPendingNavigationIndex(null);
    setErrorMessage(null);
    resetCorners();
    if (src) {
      setUncroppedSrc(src);
      setCroppedOriginalSrc(src);
      setCleanBaseSrc(src);
      setRotatedOriginalSrc(src);
    }
  };
  const describeEffectError = (error: unknown): string => {
    const message = error instanceof Error ? error.message : "";
    return /MODEL_FETCH_FAILED|failed to fetch|network/i.test(message)
      ? "The AI model could not be loaded. Check your internet connection and try again."
      : /memory|allocate|RangeError/i.test(message)
        ? "The device is out of memory. Close other tabs and try again."
        : "Document processing could not be completed. Please try again.";
  };
  const canChangeImage = (): boolean =>
    !!selectedImageSrc &&
    !!cleanBaseSrc &&
    !isProcessing &&
    !isManualCropping &&
    !isErasing &&
    !isSavingDocument;
  // ---- history (undo) -------------------------------------------------------
  const takeSnapshot = (): Snapshot => ({
    original: croppedOriginalSrc || selectedImageSrc,
    processed: cleanBaseSrc,
    effects,
    bakedRotation,
    autoCrop,
  });
  const pushHistory = (step: StepKind) => {
    const entry: HistoryEntry = { step, prev: takeSnapshot() };
    setHistory((prev) => [...prev, entry].slice(-MAX_HISTORY));
  };
  // Index of the newest history entry for this effect, or -1 when it cannot
  // be removed any more (a crop happened after it, or it is not applied).
  const findEffectUndoIndex = (stage: EffectKey): number => {
    for (let i = history.length - 1; i >= 0; i--) {
      const step = history[i].step;
      if (step === stage) return i;
      if (step !== "color" && step !== "clean" && step !== "enhance") return -1;
    }
    return -1;
  };
  // Go back to the state before history[index] (and drop everything after it).
  const undoTo = (index: number) => {
    const entry = history[index];
    if (!entry || !canChangeImage()) return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    setErrorMessage(null);
    setCroppedOriginalSrc(entry.prev.original);
    setRotatedOriginalSrc(entry.prev.original);
    setCleanBaseSrc(entry.prev.processed);
    setEffects(entry.prev.effects);
    setBakedRotation(entry.prev.bakedRotation);
    setAutoCrop(entry.prev.autoCrop);
    setHasUnsavedChanges(true);
    setHistory((prev) => prev.slice(0, index));
  };
  const handleUndoLast = () => undoTo(history.length - 1);
  const handleUndoEffect = (stage: EffectKey) => {
    const index = findEffectUndoIndex(stage);
    if (index >= 0) undoTo(index);
  };
  // ---- effects ------------------------------------------------------------
  /**
   * Applies ONE effect step on top of the image that is on screen now.
   * (Magic Clean pressed again = one more pass on the previous result.)
   */
  const applyEffectStep = async (stage: EffectKey) => {
    if (!canChangeImage()) return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    enhanceAbortRef.current?.abort();
    const currentProcessingId = ++processingIdRef.current;
    const controller = new AbortController();
    enhanceAbortRef.current = controller;
    const rotationAtStart = rotation;
    const pendingRotation = normalizeAngle(rotation - bakedRotation);
    const isStale = () =>
      controller.signal.aborted ||
      currentProcessingId !== processingIdRef.current;
    try {
      setErrorMessage(null);
      setActiveStage(stage);
      setIsProcessing(true);
      // Input = what the person sees now (all earlier steps included).
      const inputImg = await loadImage(cleanBaseSrc);
      if (isStale()) return;
      const input = createRotatedCanvas(inputImg, pendingRotation);
      let stageSrc: string;
      if (stage === "enhance") {
        setEnhanceProgress({ stage: "load", percent: 0 });
        const enhanced = await enhanceCanvas(input, {
          scale: 2,
          signal: controller.signal,
          onProgress: (progress) => {
            if (!isStale()) setEnhanceProgress(progress);
          },
        });
        if (isStale()) return;
        setEnhanceProgress(null);
        stageSrc = capCanvasSize(enhanced, MAX_ENHANCE_SIDE).toDataURL(
          "image/png",
        );
      } else if (stage === "clean") {
        // Client-side shadow / background clean + text sharpening.
        const cleaned = await cleanDocumentCanvas(input, {
          signal: controller.signal,
        });
        if (isStale()) return;
        stageSrc = cleaned.toDataURL("image/png");
      } else {
        // Color Document: its own, separate clean of the page (same cleaning
        // as Document Clean). Afterwards the Restore color tool opens so the
        // person can colour the parts they want on the cleaned page.
        const colored = await cleanDocumentCanvas(input, {
          signal: controller.signal,
        });
        if (isStale()) return;
        stageSrc = colored.toDataURL("image/png");
      }
      // The effect-free twin only gets the pending rotation baked in.
      let originalSrc = croppedOriginalSrc || selectedImageSrc;
      if (pendingRotation !== 0) {
        const originalImg = await loadImage(originalSrc);
        originalSrc = createRotatedCanvas(
          originalImg,
          pendingRotation,
        ).toDataURL("image/png");
      }
      if (isStale()) return;
      pushHistory(stage);
      setEffects({
        ...effects,
        color: stage === "color" ? true : effects.color,
        clean: stage === "clean" ? true : effects.clean,
        enhance:
          stage === "enhance"
            ? Math.min(MAX_ENHANCE_PASSES, effects.enhance + 1)
            : effects.enhance,
      });
      setHasUnsavedChanges(true);
      setCroppedOriginalSrc(originalSrc);
      setRotatedOriginalSrc(originalSrc);
      setCleanBaseSrc(stageSrc);
      setBakedRotation(rotationAtStart);
    } catch (error) {
      if (
        isEnhanceAbort(error) ||
        isCleanAbort(error) ||
        isColorAbort(error) ||
        currentProcessingId !== processingIdRef.current
      )
        return;
      console.error("Applying effect failed:", error);
      setErrorMessage(describeEffectError(error));
    } finally {
      if (enhanceAbortRef.current === controller) {
        enhanceAbortRef.current = null;
        setIsProcessing(false);
        setEnhanceProgress(null);
        setActiveStage(null);
      }
    }
  };
  const handleApplyEffect = (stage: EffectKey) => {
    if (!canChangeImage()) return;
    // Already applied -> never run it a second time by accident.
    if (stage === "color" && effects.color) return;
    if (stage === "clean" && effects.clean) return;
    if (stage === "enhance" && effects.enhance >= MAX_ENHANCE_PASSES) return;
    void applyEffectStep(stage);
  };
  // ---- crop -----------------------------------------------------------------
  const handleTriggerAutoCrop = async () => {
    if (!canChangeImage()) return;
    // The current image was already auto-cropped and nothing changed since:
    // there is nothing left to crop.
    if (autoCrop && history[history.length - 1]?.step === "autoCrop") return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    enhanceAbortRef.current?.abort();
    const currentProcessingId = ++processingIdRef.current;
    const controller = new AbortController();
    enhanceAbortRef.current = controller;
    const rotationAtStart = rotation;
    const pendingRotation = normalizeAngle(rotation - bakedRotation);
    const hasEffects = hasAnyEffect(effects);
    const isStale = () =>
      controller.signal.aborted ||
      currentProcessingId !== processingIdRef.current;
    setIsManualCropping(false);
    setCropReady(false);
    resetCorners();
    setErrorMessage(null);
    setActiveStage(null);
    try {
      setIsProcessing(true);
      setIsAutoCropping(true);
      // OpenCV.js can take a moment on the first visit: show the loading
      // state and carry on as soon as it is ready (never a server call).
      const cvReady = await ensureOpenCvReady(controller.signal);
      if (isStale()) return;
      if (!cvReady) {
        setErrorMessage(
          "OpenCV could not be loaded. Check your internet connection and try again, or use Manual crop.",
        );
        return;
      }
      // Let the loading overlay paint before the heavy work starts.
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (isStale()) return;
      // Crop exactly what is on screen (Magic Clean etc. stay as they are).
      const processedImg = await loadImage(cleanBaseSrc);
      if (isStale()) return;
      const processedCanvas = createRotatedCanvas(
        processedImg,
        pendingRotation,
      );
      let originalCanvas: HTMLCanvasElement | null = null;
      let sameShape = false;
      if (hasEffects) {
        const originalImg = await loadImage(
          croppedOriginalSrc || selectedImageSrc,
        );
        if (isStale()) return;
        originalCanvas = createRotatedCanvas(originalImg, pendingRotation);
        sameShape =
          Math.abs(
            originalCanvas.width / originalCanvas.height -
              processedCanvas.width / processedCanvas.height,
          ) < 0.02;
      }
      // With effects on, the corners are found on the effect-free twin (a
      // plain photo) and applied to BOTH images.
      const corners = detectDocumentCorners(
        originalCanvas && sameShape ? originalCanvas : processedCanvas,
      );
      if (!corners) {
        setErrorMessage(
          "The document edges could not be detected. Use Manual crop.",
        );
        return;
      }
      const toPixels = (c: HTMLCanvasElement): Point[] =>
        corners.map((pt) => ({ x: pt.x * c.width, y: pt.y * c.height }));
      const processedCrop = warpByImagePoints(
        processedCanvas,
        toPixels(processedCanvas),
        MAX_ENHANCE_SIDE,
      );
      if (!processedCrop) throw new Error("Crop warp failed");
      const croppedProcessed = processedCrop.toDataURL("image/png");
      let croppedOriginal = croppedProcessed;
      if (originalCanvas && sameShape) {
        const originalCrop = warpByImagePoints(
          originalCanvas,
          toPixels(originalCanvas),
        );
        if (originalCrop) {
          croppedOriginal = originalCrop.toDataURL("image/png");
        }
      }
      if (isStale()) return;
      pushHistory("autoCrop");
      setHasUnsavedChanges(true);
      setCroppedOriginalSrc(croppedOriginal);
      setRotatedOriginalSrc(croppedOriginal);
      setCleanBaseSrc(croppedProcessed);
      setBakedRotation(rotationAtStart);
      setAutoCrop(true);
      setIsManualCropping(false);
    } catch (error) {
      if (currentProcessingId !== processingIdRef.current) return;
      console.error("Auto crop failed:", error);
      setErrorMessage("Auto crop could not be completed. Please try again.");
    } finally {
      setIsAutoCropping(false);
      if (enhanceAbortRef.current === controller) {
        enhanceAbortRef.current = null;
        setIsProcessing(false);
        setEnhanceProgress(null);
        setActiveStage(null);
      }
    }
  };
  const handleTriggerManualCrop = () => {
    if (
      !selectedImageSrc ||
      !cleanBaseSrc ||
      isProcessing ||
      isSavingDocument ||
      isErasing
    )
      return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    if (isManualCropping) {
      setIsManualCropping(false);
      setManualCropSourceSrc("");
      setManualCropOriginalSrc("");
      setHasUnsavedChanges(true);
      // The crop preview already works on the finished (Magic Clean etc.)
      // image, so nothing has to be re-applied. If the corners were never
      // moved, the step that was recorded when cropping started is dropped.
      if (!cropReady) setHistory((prev) => prev.slice(0, -1));
      return;
    }
    // Crop the image that is on screen now, effects included.
    pushHistory("manualCrop");
    setAutoCrop(false);
    setCropReady(false);
    resetCorners();
    setManualCropSourceSrc(cleanBaseSrc || selectedImageSrc);
    setManualCropOriginalSrc(croppedOriginalSrc || selectedImageSrc);
    setManualCropSourceBakedRotation(bakedRotation);
    setIsManualCropping(true);
  };

  // ---- zoom & pan -----------------------------------------------------------
  // Zoom up to 8x and drag the document around (hand tool, Space + drag, middle
  // mouse button, or simply drag when no markup/crop tool is active).
  useEffect(() => {
    zoomRef.current = zoom;
    panRef.current = pan;
  }, [zoom, pan]);
  const clampPan = (p: Point, z: number): Point => {
    const box = previewBoxRef.current;
    const frame = containerRef.current;
    if (!box || !frame) return p;
    const scale = z / 100;
    const maxX = Math.max(0, (frame.offsetWidth * scale + box.clientWidth) / 2 - 60);
    const maxY = Math.max(0, (frame.offsetHeight * scale + box.clientHeight) / 2 - 60);
    return {
      x: Math.min(maxX, Math.max(-maxX, p.x)),
      y: Math.min(maxY, Math.max(-maxY, p.y)),
    };
  };
  // Zooms to `nextZoom` (percent). With an anchor (screen point) the spot under
  // the anchor stays where it is, so you can zoom straight into a word.
  const zoomTo = (nextZoom: number, anchor?: { x: number; y: number }) => {
    const z0 = zoomRef.current;
    const z1 = clampZoom(nextZoom);
    if (z1 === z0) return;
    const box = previewBoxRef.current;
    let dx = 0;
    let dy = 0;
    if (anchor && box) {
      const r = box.getBoundingClientRect();
      const ps = pageScaleRef.current || 1;
      dx = (anchor.x - (r.left + r.width / 2)) / ps;
      dy = (anchor.y - (r.top + r.height / 2)) / ps;
    }
    const p0 = panRef.current;
    const k = z1 / z0;
    const next =
      z1 <= 100
        ? { x: 0, y: 0 }
        : clampPan({ x: dx - k * (dx - p0.x), y: dy - k * (dy - p0.y) }, z1);
    zoomRef.current = z1;
    panRef.current = next;
    setZoom(z1);
    setPan(next);
  };
  const resetView = () => {
    zoomRef.current = 100;
    panRef.current = { x: 0, y: 0 };
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };
  const startPan = (e: React.PointerEvent<Element>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    panDragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      px: panRef.current.x,
      py: panRef.current.y,
    };
    setIsPanning(true);
  };
  const movePan = (e: React.PointerEvent<Element>) => {
    const d = panDragRef.current;
    if (!d) return;
    const ps = pageScaleRef.current || 1;
    const next = clampPan(
      { x: d.px + (e.clientX - d.sx) / ps, y: d.py + (e.clientY - d.sy) / ps },
      zoomRef.current,
    );
    panRef.current = next;
    setPan(next);
  };
  const endPan = (e: React.PointerEvent<Element>) => {
    if (!panDragRef.current) return;
    panDragRef.current = null;
    setIsPanning(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  // Ctrl / ⌘ + scroll (also trackpad pinch) zooms towards the cursor.
  useEffect(() => {
    const box = previewBoxRef.current;
    if (!box) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomTo(zoomRef.current * Math.exp(-e.deltaY * 0.002), {
        x: e.clientX,
        y: e.clientY,
      });
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Hold Space to move the document, even while a markup tool is active.
  useEffect(() => {
    const ignore = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      return (
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(el.tagName) ||
        el.isContentEditable
      );
    };
    const setHeld = (v: boolean) => {
      if (spaceHeldRef.current === v) return;
      spaceHeldRef.current = v;
      setSpaceHeld(v);
    };
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || ignore(e.target)) return;
      e.preventDefault();
      setHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setHeld(false);
    };
    const blur = () => setHeld(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  // ---- eraser ---------------------------------------------------------------
  const eraserRadiusFrac = brushRadiusFrac(brushTool, eraserSize);
  const isLineTool = brushTool === "dots" || brushTool === "underline";
  const isBorderTool = brushTool === "border";
  const isWriteTool = brushTool === "write";
  const isPunctTool = brushTool === "punct";
  const isSealTool = brushTool === "seal";
  const isCustomSeal = sealStyle.startsWith("custom:");
  useEffect(() => {
    if (!isSealTool) setSealCapture(false);
  }, [isSealTool]);
  // Load the seals the person copied earlier (kept in this browser).
  useEffect(() => {
    let dead = false;
    try {
      const raw = window.localStorage.getItem(CUSTOM_SEAL_KEY);
      const list: CustomSeal[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list) || list.length === 0) return;
      void Promise.all(
        list.map(
          (it) =>
            new Promise<CustomSeal | null>((resolve) => {
              if (!it?.id || !it?.data) return resolve(null);
              const img = new Image();
              img.onload = () => {
                const cv = document.createElement("canvas");
                cv.width = img.naturalWidth;
                cv.height = img.naturalHeight;
                cv.getContext("2d")?.drawImage(img, 0, 0);
                customSealCanvases.set(it.id, cv);
                resolve(it);
              };
              img.onerror = () => resolve(null);
              img.src = it.data;
            }),
        ),
      ).then((done) => {
        if (!dead) setCustomSeals(done.filter((x): x is CustomSeal => !!x));
      });
    } catch {
      /* no saved seals */
    }
    return () => {
      dead = true;
    };
  }, []);
  const saveCustomSeals = (list: CustomSeal[]) => {
    setCustomSeals(list);
    try {
      window.localStorage.setItem(CUSTOM_SEAL_KEY, JSON.stringify(list));
    } catch {
      /* storage full / blocked: the seals still work until the page closes */
    }
  };
  // Copies the seal inside the dragged box from the page and keeps it as a
  // new seal design. The paper colour is divided out, so the picture can be
  // stamped ("multiply") on any paper and looks the same as in the original.
  const captureSealFromRect = (rect: FractionRect) => {
    // What the person sees on the screen is what must be copied: the preview
    // canvas first. (The old code read the raw coloured photo after "Document
    // Clean", which is paler than the cleaned page the person pointed at.)
    const shown = eraseCanvasRef.current;
    const candidates: HTMLCanvasElement[] = [];
    if (shown && shown.width > 8 && eraseReadyRef.current) candidates.push(shown);
    if (eraseBaseCanvasRef.current) candidates.push(eraseBaseCanvasRef.current);
    if (eraseColorCanvasRef.current) candidates.push(eraseColorCanvasRef.current);
    if (candidates.length === 0) return;
    const MAX_SIDE = 640; // keep the seal sharp (only ever scaled down)
    // Cuts the box out of one canvas and measures how coloured it is.
    const grab = (src: HTMLCanvasElement) => {
      const sx = Math.max(0, Math.round(rect.x0 * src.width));
      const sy = Math.max(0, Math.round(rect.y0 * src.height));
      const sw = Math.min(src.width - sx, Math.round((rect.x1 - rect.x0) * src.width));
      const sh = Math.min(src.height - sy, Math.round((rect.y1 - rect.y0) * src.height));
      if (sw < 8 || sh < 8) return null;
      const k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
      const out = document.createElement("canvas");
      out.width = Math.max(8, Math.round(sw * k));
      out.height = Math.max(8, Math.round(sh * k));
      const octx = out.getContext("2d", { willReadFrequently: true });
      if (!octx) return null;
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = "high";
      octx.drawImage(src, sx, sy, sw, sh, 0, 0, out.width, out.height);
      const im = octx.getImageData(0, 0, out.width, out.height);
      const d = im.data;
      const n = d.length / 4;
      let col = 0;
      for (let i = 0; i < n; i++) {
        const mx = Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
        const mn = Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
        // Coloured ink = clearly saturated AND not a light paper tint. Judge
        // "light" by luminance, not by the brightest channel: a cleaned blue
        // seal has its blue channel at 255 but is still dark ink.
        const lm = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        if (mx > 0 && (mx - mn) / mx > 0.28 && lm < 225) col++;
      }
      return { out, octx, im, n, colourful: col / n, srcCv: src };
    };
    let g = grab(candidates[0]);
    // The shown page has no colour at all (pure black & white): fall back to
    // the next canvas that still holds the seal's own colour.
    if (g && g.colourful < 0.004) {
      for (let ci = 1; ci < candidates.length; ci++) {
        const alt = grab(candidates[ci]);
        if (alt && alt.colourful > g.colourful * 2 && alt.colourful >= 0.004) {
          g = alt;
          break;
        }
      }
    }
    if (!g) return;
    const { out, octx, im, n } = g;
    const d = im.data;
    if (typeof console !== "undefined")
      console.info("[seal-capture v3] source:", candidates.indexOf(g.srcCv), "of", candidates.length, "colourful:", g.colourful.toFixed(3), "size:", out.width, "x", out.height);
    // paper colour = average of the brightest third of the pixels
    const lums: number[] = new Array(n);
    for (let i = 0; i < n; i++)
      lums[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    const sorted = lums.slice().sort((a, b) => b - a);
    const cutoff = sorted[Math.max(0, Math.floor(n * 0.33))];
    let pr = 0;
    let pg = 0;
    let pb = 0;
    let pc = 0;
    for (let i = 0; i < n; i++) {
      if (lums[i] >= cutoff) {
        pr += d[i * 4];
        pg += d[i * 4 + 1];
        pb += d[i * 4 + 2];
        pc++;
      }
    }
    pr = Math.max(1, pr / Math.max(1, pc));
    pg = Math.max(1, pg / Math.max(1, pc));
    pb = Math.max(1, pb / Math.max(1, pc));
    const sm = (a: number, b: number, x: number) => {
      const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return u * u * (3 - 2 * u);
    };
    const nr = new Float32Array(n);
    const ng = new Float32Array(n);
    const nb = new Float32Array(n);
    const sat = new Float32Array(n);
    let colourful = 0;
    for (let i = 0; i < n; i++) {
      // Dividing by the paper colour makes the paper white (255) and leaves
      // the ink exactly as dark as it was. Multiplying it back onto white
      // paper later gives the very same pixel again.
      nr[i] = Math.min(255, (d[i * 4] / pr) * 255);
      ng[i] = Math.min(255, (d[i * 4 + 1] / pg) * 255);
      nb[i] = Math.min(255, (d[i * 4 + 2] / pb) * 255);
      const mx = Math.max(nr[i], ng[i], nb[i]);
      const mn = Math.min(nr[i], ng[i], nb[i]);
      sat[i] = mx > 0 ? (mx - mn) / mx : 0;
      if (sat[i] > 0.28 && 0.299 * nr[i] + 0.587 * ng[i] + 0.114 * nb[i] < 225) colourful++;
    }
    // A coloured seal on a page with black text: keep only the coloured ink.
    const keepOnlyColour = colourful / n >= 0.012;
    for (let i = 0; i < n; i++) {
      const lum = 0.299 * nr[i] + 0.587 * ng[i] + 0.114 * nb[i];
      // Only the faintest paper speckle is faded; faded ink must survive.
      let keep = sm(0.015, 0.06, 1 - lum / 255);
      if (keepOnlyColour) keep *= sm(0.04, 0.12, sat[i]);
      d[i * 4] = 255 - (255 - nr[i]) * keep;
      d[i * 4 + 1] = 255 - (255 - ng[i]) * keep;
      d[i * 4 + 2] = 255 - (255 - nb[i]) * keep;
      d[i * 4 + 3] = 255;
    }
    octx.putImageData(im, 0, 0);
    const id = `c${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
    customSealCanvases.set(id, out);
    // PNG (not JPEG): JPEG noise next to the white paper shows up as a faint
    // box around the seal once it is multiplied onto the page.
    const list = [...customSeals, { id, data: out.toDataURL("image/png") }].slice(-12);
    saveCustomSeals(list);
    setSealStyle(`custom:${id}`);
    setSealOwnColor(true);
    // A copied seal is placed 1:1 — full ink, straight, no wear.
    setSealInk(100);
    setSealWear(0);
    setSealRot(0);
  };
  // ---- writing styles copied from the document ------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(CUSTOM_TEXT_KEY);
      const list: HandStyle[] = raw ? JSON.parse(raw) : [];
      const ok = list.filter((x) => x && typeof x.key === "string" && x.latin);
      for (const it of ok) customTextStyles.set(it.key, { ...it, custom: true });
      setCustomTextList(ok);
    } catch {
      /* no saved styles */
    }
  }, []);
  const saveCustomTextStyles = (list: HandStyle[]) => {
    setCustomTextList(list);
    try {
      window.localStorage.setItem(CUSTOM_TEXT_KEY, JSON.stringify(list));
    } catch {
      /* storage full / blocked: the styles still work until the page closes */
    }
  };
  // Reads the words of a canvas (shares the worker of "Read text").
  const ocrReadText = async (canvas: HTMLCanvasElement): Promise<string> => {
    if (!ocrWorkerRef.current) {
      const { createWorker } = await import("tesseract.js");
      ocrWorkerRef.current = await createWorker("ben+eng", 1, {
        logger: (m: { status?: string; progress?: number }) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
    }
    const result = await ocrWorkerRef.current.recognize(canvas);
    return String(result?.data?.text || "")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim();
  };
  // Copies the writing style of the text inside the dragged box: colour, lean,
  // thickness and the closest font. It is saved like a copied seal.
  const captureTextStyleFromRect = async (rect: FractionRect) => {
    const shown = eraseCanvasRef.current;
    const src =
      shown && shown.width > 8 && eraseReadyRef.current
        ? shown
        : (eraseBaseCanvasRef.current ?? eraseColorCanvasRef.current);
    if (!src || isStyleBusy) return;
    setIsStyleBusy(true);
    setStyleNote("");
    try {
      const crop = readInkFromCanvas(src, rect);
      if (!crop) {
        setStyleNote(DL("No text found in that area. Try a tighter box."));
        return;
      }
      const lean = inkLeanOf(crop);
      let text = "";
      const ocrIn = cropCanvasForOcr(src, rect);
      if (ocrIn) {
        try {
          text = (await ocrReadText(ocrIn)).slice(0, 80);
        } catch {
          text = "";
        }
      }
      let base: HandStyle = handStyleOf("printSans");
      let slant = -lean;
      let stroke = 0;
      let weight = base.weight;
      let matched = false;
      let score = 0;
      if (text.replace(/\s/g, "").length >= 2) {
        // The fonts must be downloaded before the canvas can draw with them.
        await Promise.race([
          Promise.all(HANDWRITING_STYLES.map((st) => ensureHandwritingFont(st))),
          new Promise<void>((resolve) => setTimeout(resolve, 9000)),
        ]);
        const best = matchTextStyle(crop, text, HANDWRITING_STYLES);
        if (best && best.score >= 0.3) {
          matched = true;
          score = best.score;
          base = best.style;
          // Lean the font by only what the document has on top of the font.
          const extra = lean - inkLeanOf(best.sample);
          slant = Math.max(-0.4, Math.min(0.4, base.slant - extra));
          // Heavier ink than the font? Add a thin outline for the difference.
          const bhC = Math.max(1, crop.by1 - crop.by0);
          const bhS = Math.max(1, best.sample.by1 - best.sample.by0);
          const emC = (inkThicknessOf(crop) / bhC) * (bhS / 80);
          const emS = inkThicknessOf(best.sample) / 80;
          const diff = emC - emS;
          stroke = diff > 0.004 ? Math.min(0.07, diff) : 0;
          weight = base.weight;
        }
      }
      if (!matched) {
        // Text could not be read / matched: keep a plain print font but copy
        // the colour, the lean and the thickness of the document text.
        const bhC = Math.max(1, crop.by1 - crop.by0);
        const t = inkThicknessOf(crop) / bhC;
        weight = t > 0.2 ? 700 : t > 0.12 ? 500 : 400;
        slant = Math.max(-0.4, Math.min(0.4, -lean));
      }
      const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
      const st: HandStyle = {
        key: `doc:${id}`,
        label: "Copied style",
        latin: base.latin,
        bangla: base.bangla,
        weight,
        jitter: base.jitter,
        slant,
        alpha: base.alpha,
        color: crop.color,
        stroke,
        thumb: inkThumbOf(crop),
        custom: true,
      };
      customTextStyles.set(st.key, st);
      saveCustomTextStyles([...customTextList, st].slice(-12));
      setWriteStyle(st.key);
      setWriteColor(st.color);
      if (!writeText.trim() && text) setWriteText(text.slice(0, 400));
      setStyleNote(
        matched
          ? `${DL("Closest font")}: ${DL(base.label)} (${Math.round(score * 100)}%)`
          : DL("Could not match a font. Colour, lean and thickness were copied."),
      );
      if (typeof console !== "undefined")
        console.info("[text-style-capture]", { matched, base: base.key, score: Number(score.toFixed(2)), lean: Number(lean.toFixed(2)), stroke: Number(stroke.toFixed(3)), color: crop.color, text });
    } catch (error) {
      console.error("Copying the writing style failed:", error);
      setStyleNote(DL("Could not copy the writing style. Please try again."));
    } finally {
      setIsStyleBusy(false);
    }
  };
  useEffect(() => {
    if (!isWriteTool) setTextStyleCapture(false);
  }, [isWriteTool]);
  const isStampTool = brushTool === "stamp" || brushTool === "recolor";
  const isStampLasso = isStampTool && brushShape === "lasso";
  useEffect(() => {
    if (!isErasing || brushTool !== "write") setOcrMode(false);
  }, [isErasing, brushTool]);
  const brushPaintColor =
    brushTool === "pen" || isLineTool || isBorderTool
      ? penColor
      : brushTool === "highlight"
        ? highlightColor
        : isWriteTool
          ? writeColor
          : brushTool === "recolor"
            ? (stampTint ?? SEAL_COLORS[0])
            : "#000000";
  const clearEraseCommitTimer = () => {
    if (eraseCommitTimerRef.current) {
      clearTimeout(eraseCommitTimerRef.current);
      eraseCommitTimerRef.current = null;
    }
  };
  // Writes the erased real image back into the editor (after a short pause so
  // the page stays smooth while the person is still drawing).
  const commitErase = () => {
    clearEraseCommitTimer();
    const canvas = eraseBaseCanvasRef.current;
    if (!canvas) return;
    const committed = canvas.toDataURL("image/png");
    if (eraseColorKeepRef.current) eraseColorKeepRef.current.base = committed;
    setCleanBaseSrc(committed);
    setHasUnsavedChanges(true);
  };
  const scheduleEraseCommit = () => {
    clearEraseCommitTimer();
    eraseCommitTimerRef.current = setTimeout(commitErase, 500);
  };
  const resetEraseSession = () => {
    clearEraseCommitTimer();
    eraseStrokesRef.current = [];
    eraseCurrentRef.current = null;
    eraseBaseCanvasRef.current = null;
    eraseColorCanvasRef.current = null;
    eraseColorStartRef.current = null;
    eraseStartRef.current = null;
    eraseReadyRef.current = false;
    areaStartRef.current = null;
    lineStartRef.current = null;
    lassoRef.current = null;
    setLassoDraft(null);
    setHandDraft(null);
    setLineDraft(null);
    setAreaRect(null);
    setEraseStrokeCount(0);
    setEraserCursor(null);
  };
  // The stamp remover has no free-hand brush (too heavy for every pointer
  // move), only "box" and "draw around". Other tools have no "draw around".
  const stampAutoShapeRef = useRef<boolean>(false);
  const adjustShapeForTool = (tool: BrushTool) => {
    if (tool === "recolor") {
      // Free hand, box and circle are all allowed. Coming from another tool
      // the box is the starting choice (as before).
      if (brushShape === "free" && brushTool !== "recolor" && brushTool !== "stamp") {
        setBrushShape("area");
        stampAutoShapeRef.current = true;
      }
      return;
    }
    if (tool === "stamp") {
      if (brushShape === "free") {
        setBrushShape("area");
        stampAutoShapeRef.current = true;
      }
      return;
    }
    if (brushShape === "lasso") {
      setBrushShape("free");
    } else if (stampAutoShapeRef.current && brushShape === "area") {
      setBrushShape("free");
    }
    stampAutoShapeRef.current = false;
  };
  const handleToggleEraser = async (tool: BrushTool = "erase") => {
    if (isWriting) return;
    if (isErasing) {
      // Another tool of the same session: just switch the brush.
      if (tool !== brushTool) {
        adjustShapeForTool(tool);
        setBrushTool(tool);
        return;
      }
      // Finish: keep the erased image. No stroke at all -> forget the step.
      const hadStrokes = eraseStrokesRef.current.length > 0;
      if (hadStrokes) commitErase();
      else setHistory((prev) => prev.slice(0, -1));
      resetEraseSession();
      setIsErasing(false);
      return;
    }
    if (!canChangeImage()) return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    processingIdRef.current += 1;
    setErrorMessage(null);
    adjustShapeForTool(tool);
    setBrushTool(tool);
    try {
      const pendingRotation = normalizeAngle(rotation - bakedRotation);
      const baseImg = await loadImage(cleanBaseSrc);
      // Work on the straight (already rotated) image so what is drawn on the
      // screen lines up 1:1 with the real image.
      const baseCanvas = createRotatedCanvas(baseImg, pendingRotation);
      let baseSrc = cleanBaseSrc;
      let originalSrc = croppedOriginalSrc || selectedImageSrc;
      const preRotationOriginal = originalSrc;
      if (pendingRotation !== 0) {
        baseSrc = baseCanvas.toDataURL("image/png");
        const originalImg = await loadImage(originalSrc);
        originalSrc = createRotatedCanvas(
          originalImg,
          pendingRotation,
        ).toDataURL("image/png");
      }
      eraseStartRef.current = {
        base: baseSrc,
        display: processedImageSrc || baseSrc,
      };
      eraseBaseCanvasRef.current = baseCanvas;
      // Page already cleaned (by either button): stamp tools must look at the
      // coloured original to find the stamp.
      eraseEffectedRef.current = effects.clean || effects.color;
      try {
        const colorImg = await loadImage(originalSrc);
        const cc = document.createElement("canvas");
        cc.width = colorImg.naturalWidth || colorImg.width;
        cc.height = colorImg.naturalHeight || colorImg.height;
        const ccx = cc.getContext("2d", { willReadFrequently: true });
        // Reuse the coloured reference of the earlier session (it already
        // contains the seals placed / copied before).
        let kept: HTMLCanvasElement | null = null;
        const keep = eraseColorKeepRef.current;
        // If the page was changed by something else in between (reset, other
        // tool), the saved reference no longer matches the page: drop it.
        if (keep && (pendingRotation !== 0 || keep.base === cleanBaseSrc)) {
          if (keep.key === originalSrc) {
            kept = keep.canvas;
          } else if (pendingRotation !== 0 && keep.key === preRotationOriginal) {
            try {
              const kImg = await loadImage(keep.canvas.toDataURL("image/png"));
              kept = createRotatedCanvas(kImg, pendingRotation);
            } catch {
              kept = null;
            }
          }
        }
        if (kept && kept.width > 0 && kept.height > 0) {
          cc.width = kept.width;
          cc.height = kept.height;
          ccx?.drawImage(kept, 0, 0);
        } else {
          ccx?.drawImage(colorImg, 0, 0);
        }
        eraseColorCanvasRef.current = cc;
        eraseColorKeepRef.current = { key: originalSrc, base: baseSrc, canvas: cc };
        const startCopy = document.createElement("canvas");
        startCopy.width = cc.width;
        startCopy.height = cc.height;
        startCopy.getContext("2d")?.drawImage(cc, 0, 0);
        eraseColorStartRef.current = startCopy;
      } catch {
        eraseColorCanvasRef.current = null;
        eraseColorStartRef.current = null;
      }
      eraseStrokesRef.current = [];
      eraseCurrentRef.current = null;
      setEraseStrokeCount(0);
      pushHistory("erase");
      if (pendingRotation !== 0) {
        setCleanBaseSrc(baseSrc);
        setCroppedOriginalSrc(originalSrc);
        setRotatedOriginalSrc(originalSrc);
        setBakedRotation(rotation);
      }
      setIsErasing(true);
    } catch (error) {
      console.error("Starting the eraser failed:", error);
      setErrorMessage("Document processing could not be completed. Please try again.");
    }
  };
  // The page may already be cleaned (black & white). Stamp tools then look at
  // the coloured original to find the stamp.
  const getStrokeColorCtx = (stroke: EraseStroke) => {
    const cc = eraseColorCanvasRef.current;
    if (!cc) return null;
    const needs =
      stroke.tool === "recolor" ||
      (stroke.tool === "stamp" && eraseEffectedRef.current);
    return needs ? cc.getContext("2d", { willReadFrequently: true }) : null;
  };
  const paintEraseStroke = (stroke: EraseStroke, fromIndex: number) => {
    const targets = [
      eraseCanvasRef.current,
      eraseBaseCanvasRef.current,
    ];
    const colorCtx = getStrokeColorCtx(stroke);
    for (const canvas of targets) {
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      if (canvas && ctx) paintStrokeOn(ctx, stroke, fromIndex, colorCtx);
    }
    // A placed / copied seal must also exist in the coloured reference, or the
    // seal re-colour tool cannot find its ink on a cleaned page.
    if (stroke.tool === "seal" && eraseColorCanvasRef.current) {
      const cctx = eraseColorCanvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
      if (cctx) paintStrokeOn(cctx, stroke, fromIndex, null);
    }
  };
  const getErasePoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = eraseCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    // The frame is CSS-scaled by the zoom: convert screen pixels back to the
    // frame's own pixels so the brush circle lines up at any zoom level.
    const localW = canvas.offsetWidth || rect.width;
    const k = rect.width / localW;
    return {
      rect,
      localW,
      px: (e.clientX - rect.left) / k,
      py: (e.clientY - rect.top) / k,
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };
  // Cuts the picked area out of the real image, makes it bigger / greyer so
  // the reader sees it clearly, and returns a canvas ready for OCR.
  const cropCanvasForOcr = (
    src: HTMLCanvasElement,
    rect: FractionRect,
  ): HTMLCanvasElement | null => {
    const sx = Math.max(0, Math.round(rect.x0 * src.width));
    const sy = Math.max(0, Math.round(rect.y0 * src.height));
    const sw = Math.min(src.width - sx, Math.round((rect.x1 - rect.x0) * src.width));
    const sh = Math.min(src.height - sy, Math.round((rect.y1 - rect.y0) * src.height));
    if (sw < 4 || sh < 4) return null;
    const scale = Math.min(4, Math.max(1, 100 / sh));
    const pad = 12;
    const out = makeCanvas(sw * scale + pad * 2, sh * scale + pad * 2);
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.imageSmoothingQuality = "high";
    ctx.filter = "grayscale(1) contrast(1.15)";
    ctx.drawImage(src, sx, sy, sw, sh, pad, pad, sw * scale, sh * scale);
    return out;
  };
  // Reads Bangla + English text from a canvas (tesseract.js, runs in the
  // browser; the language data downloads once and is then cached).
  const runOcr = async (canvas: HTMLCanvasElement) => {
    setIsOcrRunning(true);
    setOcrProgress(0);
    setOcrNote("");
    try {
      if (!ocrWorkerRef.current) {
        const { createWorker } = await import("tesseract.js");
        ocrWorkerRef.current = await createWorker("ben+eng", 1, {
          logger: (m: { status?: string; progress?: number }) => {
            if (m.status === "recognizing text" && typeof m.progress === "number") {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
        });
      }
      const result = await ocrWorkerRef.current.recognize(canvas);
      const text = String(result?.data?.text || "")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{2,}/g, "\n")
        .trim();
      if (!text) {
        setOcrNote("No text found in that area. Try a tighter box.");
        return;
      }
      setWriteText(text.slice(0, 400));
      setWriteHint(false);
      setOcrMode(false);
    } catch (error) {
      console.error("Reading text failed:", error);
      ocrWorkerRef.current = null;
      setOcrNote("Could not read the text. Check your internet and try again.");
    } finally {
      setIsOcrRunning(false);
    }
  };
  useEffect(
    () => () => {
      void ocrWorkerRef.current?.terminate?.();
    },
    [],
  );
  const handleErasePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || spaceHeldRef.current) {
      startPan(e);
      return;
    }
    if (!eraseReadyRef.current || e.button > 0) return;
    const pos = getErasePoint(e);
    if (!pos) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    clearEraseCommitTimer();
    if (isPunctTool) {
      punctDownRef.current = true;
      setPunctPos({ x: pos.x, y: pos.y });
      return;
    }
    if (isLineTool) {
      lineStartRef.current = { x: pos.x, y: pos.y };
      setLineDraft({ x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y });
      return;
    }
    if (isStampLasso) {
      // The circle grows from the point where the pointer went down.
      lassoCenterRef.current = { x: pos.x, y: pos.y };
      lassoRef.current = [{ x: pos.x, y: pos.y }];
      setLassoDraft([{ x: pos.x, y: pos.y }]);
      return;
    }
    if (brushShape === "area" || isBorderTool || isWriteTool || isSealTool) {
      writeSeedRef.current = Math.floor(Math.random() * 2147483646) + 1;
      areaStartRef.current = { x: pos.x, y: pos.y };
      setAreaRect({ x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y });
      return;
    }
    const stroke: EraseStroke = {
      pts: [{ x: pos.x, y: pos.y }],
      r: eraserRadiusFrac,
      tool: brushTool,
      color: brushPaintColor,
      strength: isStampTool ? stampStrength : undefined,
      tint: brushTool === "recolor" ? stampTint : undefined,
    };
    eraseCurrentRef.current = stroke;
    if (brushTool === "recolor") {
      setHandDraft([{ x: pos.x, y: pos.y }]);
    } else {
      paintEraseStroke(stroke, 0);
    }
    setEraserCursor({ x: pos.px, y: pos.py, d: eraserRadiusFrac * 2 * pos.localW });
  };
  const handleErasePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panDragRef.current) {
      movePan(e);
      return;
    }
    const pos = getErasePoint(e);
    if (!pos) return;
    if (isPunctTool) {
      // Live preview: the mark follows the pointer before it is placed.
      setPunctPos({ x: pos.x, y: pos.y });
      return;
    }
    if (isLineTool) {
      const st = lineStartRef.current;
      const cv = eraseCanvasRef.current;
      if (st && cv) {
        const end = snapLineEnd(st, { x: pos.x, y: pos.y }, cv.width, cv.height, cv);
        setLineDraft({ x0: st.x, y0: st.y, x1: end.x, y1: end.y });
      }
      return;
    }
    if (isStampLasso) {
      const center = lassoCenterRef.current;
      const cv = eraseCanvasRef.current;
      if (center && cv) {
        // The press point and the release point are opposite edges of the
        // circle (a diameter): centre = middle of the two, radius = half the gap.
        const rPx =
          Math.hypot(
            (pos.x - center.x) * cv.width,
            (pos.y - center.y) * cv.height,
          ) / 2;
        const rx = rPx / cv.width;
        const ry = rPx / cv.height;
        const mx = (center.x + pos.x) / 2;
        const my = (center.y + pos.y) / 2;
        const ring: Point[] = [];
        for (let i = 0; i < 64; i++) {
          const ang = (i / 64) * Math.PI * 2;
          ring.push({
            x: Math.min(1, Math.max(0, mx + Math.cos(ang) * rx)),
            y: Math.min(1, Math.max(0, my + Math.sin(ang) * ry)),
          });
        }
        lassoRef.current = ring;
        setLassoDraft(ring);
      }
      return;
    }
    if (brushShape === "area" || isBorderTool || isWriteTool || isSealTool) {
      const st = areaStartRef.current;
      if (st) {
        setAreaRect({
          x0: Math.min(st.x, pos.x),
          y0: Math.min(st.y, pos.y),
          x1: Math.max(st.x, pos.x),
          y1: Math.max(st.y, pos.y),
        });
      }
      return;
    }
    setEraserCursor({ x: pos.px, y: pos.py, d: eraserRadiusFrac * 2 * pos.localW });
    const stroke = eraseCurrentRef.current;
    if (!stroke) return;
    const canvas = eraseCanvasRef.current;
    if (!canvas) return;
    const last = stroke.pts[stroke.pts.length - 1];
    const dx = (pos.x - last.x) * canvas.width;
    const dy = (pos.y - last.y) * canvas.height;
    const spacing = Math.max(2, stroke.r * canvas.width * 0.35);
    if (Math.hypot(dx, dy) < spacing) return;
    stroke.pts.push({ x: pos.x, y: pos.y });
    if (stroke.tool === "recolor") {
      setHandDraft(stroke.pts.slice());
      return;
    }
    paintEraseStroke(stroke, stroke.pts.length - 1);
  };
  const handleErasePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panDragRef.current) {
      endPan(e);
      return;
    }
    if (punctDownRef.current) {
      punctDownRef.current = false;
      const pos = getErasePoint(e);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      // On touch there is no hover, so hide the preview once the finger lifts.
      if (e.pointerType !== "mouse") setPunctPos(null);
      if (!pos) return;
      const mark = punctMark.trim();
      if (!mark) {
        setPunctHint(true);
        return;
      }
      const punctStroke: EraseStroke = {
        pts: [{ x: pos.x, y: pos.y }],
        r: 0,
        tool: "punct",
        color: punctColor,
        style: punctStyle,
        text: mark,
        sizeMul: punctSize / 100,
        seed: punctSeedRef.current,
        clearFirst: writeClearFirst,
      };
      punctSeedRef.current = Math.floor(Math.random() * 2147483646) + 1;
      setIsWriting(true);
      const fontReady = Promise.race([
        ensureHandwritingFont(handStyleOf(punctStyle)),
        new Promise<void>((resolve) => setTimeout(resolve, 3000)),
      ]);
      void fontReady
        .then(() => {
          paintEraseStroke(punctStroke, 0);
          eraseStrokesRef.current.push(punctStroke);
          setEraseStrokeCount(eraseStrokesRef.current.length);
          scheduleEraseCommit();
        })
        .catch((error) => {
          console.error("Punctuation failed:", error);
          setErrorMessage(
            "Document processing could not be completed. Please try again.",
          );
        })
        .finally(() => setIsWriting(false));
      return;
    }
    const lassoPts = lassoRef.current;
    if (lassoPts) {
      lassoRef.current = null;
      lassoCenterRef.current = null;
      setLassoDraft(null);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (lassoPts.length >= 3) {
        let minX = 1;
        let minY = 1;
        let maxX = 0;
        let maxY = 0;
        for (const p of lassoPts) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
        if (maxX - minX > 0.004 && maxY - minY > 0.004) {
          const lassoStroke: EraseStroke = {
            pts: lassoPts,
            r: eraserRadiusFrac,
            tool: brushTool,
            color: "#000000",
            lasso: true,
            strength: stampStrength,
            tint: brushTool === "recolor" ? stampTint : null,
          };
          paintEraseStroke(lassoStroke, 0);
          eraseStrokesRef.current.push(lassoStroke);
          setEraseStrokeCount(eraseStrokesRef.current.length);
          scheduleEraseCommit();
        }
      }
      return;
    }
    const lineStart = lineStartRef.current;
    if (lineStart) {
      lineStartRef.current = null;
      const pos = getErasePoint(e);
      const cv = eraseCanvasRef.current;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      setLineDraft(null);
      if (pos && cv) {
        const end = snapLineEnd(lineStart, { x: pos.x, y: pos.y }, cv.width, cv.height, cv);
        const lenPx = Math.hypot(
          (end.x - lineStart.x) * cv.width,
          (end.y - lineStart.y) * cv.height,
        );
        if (lenPx >= 4) {
          const lineStroke: EraseStroke = {
            pts: [lineStart, end],
            r: eraserRadiusFrac,
            tool: brushTool,
            color: brushPaintColor,
            clearFirst: writeClearFirst,
          };
          paintEraseStroke(lineStroke, 0);
          eraseStrokesRef.current.push(lineStroke);
          setEraseStrokeCount(eraseStrokesRef.current.length);
          scheduleEraseCommit();
        }
      }
      return;
    }
    const areaStart = areaStartRef.current;
    if (areaStart) {
      areaStartRef.current = null;
      const pos = getErasePoint(e);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      setAreaRect(null);
      if (pos) {
        const rect: FractionRect = {
          x0: Math.min(areaStart.x, pos.x),
          y0: Math.min(areaStart.y, pos.y),
          x1: Math.max(areaStart.x, pos.x),
          y1: Math.max(areaStart.y, pos.y),
        };
        if (rect.x1 - rect.x0 > 0.004 && rect.y1 - rect.y0 > 0.004) {
          if (isWriteTool && textStyleCapture) {
            // "Take writing style" mode: the dragged box is measured, not painted.
            setTextStyleCapture(false);
            void captureTextStyleFromRect(rect);
            return;
          }
          if (isWriteTool && ocrMode) {
            // "Read text" mode: the dragged box is read, not painted.
            const src = eraseBaseCanvasRef.current;
            const crop = src ? cropCanvasForOcr(src, rect) : null;
            if (crop && !isOcrRunning) void runOcr(crop);
            return;
          }
          if (isWriteTool) {
            // Handwriting: the typed text is written inside the dragged box.
            const typed = writeText.trim();
            if (!typed) {
              setWriteHint(true);
              return;
            }
            const writeStroke: EraseStroke = {
              pts: [],
              r: eraserRadiusFrac,
              tool: "write",
              color: writeColor,
              rect,
              style: writeStyle,
              text: typed,
              sizeMul: writeSize / 100,
              seed: writeSeedRef.current,
              clearFirst: writeClearFirst,
            };
            // The web font must be downloaded before the canvas can use it.
            // Show a loading note while it downloads, but never wait forever.
            setIsWriting(true);
            const fontReady = Promise.race([
              ensureHandwritingFont(handStyleOf(writeStyle)),
              new Promise<void>((resolve) => setTimeout(resolve, 3000)),
            ]);
            void fontReady
              .then(() => {
                paintEraseStroke(writeStroke, 0);
                eraseStrokesRef.current.push(writeStroke);
                setEraseStrokeCount(eraseStrokesRef.current.length);
                scheduleEraseCommit();
              })
              .catch((error) => {
                console.error("Handwriting failed:", error);
                setErrorMessage(
                  "Document processing could not be completed. Please try again.",
                );
              })
              .finally(() => setIsWriting(false));
            return;
          }
          if (isSealTool && sealCapture) {
            captureSealFromRect(rect);
            setSealCapture(false);
            return;
          }
          if (isSealTool) {
            const sealStroke: EraseStroke = {
              pts: [],
              r: eraserRadiusFrac,
              tool: "seal",
              color: sealColor,
              rect,
              style: sealStyle,
              text: sealCenter,
              sealTop,
              sealBottom,
              sealFont,
              sealRot,
              sealInk: sealInk / 100,
              sealWear: sealWear / 100,
              sealOwnColor: isCustomSeal ? sealOwnColor : true,
              seed: writeSeedRef.current,
            };
            // The web font must be downloaded before the canvas can use it.
            setIsWriting(true);
            const fontReady = Promise.race([
              ensureHandwritingFont(handStyleOf(sealFont)),
              new Promise<void>((resolve) => setTimeout(resolve, 3000)),
            ]);
            void fontReady
              .then(() => {
                paintEraseStroke(sealStroke, 0);
                eraseStrokesRef.current.push(sealStroke);
                setEraseStrokeCount(eraseStrokesRef.current.length);
                scheduleEraseCommit();
              })
              .catch((error) => {
                console.error("Seal failed:", error);
                setErrorMessage(
                  "Document processing could not be completed. Please try again.",
                );
              })
              .finally(() => setIsWriting(false));
            return;
          }
          const areaStroke: EraseStroke = {
            pts: [],
            r: eraserRadiusFrac,
            tool: brushTool,
            color: brushPaintColor,
            rect,
            style: isBorderTool ? borderStyle : undefined,
            clearFirst: isBorderTool ? writeClearFirst : undefined,
            strength: isStampTool ? stampStrength : undefined,
            tint: brushTool === "recolor" ? stampTint : undefined,
          };
          paintEraseStroke(areaStroke, 0);
          eraseStrokesRef.current.push(areaStroke);
          setEraseStrokeCount(eraseStrokesRef.current.length);
          scheduleEraseCommit();
        }
      }
      return;
    }
    const stroke = eraseCurrentRef.current;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!stroke) return;
    eraseCurrentRef.current = null;
    if (stroke.tool === "recolor") {
      // Same engine as "box" and "circle": only the seal ink under the brush
      // path changes colour, so the seal keeps its own shape and texture.
      setHandDraft(null);
      paintEraseStroke(stroke, 0);
    }
    eraseStrokesRef.current.push(stroke);
    setEraseStrokeCount(eraseStrokesRef.current.length);
    scheduleEraseCommit();
  };
  // Removes the last stroke by replaying all the earlier ones from the start.
  const handleEraseUndoStroke = async () => {
    const start = eraseStartRef.current;
    if (!start || eraseStrokesRef.current.length === 0) return;
    if (eraseCurrentRef.current) return;
    clearEraseCommitTimer();
    eraseReadyRef.current = false;
    eraseStrokesRef.current.pop();
    setEraseStrokeCount(eraseStrokesRef.current.length);
    try {
      const [baseImg, displayImg] = await Promise.all([
        loadImage(start.base),
        loadImage(start.display),
      ]);
      const pairs: [HTMLCanvasElement | null, HTMLImageElement][] = [
        [eraseBaseCanvasRef.current, baseImg],
        [eraseCanvasRef.current, displayImg],
      ];
      for (const [canvas, img] of pairs) {
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        if (!canvas || !ctx) continue;
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const replayBaseCtx =
        eraseBaseCanvasRef.current?.getContext("2d", {
          willReadFrequently: true,
        }) ?? null;
      const replayShowCtx =
        eraseCanvasRef.current?.getContext("2d", { willReadFrequently: true }) ??
        null;
      // The coloured reference goes back to its start state as well.
      const colorCv = eraseColorCanvasRef.current;
      const colorStart = eraseColorStartRef.current;
      const replayColorCtx =
        colorCv && colorStart
          ? (colorCv.getContext("2d", { willReadFrequently: true }) ?? null)
          : null;
      if (colorCv && colorStart && replayColorCtx) {
        colorCv.width = colorStart.width;
        colorCv.height = colorStart.height;
        replayColorCtx.clearRect(0, 0, colorCv.width, colorCv.height);
        replayColorCtx.drawImage(colorStart, 0, 0);
      }
      for (const stroke of eraseStrokesRef.current) {
        const cc = getStrokeColorCtx(stroke);
        if (replayShowCtx) paintStrokeOn(replayShowCtx, stroke, 0, cc);
        if (replayBaseCtx) paintStrokeOn(replayBaseCtx, stroke, 0, cc);
        if (replayColorCtx && stroke.tool === "seal")
          paintStrokeOn(replayColorCtx, stroke, 0, null);
      }
      commitErase();
    } catch (error) {
      console.error("Eraser undo failed:", error);
    } finally {
      eraseReadyRef.current = true;
    }
  };

  // ---- one-click document tools ---------------------------------------------
  const applyDocTool = async (kind: DocToolKind) => {
    if (!canChangeImage()) return;
    cancelActiveProcessing();
    cancelCloudinarySaveRequest();
    const currentProcessingId = ++processingIdRef.current;
    const rotationAtStart = rotation;
    const pendingRotation = normalizeAngle(rotation - bakedRotation);
    try {
      setErrorMessage(null);
      setActiveStage(null);
      setIsProcessing(true);
      // Let the "processing" overlay appear before the heavy work starts.
      await new Promise((resolve) => setTimeout(resolve, 40));
      const baseImg = await loadImage(cleanBaseSrc);
      const baseCanvas = createRotatedCanvas(baseImg, pendingRotation);
      let originalSrc = croppedOriginalSrc || selectedImageSrc;
      let bakeOriginal = false;
      if (pendingRotation !== 0) {
        const originalImg = await loadImage(originalSrc);
        originalSrc = createRotatedCanvas(
          originalImg,
          pendingRotation,
        ).toDataURL("image/png");
        bakeOriginal = true;
      }
      if (currentProcessingId !== processingIdRef.current) return;
      let result = baseCanvas;
      if (kind === "invert") {
        result = invertCanvas(baseCanvas);
      } else if (kind === "straighten") {
        // Find how much the text lines are tilted and turn the page back by
        // that much. The effect-free "Normal" twin is turned the same way so
        // the compare / hold views stay aligned.
        const skew = estimateSkewDeg(baseCanvas);
        if (skew === 0) {
          setErrorMessage("The page already looks straight.");
          return;
        }
        result = rotateCanvasByDeg(baseCanvas, -skew);
        const originalImg = await loadImage(originalSrc);
        originalSrc = rotateCanvasByDeg(
          createRotatedCanvas(originalImg, 0),
          -skew,
        ).toDataURL("image/png");
        bakeOriginal = true;
      }
      const baseSrc = result.toDataURL("image/png");
      if (currentProcessingId !== processingIdRef.current) return;
      pushHistory(kind);
      setCleanBaseSrc(baseSrc);
      if (bakeOriginal) {
        setCroppedOriginalSrc(originalSrc);
        setRotatedOriginalSrc(originalSrc);
      }
      setBakedRotation(rotationAtStart);
      setHasUnsavedChanges(true);
    } catch (error) {
      if (currentProcessingId !== processingIdRef.current) return;
      console.error("Document tool failed:", error);
      setErrorMessage(describeEffectError(error));
    } finally {
      if (currentProcessingId === processingIdRef.current) {
        setIsProcessing(false);
        setActiveStage(null);
      }
    }
  };
  // ---- Color Document = Document Clean + Restore color --------------------------
  // 1) the page is cleaned (same as the Document Clean button), then
  // 2) the Restore color tool opens, so the person can choose which parts of
  //    the document get their colour back (paint by hand / box / circle).
  // The tool is opened from an effect, after the cleaned page is in state, so it
  // starts from the cleaned page and not from a stale copy.
  useEffect(() => {
    if (!pendingRecolor || isProcessing) return;
    // The clean did not work out: give up quietly (the error is shown).
    if (!effects.color) {
      setPendingRecolor(false);
      return;
    }
    // The cleaned picture is not on screen yet: wait for the next render.
    if (processedBaseKey !== cleanBaseSrc) return;
    setPendingRecolor(false);
    if (!isErasing) void handleToggleEraser("recolor");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pendingRecolor,
    isProcessing,
    effects.clean,
    processedBaseKey,
    cleanBaseSrc,
    isErasing,
    effects.color,
  ]);
  const handleColorDocument = () => {
    if (!canChangeImage()) return;
    setPendingRecolor(true);
    if (!effects.color) void applyEffectStep("color");
  };
  const renderColorDocumentRow = () => {
    const active = effects.color;
    const busy =
      isProcessing ||
      images.length === 0 ||
      !cleanBaseSrc ||
      isSavingDocument ||
      isManualCropping ||
      isErasing;
    const canRemove = findEffectUndoIndex("color") >= 0;
    return (
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={handleColorDocument}
          disabled={busy}
          aria-pressed={active}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
        >
          {active ? <Check size={14} /> : <Palette size={14} />}
          {DL("Color Document")}
        </button>

        <button
          type="button"
          onClick={() => (active ? handleUndoEffect("color") : handleColorDocument())}
          disabled={busy || (active && !canRemove)}
          title={
            active
              ? canRemove
                ? DL("Remove Color Document")
                : DL(
                    "This cannot be removed separately after cropping or erasing — press Undo.",
                  )
              : DL("Add Color Document")
          }
          aria-label={
            active ? DL("Remove Color Document") : DL("Add Color Document")
          }
          className={`w-9 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#FBF6E8] border-[#FBB6B6] text-[#B91C1C] hover:bg-[#FEE9E9]" : "bg-[#FBF6E8] border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
        >
          {active ? <Minus size={14} /> : <Plus size={14} />}
        </button>
      </div>
    );
  };
  const renderEffectRow = (
    key: "color" | "clean",
    label: string,
    icon: React.ReactNode,
  ) => {
    const active = effects[key];
    const busy =
      isProcessing ||
      images.length === 0 ||
      !cleanBaseSrc ||
      isSavingDocument ||
      isManualCropping ||
      isErasing;
    const canRemove = findEffectUndoIndex(key) >= 0;
    return (
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => handleApplyEffect(key)}
          disabled={busy}
          aria-pressed={active}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
        >
          {active ? <Check size={14} /> : icon}
          {DL(label)}
        </button>

        <button
          type="button"
          onClick={() =>
            active ? handleUndoEffect(key) : handleApplyEffect(key)
          }
          disabled={busy || (active && !canRemove)}
          title={
            active
              ? canRemove
                ? DL(`Remove ${label}`)
                : DL(
                    "This cannot be removed separately after cropping or erasing — press Undo.",
                  )
              : DL(`Add ${label}`)
          }
          aria-label={active ? DL(`Remove ${label}`) : DL(`Add ${label}`)}
          className={`w-9 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#FBF6E8] border-[#FBB6B6] text-[#B91C1C] hover:bg-[#FEE9E9]" : "bg-[#FBF6E8] border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
        >
          {active ? <Minus size={14} /> : <Plus size={14} />}
        </button>
      </div>
    );
  };
  const renderSwatches = (
    colors: string[],
    value: string,
    onPick: (c: string) => void,
    label: string,
  ) => (
    <div className="flex flex-wrap items-center gap-2" aria-label={DL(label)}>
      <span className="text-[13px] font-semibold text-[#5A4A32]">{DL(label)}</span>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          aria-label={c}
          style={{ backgroundColor: c }}
          className={`w-6 h-6 rounded-full cursor-pointer border-2 ${value.toLowerCase() === c.toLowerCase() ? "border-[#DC2626] ring-2 ring-[#DC2626]/30" : "border-[#FBF6E8]"}`}
        />
      ))}
      {/* Custom colour: pick any colour you like. */}
      {(() => {
        const isCustom = !colors.some(
          (c) => c.toLowerCase() === value.toLowerCase(),
        );
        return (
          <label
            title={DL("Custom color")}
            style={{
              background: isCustom
                ? value
                : "conic-gradient(#f43f5e, #f59e0b, #facc15, #22c55e, #06b6d4, #6366f1, #d946ef, #f43f5e)",
            }}
            className={`relative w-6 h-6 rounded-full cursor-pointer border-2 overflow-hidden ${isCustom ? "border-[#DC2626] ring-2 ring-[#DC2626]/30" : "border-[#FBF6E8]"}`}
          >
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffee00"}
              onChange={(e) => onPick(e.target.value)}
              aria-label={DL("Custom color")}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        );
      })()}
    </div>
  );
  const renderDocToolsSection = () => {
    const toolsBusy =
      isProcessing ||
      images.length === 0 ||
      !cleanBaseSrc ||
      isSavingDocument ||
      isManualCropping ||
      isErasing;
    const smallBtn =
      "flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[13px] leading-tight font-semibold transition-all cursor-pointer bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] disabled:opacity-50 disabled:cursor-not-allowed";
    const docTool = (kind: DocToolKind, icon: React.ReactNode) => (
      <button
        key={kind}
        type="button"
        onClick={() => void applyDocTool(kind)}
        disabled={toolsBusy}
        className={smallBtn}
      >
        {icon}
        <span>{DL(STEP_LABELS[kind])}</span>
      </button>
    );
    const markupBusy =
      !isErasing &&
      (isProcessing ||
        images.length === 0 ||
        !cleanBaseSrc ||
        isSavingDocument ||
        isManualCropping);
    const markupBtn = (
      tool: BrushTool,
      label: string,
      icon: React.ReactNode,
      extra = "",
    ) => {
      const on = isErasing && brushTool === tool;
      return (
        <button
          key={tool}
          type="button"
          onClick={() => void handleToggleEraser(tool)}
          disabled={markupBusy}
          aria-pressed={on}
          className={`${extra} flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[13px] leading-tight font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${on ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
        >
          {icon}
          <span>{DL(label)}</span>
        </button>
      );
    };
    return (
      <div className="pt-3 border-t border-[#E3D6B8] space-y-3">
        <div className="text-[13px] font-bold text-[#3B2F1E]">
          {DL("Document tools")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {docTool("invert", <Contrast size={14} />)}
          {docTool("straighten", <RotateCw size={14} />)}
        </div>

        <div className="text-[13px] font-bold text-[#3B2F1E] pt-1">
          {DL("Markup & eraser")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {markupBtn("erase", "Eraser", <Eraser size={14} />)}
          {markupBtn("pen", "Pen", <Pen size={14} />)}
          {markupBtn("highlight", "Highlighter", <Highlighter size={14} />)}
          {markupBtn("redact", "Black marker", <Square size={14} fill="currentColor" />)}
          {markupBtn("stamp", "Remove stamp", <Wand2 size={14} />, "col-span-2")}
          {markupBtn("recolor", "Restore color", <Palette size={14} />, "col-span-2")}
          {markupBtn("seal", "Add seal", <Stamp size={14} />, "col-span-2")}
        </div>

        <div className="text-[13px] font-bold text-[#3B2F1E] pt-1">
          {DL("Lines & borders")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {markupBtn("dots", "Dotted line", <MoreHorizontal size={14} />)}
          {markupBtn("underline", "Underline", <Underline size={14} />)}
          {markupBtn("border", "Border", <Frame size={14} />, "col-span-2")}
          {markupBtn("write", "Handwriting", <PenLine size={14} />, "col-span-2")}
          {markupBtn(
            "punct",
            "Punctuation",
            <span className="text-[15px] font-bold leading-none">।,;</span>,
            "col-span-2",
          )}
        </div>
      </div>
    );
  };
  const renderToolOptionsPanel = () => {
    if (!isErasing) return null;
    return (
      <div className="scanner-tool-card scanner-options-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
          <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
          {DL("Tool options")}
        </div>
        <div className="rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] p-3 space-y-3">
          {!isLineTool && !isBorderTool && !isWriteTool && !isPunctTool && !isSealTool && (
            <div
              className={`grid gap-2 ${brushTool === "recolor" ? "grid-cols-3" : "grid-cols-2"}`}
            >
              {((brushTool === "recolor"
                ? ["free", "area", "lasso"]
                : isStampTool
                  ? ["area", "lasso"]
                  : ["free", "area"]) as ("free" | "area" | "lasso")[]).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setBrushShape(shape)}
                  aria-pressed={brushShape === shape}
                  className={`px-2 py-1.5 rounded-lg text-[13px] leading-tight font-semibold transition-all cursor-pointer ${brushShape === shape ? "bg-[#DC2626] text-white" : "bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
                >
                  {shape === "free"
                    ? brushTool === "recolor"
                      ? DL("Paint by hand")
                      : DL("Free hand")
                    : shape === "area"
                      ? DL("Select area")
                      : DL("Circle (drag out)")}
                </button>
              ))}
            </div>
          )}
          <p className="text-[13px] leading-snug text-[#6B5A40]">
            {isSealTool && sealCapture
              ? DL(
                  "Drag a box tightly around the seal on the page — it is copied and saved as a new seal design.",
                )
              : isSealTool
              ? DL(
                  "Pick a seal design, type the seal text, pick the ink colour, then drag a box where the seal should go — it is stamped there like real ink.",
                )
              : isPunctTool
              ? DL(
                  "Pick a mark (or type your own), then click where it should go — it is placed there. On touch, drag to fine-tune before you lift.",
                )
              : isWriteTool && textStyleCapture
              ? DL(
                  "Drag a box tightly around a word or line of the document text — its writing style is copied and saved.",
                )
              : isWriteTool && ocrMode
              ? DL(
                  "Drag a box over the text in the document — it is read and put in the text box below.",
                )
              : isWriteTool
              ? DL(
                  "Type your text, pick a hand style, then drag a box where it should go — it is written there like real handwriting.",
                )
              : isBorderTool
                ? DL(
                    "Pick a border style, then drag a box — the border is drawn around it as soon as you let go.",
                  )
                : isLineTool
                  ? DL(
                      "Drag from where the line should start to where it should end — dots or underline are drawn there.",
                    )
                  : isStampTool && brushShape === "lasso"
                    ? DL(
                        brushTool === "recolor"
                          ? "Press at one edge of the stamp and drag to the opposite edge — the circle is drawn between the two points. Let go and the stamp gets its colour back inside it."
                          : "Press at one edge of the stamp and drag to the opposite edge — the circle is drawn between the two points. Let go and the stamp inside it is removed.",
                      )
                    : isStampTool && brushShape === "area"
                      ? DL(
                          brushTool === "recolor"
                            ? "Drag a box over the stamp — it gets its colour back as soon as you let go."
                            : "Drag a box over the stamp — it is removed as soon as you let go.",
                        )
                      : brushTool === "recolor"
                        ? DL(
                            "Rub the brush over the seal — only the seal's ink under the brush changes colour (same result as box and circle). Writing stays black.",
                          )
                      : isStampTool
                        ? DL(
                            "Paint over the stamp with the brush — coloured stamp ink is removed, black writing stays.",
                          )
                  : brushShape === "area"
                    ? DL(
                        "Drag a box over the area — it is erased or marked as soon as you let go.",
                      )
                    : DL(
                        "Drag over writing or marks to erase them from the paper.",
                      )}
          </p>

          {isPunctTool && (
            <>
              <div>
                <div className="text-[13px] font-semibold text-[#5A4A32] mb-1">
                  {DL("Pick a mark")}
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {PUNCT_MARKS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-label={m}
                      aria-pressed={punctMark === m}
                      onClick={() => {
                        setPunctMark(m);
                        setPunctHint(false);
                      }}
                      style={{
                        fontFamily: handFontStack(handStyleOf(punctStyle)),
                        fontWeight: handStyleOf(punctStyle).weight,
                      }}
                      className={`rounded-lg py-1 text-[20px] leading-tight text-[#3B2F1E] cursor-pointer transition-all ${punctMark === m ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={punctMark}
                maxLength={8}
                onChange={(e) => {
                  setPunctMark(e.target.value);
                  if (e.target.value.trim()) setPunctHint(false);
                }}
                placeholder={DL("Or type your own mark…")}
                style={{
                  fontFamily: handFontStack(handStyleOf(punctStyle)),
                  fontWeight: handStyleOf(punctStyle).weight,
                  fontSize: 20,
                  color: punctColor,
                }}
                className={`w-full rounded-lg border bg-[#FBF6E8] px-2.5 py-1.5 select-text outline-none ${punctHint ? "border-[#DC2626] ring-2 ring-[#DC2626]/30" : "border-[#E3D6B8]"}`}
              />
              {punctHint && (
                <p className="text-[13px] font-semibold text-[#B91C1C]">
                  {DL("Pick a mark first.")}
                </p>
              )}
              <div>
                <div className="text-[13px] font-semibold text-[#5A4A32] mb-1">
                  {DL("Mark style")}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {HANDWRITING_STYLES.filter((hs) =>
                    PUNCT_STYLE_KEYS.includes(hs.key),
                  ).map((hs) => (
                    <button
                      key={hs.key}
                      type="button"
                      title={DL(hs.label)}
                      aria-label={DL(hs.label)}
                      aria-pressed={punctStyle === hs.key}
                      onClick={() => {
                        setPunctColor((c) =>
                          c.toLowerCase() ===
                          handStyleOf(punctStyle).color.toLowerCase()
                            ? hs.color
                            : c,
                        );
                        setPunctStyle(hs.key);
                      }}
                      className={`rounded-lg px-1 py-1.5 cursor-pointer transition-all text-center ${punctStyle === hs.key ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                    >
                      <span
                        style={{
                          fontFamily: handFontStack(hs),
                          fontWeight: hs.weight,
                          fontSize: 18,
                          lineHeight: 1.15,
                          color: "#3B2F1E",
                        }}
                        className="block truncate"
                      >
                        {"।,;"}
                      </span>
                      <span className="block text-[11px] leading-tight font-semibold text-[#6B5A40] truncate">
                        {DL(hs.label)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {renderSwatches(PEN_COLORS, punctColor, setPunctColor, "Mark color")}
              <div>
                <div className="flex justify-between font-semibold text-[#5A4A32] mb-1 text-sm">
                  <span>{DL("Mark size")}</span>
                  <span>{punctSize}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={punctSize}
                  onChange={(e) => setPunctSize(Number(e.target.value))}
                  className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                />
              </div>
            </>
          )}

          {isWriteTool && (
            <>
              <button
                type="button"
                disabled={isOcrRunning}
                onClick={() => {
                  setOcrNote("");
                  setTextStyleCapture(false);
                  setOcrMode((v) => !v);
                }}
                aria-pressed={ocrMode}
                className={`w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[13px] leading-tight font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${ocrMode ? "bg-[#DC2626] text-white" : "bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
              >
                <Frame size={14} />
                <span>
                  {ocrMode
                    ? DL("Cancel reading")
                    : DL("Read text from the document")}
                </span>
              </button>
              {isOcrRunning && (
                <p className="text-[13px] font-semibold text-[#5A4A32]">
                  {DL("Reading text…")} {ocrProgress > 0 ? `${ocrProgress}%` : ""}
                </p>
              )}
              {ocrNote && !isOcrRunning && (
                <p className="text-[13px] font-semibold text-[#B91C1C]">
                  {DL(ocrNote)}
                </p>
              )}
              <button
                type="button"
                disabled={isStyleBusy || isOcrRunning}
                onClick={() => {
                  setStyleNote("");
                  setOcrMode(false);
                  setTextStyleCapture((v) => !v);
                }}
                aria-pressed={textStyleCapture}
                className={`w-full px-2 py-2 rounded-xl text-[13px] leading-tight font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${textStyleCapture ? "bg-[#DC2626] text-white" : "bg-[#FBF6E8] border border-[#DC2626] text-[#DC2626] hover:bg-[#EFE3C8]"}`}
              >
                {isStyleBusy
                  ? DL("Copying writing style…")
                  : textStyleCapture
                    ? DL("Now drag a box around the text… (click to cancel)")
                    : DL("Take writing style from the page")}
              </button>
              {isStyleBusy && ocrProgress > 0 && ocrProgress < 100 && (
                <p className="text-[13px] font-semibold text-[#5A4A32]">
                  {DL("Reading text…")} {ocrProgress}%
                </p>
              )}
              {styleNote && !isStyleBusy && (
                <p className="text-[13px] font-semibold text-[#5A4A32]">{styleNote}</p>
              )}
              <textarea
                onPaste={(e) => {
                  // A pasted screenshot is read like a picked area.
                  const item = Array.from<DataTransferItem>(e.clipboardData?.items || []).find(
                    (it) => it.type.startsWith("image/"),
                  );
                  const file = item?.getAsFile();
                  if (!file || isOcrRunning) return;
                  e.preventDefault();
                  void (async () => {
                    try {
                      const bmp = await createImageBitmap(file);
                      const scale = Math.min(4, Math.max(1, 100 / bmp.height));
                      const c = makeCanvas(
                        bmp.width * scale + 24,
                        bmp.height * scale + 24,
                      );
                      const cx = c.getContext("2d");
                      if (!cx) return;
                      cx.fillStyle = "#ffffff";
                      cx.fillRect(0, 0, c.width, c.height);
                      cx.imageSmoothingQuality = "high";
                      cx.filter = "grayscale(1) contrast(1.15)";
                      cx.drawImage(bmp, 12, 12, bmp.width * scale, bmp.height * scale);
                      await runOcr(c);
                    } catch (error) {
                      console.error("Pasted image failed:", error);
                      setOcrNote("Could not read the text. Check your internet and try again.");
                    }
                  })();
                }}
                value={writeText}
                onChange={(e) => {
                  setWriteText(e.target.value);
                  if (e.target.value.trim()) setWriteHint(false);
                }}
                rows={3}
                maxLength={400}
                placeholder={DL("Type your text here (Bangla or English)…")}
                style={{
                  fontFamily: handFontStack(handStyleOf(writeStyle)),
                  fontWeight: handStyleOf(writeStyle).weight,
                  fontSize: 22,
                  lineHeight: 1.25,
                  color: writeColor,
                }}
                className={`w-full rounded-lg border bg-[#FBF6E8] px-2.5 py-1.5 resize-none select-text outline-none ${writeHint ? "border-[#DC2626] ring-2 ring-[#DC2626]/30" : "border-[#E3D6B8]"}`}
              />
              {writeHint && (
                <p className="text-[13px] font-semibold text-[#B91C1C]">
                  {DL("Type some text first, then drag a box.")}
                </p>
              )}
              <div>
                <div className="text-[13px] font-semibold text-[#5A4A32] mb-1">
                  {DL("Handwriting style")}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {HANDWRITING_STYLES.filter((hs) => !hs.key.startsWith("print")).map((hs) => (
                    <button
                      key={hs.key}
                      type="button"
                      title={DL(hs.label)}
                      aria-label={DL(hs.label)}
                      aria-pressed={writeStyle === hs.key}
                      onClick={() => {
                        // Switch the ink colour too, unless the person picked
                        // their own colour.
                        setWriteColor((c) =>
                          c.toLowerCase() ===
                          handStyleOf(writeStyle).color.toLowerCase()
                            ? hs.color
                            : c,
                        );
                        setWriteStyle(hs.key);
                      }}
                      className={`rounded-lg px-1 py-1.5 cursor-pointer transition-all text-center ${writeStyle === hs.key ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                    >
                      <span
                        style={{
                          fontFamily: handFontStack(hs),
                          fontWeight: hs.weight,
                          fontSize: 18,
                          lineHeight: 1.15,
                          color: "#3B2F1E",
                        }}
                        className="block truncate"
                      >
                        {"অআ Ab"}
                      </span>
                      <span className="block text-[11px] leading-tight font-semibold text-[#6B5A40] truncate">
                        {DL(hs.label)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#5A4A32] mb-1">
                  {DL("Document style (printed)")}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {customTextList.map((cs) => (
                    <div key={cs.key} className="relative">
                      <button
                        type="button"
                        title={DL("Copied style")}
                        aria-label={DL("Copied style")}
                        aria-pressed={writeStyle === cs.key}
                        onClick={() => {
                          setWriteColor(cs.color);
                          setWriteStyle(cs.key);
                        }}
                        className={`w-full rounded-lg px-1 py-1.5 cursor-pointer transition-all text-center ${writeStyle === cs.key ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                      >
                        {cs.thumb ? (
                          <img
                            src={cs.thumb}
                            alt=""
                            className="block mx-auto h-[26px] max-w-full object-contain"
                          />
                        ) : (
                          <span className="block text-[18px] leading-[1.15]">{"অআ Ab"}</span>
                        )}
                        <span className="block text-[11px] leading-tight font-semibold text-[#6B5A40] truncate">
                          {DL("Copied style")}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={DL("Remove")}
                        onClick={() => {
                          if (writeStyle === cs.key) setWriteStyle("printSans");
                          saveCustomTextStyles(customTextList.filter((x) => x.key !== cs.key));
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#DC2626] text-white flex items-center justify-center cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {HANDWRITING_STYLES.filter((hs) => hs.key.startsWith("print")).map((hs) => (
                    <button
                      key={hs.key}
                      type="button"
                      title={DL(hs.label)}
                      aria-label={DL(hs.label)}
                      aria-pressed={writeStyle === hs.key}
                      onClick={() => {
                        // Switch the ink colour too, unless the person picked
                        // their own colour.
                        setWriteColor((c) =>
                          c.toLowerCase() ===
                          handStyleOf(writeStyle).color.toLowerCase()
                            ? hs.color
                            : c,
                        );
                        setWriteStyle(hs.key);
                      }}
                      className={`rounded-lg px-1 py-1.5 cursor-pointer transition-all text-center ${writeStyle === hs.key ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                    >
                      <span
                        style={{
                          fontFamily: handFontStack(hs),
                          fontWeight: hs.weight,
                          fontSize: 18,
                          lineHeight: 1.15,
                          color: "#3B2F1E",
                        }}
                        className="block truncate"
                      >
                        {"অআ Ab"}
                      </span>
                      <span className="block text-[11px] leading-tight font-semibold text-[#6B5A40] truncate">
                        {DL(hs.label)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {renderSwatches(
                WRITE_COLORS,
                writeColor,
                setWriteColor,
                "Text color",
              )}
              <div>
                <div className="flex justify-between font-semibold text-[#5A4A32] mb-1 text-sm">
                  <span>{DL("Text size")}</span>
                  <span>{writeSize}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={writeSize}
                  onChange={(e) => setWriteSize(Number(e.target.value))}
                  className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                />
              </div>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A4A32] cursor-pointer">
                <input
                  type="checkbox"
                  checked={writeClearFirst}
                  onChange={(e) => setWriteClearFirst(e.target.checked)}
                  className="accent-[#DC2626] w-4 h-4 cursor-pointer"
                />
                <span>{DL("Erase the old writing in the box first")}</span>
              </label>
              <p className="text-[12px] leading-snug text-[#6B5A40]">
                {DL(
                  "Tip: you can also paste a screenshot (Ctrl + V) into the text box. The first time it downloads Bangla reading data.",
                )}
              </p>
            </>
          )}

          {brushTool === "pen" &&
            renderSwatches(PEN_COLORS, penColor, setPenColor, "Pen color")}
          {isBorderTool && (
            <div className="grid grid-cols-5 gap-1.5">
              {BORDER_STYLES.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  title={DL(b.label)}
                  aria-label={DL(b.label)}
                  aria-pressed={borderStyle === b.key}
                  onClick={() => setBorderStyle(b.key)}
                  className={`rounded-lg p-1 cursor-pointer transition-all ${borderStyle === b.key ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                >
                  <BorderPreview style={b.key} />
                </button>
              ))}
            </div>
          )}
          {(isLineTool || isBorderTool) &&
            renderSwatches(PEN_COLORS, penColor, setPenColor, "Line color")}
          {brushTool === "highlight" &&
            renderSwatches(
              HIGHLIGHT_COLORS,
              highlightColor,
              setHighlightColor,
              "Highlighter color",
            )}
          {!isWriteTool &&
            !isPunctTool &&
            !isSealTool &&
            (brushShape === "free" ||
              brushTool === "pen" ||
              isLineTool ||
              isBorderTool) && (
              <div>
                <div className="flex justify-between font-semibold text-[#5A4A32] mb-1 text-sm">
                  <span>
                    {isBorderTool
                      ? DL("Border thickness")
                      : brushTool === "recolor"
                        ? DL("Brush size")
                        : isLineTool
                        ? DL("Dot / line size")
                        : DL("Eraser size")}
                  </span>
                  <span>{eraserSize}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={eraserSize}
                  onChange={(e) => setEraserSize(Number(e.target.value))}
                  className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                />
              </div>
            )}
          {brushTool === "recolor" && (
            <div className="space-y-2">
              <div className="text-[13px] font-semibold text-[#5A4A32]">
                {DL("Seal colour")}
              </div>
              <button
                type="button"
                onClick={() => setStampTint(null)}
                aria-pressed={stampTint === null}
                className={`w-full px-2 py-1.5 rounded-lg text-[13px] leading-tight font-semibold cursor-pointer transition-all ${stampTint === null ? "bg-[#DC2626] text-white" : "bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
              >
                {DL("Keep original colour")}
              </button>
              {renderSwatches(
                SEAL_COLORS,
                stampTint ?? "",
                (c) => setStampTint(c),
                "Choose a new colour",
              )}
              <p className="text-[12px] leading-snug text-[#6B5A40]">
                {DL(
                  "Pick a colour, then drag a box over the seal — its ink changes to that colour. Works on the original coloured page and on a cleaned page.",
                )}
              </p>
            </div>
          )}
          {isSealTool && (
            <>
              <button
                type="button"
                onClick={() => setSealCapture((v) => !v)}
                aria-pressed={sealCapture}
                className={`w-full px-2 py-2 rounded-lg text-[13px] leading-tight font-semibold cursor-pointer transition-all ${sealCapture ? "bg-[#DC2626] text-white" : "bg-[#FBF6E8] border border-[#DC2626] text-[#DC2626] hover:bg-[#FFF3C4]"}`}
              >
                {sealCapture
                  ? DL("Now drag a box around the seal… (click to cancel)")
                  : DL("Take seal from the page")}
              </button>
              <div>
                <div className="text-[13px] font-semibold text-[#5A4A32] mb-1">
                  {DL("Seal design")}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {customSeals.map((cs) => (
                    <div key={cs.id} className="relative">
                      <button
                        type="button"
                        aria-pressed={sealStyle === `custom:${cs.id}`}
                        onClick={() => setSealStyle(`custom:${cs.id}`)}
                        className={`w-full rounded-lg p-1 cursor-pointer transition-all ${sealStyle === `custom:${cs.id}` ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                      >
                        <SealPreview style={`custom:${cs.id}`} color={sealColor} />
                      </button>
                      <button
                        type="button"
                        aria-label={DL("Remove")}
                        onClick={() => {
                          customSealCanvases.delete(cs.id);
                          if (sealStyle === `custom:${cs.id}`) setSealStyle("round2");
                          saveCustomSeals(customSeals.filter((x) => x.id !== cs.id));
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#DC2626] text-white flex items-center justify-center cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {SEAL_STYLES.map((sd) => (
                    <button
                      key={sd.key}
                      type="button"
                      title={DL(sd.label)}
                      aria-label={DL(sd.label)}
                      aria-pressed={sealStyle === sd.key}
                      onClick={() => setSealStyle(sd.key)}
                      className={`rounded-lg p-1 cursor-pointer transition-all ${sealStyle === sd.key ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                    >
                      <SealPreview style={sd.key} color={sealColor} />
                    </button>
                  ))}
                </div>
              </div>
              {!isCustomSeal && (() => {
                const isRectSeal =
                  SEAL_STYLES.find((x) => x.key === sealStyle)?.shape === "rect";
                const fieldCls =
                  "w-full rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 py-1.5 text-[14px] text-[#3B2F1E] outline-none focus:border-[#DC2626]";
                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {SEAL_QUICK_TEXTS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setSealCenter(q)}
                          className="px-2 py-0.5 rounded-full text-[12px] bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <label className="block">
                      <span className="text-[13px] font-semibold text-[#5A4A32]">
                        {isRectSeal ? DL("Top line") : DL("Top curved text")}
                      </span>
                      <input
                        type="text"
                        value={sealTop}
                        onChange={(e) => setSealTop(e.target.value)}
                        className={fieldCls}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-semibold text-[#5A4A32]">
                        {DL("Middle text (new line = next line)")}
                      </span>
                      <textarea
                        rows={3}
                        value={sealCenter}
                        onChange={(e) => setSealCenter(e.target.value)}
                        className={fieldCls}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-semibold text-[#5A4A32]">
                        {isRectSeal ? DL("Bottom line") : DL("Bottom curved text")}
                      </span>
                      <input
                        type="text"
                        value={sealBottom}
                        onChange={(e) => setSealBottom(e.target.value)}
                        className={fieldCls}
                      />
                    </label>
                  </div>
                );
              })()}
              {isCustomSeal && (
                <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A4A32] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sealOwnColor}
                    onChange={(e) => setSealOwnColor(e.target.checked)}
                    className="accent-[#DC2626] w-4 h-4 cursor-pointer"
                  />
                  <span>{DL("Keep the seal's own colour (exactly as copied)")}</span>
                </label>
              )}
              {!isCustomSeal && (
              <div>
                <div className="text-[13px] font-semibold text-[#5A4A32] mb-1">
                  {DL("Seal font")}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {SEAL_FONTS.map((fk) => (
                    <button
                      key={fk}
                      type="button"
                      aria-pressed={sealFont === fk}
                      onClick={() => setSealFont(fk)}
                      style={{
                        fontFamily: handFontStack(handStyleOf(fk)),
                        fontWeight: handStyleOf(fk).weight,
                      }}
                      className={`rounded-lg px-1 py-1.5 text-[15px] leading-tight text-[#3B2F1E] cursor-pointer transition-all ${sealFont === fk ? "bg-[#FFF3C4] border-2 border-[#DC2626]" : "bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#EFE3C8]"}`}
                    >
                      সিল
                    </button>
                  ))}
                </div>
              </div>
              )}
              {(!isCustomSeal || !sealOwnColor) &&
                renderSwatches(SEAL_COLORS, sealColor, setSealColor, "Seal colour")}
              {[
                { label: "Turn", v: sealRot, set: setSealRot, min: -180, max: 180 },
                { label: "Ink strength", v: sealInk, set: setSealInk, min: 30, max: 100 },
                { label: "Old / worn look", v: sealWear, set: setSealWear, min: 0, max: 100 },
              ].map((sl) => (
                <div key={sl.label}>
                  <div className="flex justify-between font-semibold text-[#5A4A32] mb-1 text-sm">
                    <span>{DL(sl.label)}</span>
                    <span>{sl.v}</span>
                  </div>
                  <input
                    type="range"
                    min={sl.min}
                    max={sl.max}
                    value={sl.v}
                    onChange={(e) => sl.set(Number(e.target.value))}
                    className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                  />
                </div>
              ))}
              {isWriting && (
                <p className="text-[12px] text-[#6B5A40]">{DL("Loading font…")}</p>
              )}
            </>
          )}
          {isStampTool && (
            <div>
              <div className="flex justify-between font-semibold text-[#5A4A32] mb-1 text-sm">
                <span>
                  {brushTool === "recolor"
                    ? DL("Colour restore strength")
                    : DL("Stamp removal strength")}
                </span>
                <span>{stampStrength}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={stampStrength}
                onChange={(e) => setStampStrength(Number(e.target.value))}
                className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
              />
              <p className="text-[12px] leading-snug text-[#6B5A40] mt-1">
                {DL(
                  "Faint stamp still visible? Raise the strength and try again. Works on coloured stamps (blue, red, purple).",
                )}
              </p>
            </div>
          )}
          {(isLineTool || isBorderTool || isPunctTool) && (
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A4A32] cursor-pointer">
              <input
                type="checkbox"
                checked={writeClearFirst}
                onChange={(e) => setWriteClearFirst(e.target.checked)}
                className="accent-[#DC2626] w-4 h-4 cursor-pointer"
              />
              <span>{DL("Erase the old writing in the box first")}</span>
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handleEraseUndoStroke()}
              disabled={eraseStrokeCount === 0}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold border border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#EFE3C8] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={12} />
              {DL("Undo last stroke")}
            </button>
            <button
              type="button"
              onClick={() => void handleToggleEraser(brushTool)}
              disabled={isWriting}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              {DL("Done editing")}
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderMagicCleanRow = () => {
    const passes = effects.enhance;
    const active = passes > 0;
    const atMax = passes >= MAX_ENHANCE_PASSES;
    const canRemove = findEffectUndoIndex("enhance") >= 0;
    const busy =
      isProcessing ||
      images.length === 0 ||
      !cleanBaseSrc ||
      isSavingDocument ||
      isManualCropping ||
      isErasing;
    return (
      <div className="space-y-2">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => {
              if (!active) handleApplyEffect("enhance");
            }}
            disabled={busy}
            aria-pressed={active}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
          >
            {active ? <Check size={14} /> : <Sparkles size={14} />}
            {DL(ENHANCE_LABEL)}
            {passes > 1 && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#FBF6E8]/25 text-[12px] font-bold">
                <DocumentText>{"\u00D7"}</DocumentText>
                {passes}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              active
                ? handleUndoEffect("enhance")
                : handleApplyEffect("enhance")
            }
            disabled={busy || (active && !canRemove)}
            title={
              active
                ? canRemove
                  ? DL("Remove the last Fix Blur step.")
                  : DL(
                      "This cannot be removed separately after cropping or erasing — press Undo.",
                    )
                : DL(`Add ${ENHANCE_LABEL}`)
            }
            aria-label={
              active
                ? DL(`Remove ${ENHANCE_LABEL}`)
                : DL(`Add ${ENHANCE_LABEL}`)
            }
            className={`w-9 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-[#FBF6E8] border-[#FBB6B6] text-[#B91C1C] hover:bg-[#FEE9E9]" : "bg-[#FBF6E8] border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
          >
            {active ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </div>

        {active && (
          <button
            type="button"
            onClick={() => handleApplyEffect("enhance")}
            disabled={busy || atMax}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer bg-[#D42020] border border-[#DC2626] text-white hover:bg-[#AE1717] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw size={14} />
            {atMax ? (
              <DocumentText>{`${ENHANCE_LABEL} has reached the maximum.`}</DocumentText>
            ) : (
              <DocumentText>{`${ENHANCE_LABEL} Again`}</DocumentText>
            )}
          </button>
        )}
      </div>
    );
  };
  // ---- Fit the preview frame to the document's own aspect ratio -----------
  // The frame used to be a fixed A4 sheet, so any photo that wasn't exactly A4
  // showed up small with white bars. Now the frame takes the exact shape of
  // the image and grows as large as the preview area allows.
  // ---- Ctrl+Z / Cmd+Z ---------------------------------------------------------
  // While drawing: undo the last stroke. Otherwise: undo the last editor step.
  const undoShortcutRef = useRef<() => boolean>(() => false);
  undoShortcutRef.current = () => {
    if (isErasing) {
      if (eraseStrokesRef.current.length > 0 && !eraseCurrentRef.current) {
        void handleEraseUndoStroke();
      }
      return true;
    }
    if (history.length > 0 && canChangeImage()) {
      handleUndoLast();
      return true;
    }
    return false;
  };
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== "z") return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      const typing =
        tag === "TEXTAREA" ||
        el?.isContentEditable ||
        (tag === "INPUT" && (el as HTMLInputElement).type !== "range");
      if (typing) return;
      if (undoShortcutRef.current()) e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  // ---- eraser: paint the preview canvas when the tool starts ---------------
  useEffect(() => {
    if (!isErasing) return;
    const start = eraseStartRef.current;
    if (!start) return;
    let cancelled = false;
    eraseReadyRef.current = false;
    loadImage(start.display)
      .then((img) => {
        const canvas = eraseCanvasRef.current;
        if (cancelled || !canvas) return;
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        eraseReadyRef.current = true;
      })
      .catch((error) => console.error("Eraser preview failed:", error));
    return () => {
      cancelled = true;
      eraseReadyRef.current = false;
    };
  }, [isErasing, loadImage]);
  // Switching / replacing / removing the page ends the eraser without saving.
  useEffect(() => {
    setIsErasing(false);
    if (eraseCommitTimerRef.current) {
      clearTimeout(eraseCommitTimerRef.current);
      eraseCommitTimerRef.current = null;
    }
    eraseStrokesRef.current = [];
    eraseCurrentRef.current = null;
    eraseBaseCanvasRef.current = null;
    eraseStartRef.current = null;
    eraseReadyRef.current = false;
    setEraseStrokeCount(0);
    setEraserCursor(null);
  }, [selectedImageSrc]);
  useEffect(
    () => () => {
      if (eraseCommitTimerRef.current) clearTimeout(eraseCommitTimerRef.current);
    },
    [],
  );

  // Live preview: while the box is being dragged (handwriting) or the pointer
  // moves (punctuation), draw with the very same engine (and seed) that paints
  // it for real, so what is seen is what lands.
  useEffect(() => {
    const ghost = ghostCanvasRef.current;
    const base = eraseCanvasRef.current;
    if (!ghost) return;
    const ctx = ghost.getContext("2d");
    if (!ctx) return;
    if (!base || (!isWriteTool && !isPunctTool)) {
      ctx.clearRect(0, 0, ghost.width, ghost.height);
      return;
    }
    if (ghost.width !== base.width || ghost.height !== base.height) {
      ghost.width = base.width;
      ghost.height = base.height;
    }
    ctx.clearRect(0, 0, ghost.width, ghost.height);
    if (isPunctTool) {
      if (!punctPos || !punctMark.trim()) return;
      drawPunctuation(ctx, {
        pts: [punctPos],
        r: 0,
        tool: "punct",
        color: punctColor,
        style: punctStyle,
        text: punctMark.trim(),
        sizeMul: punctSize / 100,
        seed: punctSeedRef.current,
      });
      return;
    }
    if (!areaRect || !writeText.trim() || ocrMode) return;
    drawHandwriting(ctx, areaRect, {
      pts: [],
      r: 0,
      tool: "write",
      color: writeColor,
      rect: areaRect,
      style: writeStyle,
      text: writeText.trim(),
      sizeMul: writeSize / 100,
      seed: writeSeedRef.current,
    });
  }, [
    areaRect,
    isWriteTool,
    isPunctTool,
    writeText,
    writeStyle,
    writeColor,
    writeSize,
    punctPos,
    punctMark,
    punctStyle,
    punctColor,
    punctSize,
    ocrMode,
  ]);

    // Start downloading the default hand font as soon as the page opens.
  useEffect(() => {
    void ensureHandwritingFont(HANDWRITING_STYLES[0]);
  }, []);

    // Download the handwriting font as soon as the Handwriting tool / a new hand
  // style is picked, so the first box the person drags is written right away.
  useEffect(() => {
    if (!isErasing || (brushTool !== "write" && brushTool !== "punct")) return;
    void ensureHandwritingFont(
      handStyleOf(brushTool === "punct" ? punctStyle : writeStyle),
    );
  }, [isErasing, brushTool, writeStyle, punctStyle]);

  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [previewBox, setPreviewBox] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [previewAspect, setPreviewAspect] = useState<number>(1 / 1.414);

  useEffect(() => {
    const el = previewBoxRef.current;
    if (!el) return;
    const measure = () => {
      const cs = window.getComputedStyle(el);
      const padX =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const padY =
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      setPreviewBox({
        w: Math.max(0, el.clientWidth - padX),
        h: Math.max(0, el.clientHeight - padY),
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [images.length]);

  const previewDisplaySrc = isHoldingOriginal
    ? rotatedOriginalSrc ||
      croppedOriginalSrc ||
      uncroppedSrc ||
      images[selectedIndex]
    : isManualCropping
      ? uncroppedSrc || images[selectedIndex]
      : processedImageSrc || images[selectedIndex];

  useEffect(() => {
    if (!previewDisplaySrc) return;
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (cancelled) return;
      if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
        setPreviewAspect(probe.naturalWidth / probe.naturalHeight);
      }
    };
    probe.src = previewDisplaySrc;
    return () => {
      cancelled = true;
    };
  }, [previewDisplaySrc]);

  const previewFrameSize = (() => {
    const { w, h } = previewBox;
    if (!w || !h || !previewAspect) return null;
    const width = Math.min(w, h * previewAspect);
    return { width: Math.floor(width), height: Math.floor(width / previewAspect) };
  })();

  return (
    <div
      style={{ "--scanner-scale": pageScale } as React.CSSProperties}
      className="page-font scanner-page relative isolate w-full min-h-screen bg-transparent text-[#3B2F1E] font-sans p-3 sm:p-4 lg:p-6 select-none flex flex-col justify-between"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        /* Handwriting tool: Latin + Bangla hand fonts (see HANDWRITING_STYLES). */
        @import url('https://fonts.googleapis.com/css2?family=Atma:wght@400;500;600;700&family=Galada&family=Baloo+Da+2:wght@500;600;700&family=Caveat:wght@500;600;700&family=Patrick+Hand&family=Reenie+Beanie&family=Dancing+Script:wght@500;600&family=Homemade+Apple&family=Gloria+Hallelujah&family=Nanum+Pen+Script&family=Noto+Serif:wght@400;500&family=Noto+Serif+Bengali:wght@400;500;600;700&family=Tiro+Bangla&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&family=Noto+Sans+Bengali:wght@400;500;700&family=Anek+Bangla:wght@400;500;600;700&family=Mina:wght@400;700&family=Tinos:wght@400;700&family=Arimo:wght@400;500;700&family=Libre+Baskerville:wght@400;700&family=Roboto+Slab:wght@400;600;700&family=Playfair+Display:wght@700&family=Special+Elite&family=Courier+Prime:wght@400;700&family=Hind+Siliguri:wght@300&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400&family=Indie+Flower&family=Shadows+Into+Light&family=Handlee&family=Architects+Daughter&family=Permanent+Marker&family=Rock+Salt&family=Satisfy&family=Sacramento&family=Kristi&family=Zeyada&family=Covered+By+Your+Grace&family=Gochi+Hand&family=Just+Another+Hand&family=Walter+Turncoat&family=Schoolbell&display=swap');

        /* Keep the warm sand page background visible across the entire viewport,
           including gutters outside the app-shell's centered content column. */
        html:has(.page-font),
        body:has(.page-font) {
          min-height: 100%;
          background-color: #EFE5CE !important;
          background-image: linear-gradient(to bottom, #E9DDC3, #EFE5CE) !important;
          background-attachment: fixed;
        }

        /* Some app shells paint a cool-gray background behind page content.
           Make only the ancestors of this page transparent so the sand canvas
           shows through; individual cards and the navbar keep their own surfaces. */
        body:has(.page-font) > div,
        body:has(.page-font) :is(main, section, article, div):has(.page-font) {
          background: transparent !important;
        }

        .page-font.page-font,
        .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali",
            ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          line-height: 1.45;
        }

        .page-font h1,
        .page-font h2,
        .page-font h3,
        .page-font h4 {
          letter-spacing: -0.01em;
        }

        .page-font p {
          line-height: 1.7;
        }

        .page-font button {
          font-size: max(15px, 1em);
          transition:
            color 180ms ease,
            background-color 180ms ease,
            border-color 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .page-font button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .page-font button:not(:disabled):active,
        .page-font [role="button"]:active {
          transform: scale(0.98);
        }

        .page-font button:hover:not(:disabled) {
          border-color: #FBB6B6;
        }

        .page-font button:not([class*="bg-[#DC2626]"]):not([class*="bg-[#D42020]"]):not([class*="bg-emerald"]):hover:not(:disabled) {
          color: #B91C1C;
        }

        .page-font .group {
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .page-font .group:hover {
          transform: translateY(-2px);
          box-shadow: 0 1px 4px rgba(59, 47, 30, 0.12);
        }

        .page-font div[class*="cursor-pointer"]:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 4px rgba(59, 47, 30, 0.12);
        }

        .page-font button[class*="bg-[#DC2626]"]:hover:not(:disabled) {
          background-color: #B91C1C;
        }

        .page-font button[class*="bg-[#DC2626]"]:active:not(:disabled) {
          background-color: #991B1B;
        }

        .page-font button[class*="bg-[#FBF6E8]"],
        .page-font button[class*="bg-[#F6EEDB]"],
        .page-font button[class*="bg-[#F3E9D2]"] {
          color: #B91C1C;
          border-color: #FBB6B6;
        }

        .page-font button[class*="bg-[#FBF6E8]"]:hover:not(:disabled),
        .page-font button[class*="bg-[#F6EEDB]"]:hover:not(:disabled),
        .page-font button[class*="bg-[#F3E9D2]"]:hover:not(:disabled) {
          background-color: #FEE9E9;
        }

        .page-font button[aria-pressed="true"] {
          background-color: #F6D9A8;
          color: #B91C1C;
          border-color: #DC2626;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.4);
        }

        .page-font div[class*="ring-[#DC2626]/40"]::after {
          content: "✓";
          position: absolute;
          top: 3px;
          right: 3px;
          z-index: 31;
          display: flex;
          width: 16px;
          height: 16px;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: #DC2626;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          pointer-events: none;
        }

        .page-font div[class*="ring-[#DC2626]/40"] > button {
          top: auto;
          right: 3px;
          bottom: 3px;
        }

        .page-font :is(a, button, label, [role="button"], input, select, textarea):focus-visible {
          outline: 2px solid #DC2626;
          outline-offset: 2px;
        }

        .page-font a {
          color: #B91C1C;
          transition: color 180ms ease;
        }

        .page-font a:hover {
          color: #991B1B;
        }

        .page-font input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]),
        .page-font select,
        .page-font textarea {
          background-color: #FBF6E8;
          border-color: #E3D6B8;
          color: #3B2F1E;
          font-size: max(15px, 1em);
        }

        .page-font input::placeholder,
        .page-font textarea::placeholder {
          color: #B0A080;
        }

        .page-font .scroll {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }

        .page-font .scroll::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .page-font .scroll::-webkit-scrollbar-track {
          background: rgba(216, 201, 166, 0.32);
          border-radius: 999px;
          margin: 10px 0;
        }

        .page-font .scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #F87171, #DC2626);
          border-radius: 999px;
          border: 3px solid #F2E8D2;
          min-height: 48px;
        }

        .page-font .scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #EF4444, #B91C1C);
        }

        /* Desktop fit mode: keep the scanner, all editing controls, saved area,
           and helper note visible inside one viewport without page scrolling. */
        .scanner-hang-note {
          transform-origin: 50% 0;
          animation: scannerNoteSwing 5s ease-in-out infinite;
        }
        @keyframes scannerNoteSwing {
          0%, 100% { transform: rotate(-1.4deg); }
          50% { transform: rotate(1.4deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scanner-hang-note { animation: none; }
        }
        .scanner-note-nail,
        .scanner-note-strings {
          display: none;
        }
        /* On small screens the two tool columns dissolve into the normal grid. */
        .scanner-tools-col {
          display: contents;
        }
        @media (min-width: 1280px) and (min-height: 720px) {
          html:has(.scanner-page),
          body:has(.scanner-page) {
            height: 100%;
            overflow: hidden;
          }

          .scanner-page {
            box-sizing: border-box;
            /* Laid out at (viewport / scale) and scaled down as one piece. */
            width: calc(100vw / var(--scanner-scale, 1)) !important;
            max-width: none !important;
            /* The fixed site navbar is 60px tall; use the remaining viewport. */
            height: calc((100dvh - 60px) / var(--scanner-scale, 1));
            max-height: calc((100dvh - 60px) / var(--scanner-scale, 1));
            transform: scale(var(--scanner-scale, 1));
            transform-origin: 0 0;
            margin-bottom: calc((100dvh - 60px) * (1 - 1 / var(--scanner-scale, 1)));
            min-height: 0 !important;
            margin-left: calc(50% - 50vw);
            padding: 8px 16px !important;
            gap: 8px !important;
            justify-content: flex-start !important;
            overflow: hidden;
          }

          /* Content sits to the left; the warning note hangs on the right. */
          .scanner-main-content {
            width: calc(100% - 262px);
            max-width: none;
            min-width: 0;
            min-height: 0;
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 0;
          }

          .scanner-note-wrap {
            position: fixed !important;
            top: 74px;
            right: 14px;
            width: 236px;
            margin-top: 0 !important;
            z-index: 20;
          }
          .scanner-note-nail,
          .scanner-note-strings {
            display: block !important;
          }

          .scanner-page-header {
            flex: 0 0 auto;
            min-height: 48px;
            margin-bottom: 0 !important;
            gap: 8px !important;
          }

          .scanner-workspace {
            flex: 1 1 auto;
            min-height: 0 !important;
            align-items: stretch !important;
            gap: 10px !important;
          }

          .scanner-workspace-panel {
            min-width: 0;
            min-height: 0 !important;
            height: 100%;
            padding: 10px !important;
            justify-content: space-between;
          }

          .scanner-workspace-inner {
            min-height: 0;
            gap: 10px !important;
          }

          .scanner-preview-column {
            min-height: 0;
          }

          .scanner-preview-canvas {
            min-height: 0 !important;
            height: auto;
            padding: 4px !important;
          }

          .scanner-paper-frame {
            flex: 0 0 auto;
          }

          .scanner-tools-sidebar {
            width: 580px !important;
            min-width: 0;
            min-height: 0;
            max-height: 100%;
            overflow-y: auto;
            scrollbar-width: thin;
            flex: 0 0 580px;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            align-content: start;
            align-items: start;
            gap: 8px !important;
          }

          /* Two independent columns (left: crop + markup tools, right: enhance
             / tool options + mode + adjustments). Before, all cards shared grid
             rows, so the tall left card pushed the right cards far down. */
          .scanner-tools-col {
            display: flex !important;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
            min-height: 0;
          }

          .scanner-options-card {
            max-height: calc((100dvh - 60px) / var(--scanner-scale, 1) - 370px);
            overflow-y: auto;
            scrollbar-width: thin;
          }

          .scanner-tool-card {
            min-width: 0;
            padding: 9px !important;
            gap: 7px !important;
            border-radius: 14px !important;
          }

          .scanner-tool-card .space-y-2 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 5px !important;
          }

          .scanner-tool-card .space-y-3 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 6px !important;
          }

          .scanner-tool-card button {
            padding-top: 5px !important;
            padding-bottom: 5px !important;
            line-height: 1.25 !important;
            font-size: 13.5px;
            text-wrap: balance;
          }

          .scanner-adjustments-card {
            grid-column: auto !important;
          }

          .scanner-adjustments-card > .space-y-3 {
            gap: 6px !important;
          }

          .scanner-saved-section {
            width: calc(100% - 262px);
            max-width: none;
            box-sizing: border-box;
            /* Keep the title and the full empty-state / saved-document row visible. */
            flex: 0 0 138px;
            height: 138px;
            max-height: 138px;
            min-height: 0;
            overflow: hidden;
            margin: 0 !important;
            padding: 7px 10px !important;
          }

          .scanner-saved-section > div:first-child {
            margin-bottom: 4px !important;
            gap: 8px !important;
          }

          .scanner-saved-section h2 {
            font-size: 14px !important;
            line-height: 1.2 !important;
          }

          .scanner-saved-section > div:first-child p {
            font-size: 12px !important;
            line-height: 1.2 !important;
            margin-top: 2px !important;
          }

          .scanner-saved-section > div:nth-child(2),
          .scanner-saved-section > div:nth-child(3) {
            padding: 7px !important;
          }

          .scanner-saved-section .grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px !important;
            max-height: 74px;
            overflow: auto;
          }

          .scanner-saved-section .grid > div {
            display: grid;
            grid-template-columns: 44px minmax(0, 1fr);
            align-items: center;
            gap: 6px;
            min-width: 0;
          }

          .scanner-saved-section .grid > div > div:first-child {
            height: 42px;
            min-height: 42px;
            aspect-ratio: auto;
            border: 0;
            border-radius: 6px;
          }

          .scanner-saved-section .grid > div > div:last-child {
            min-width: 0;
            padding: 0 !important;
          }

          .scanner-saved-section .grid > div > div:last-child > div:last-child {
            margin-top: 3px !important;
          }

          .scanner-saved-section .grid button {
            min-height: 22px;
            padding: 2px 5px !important;
            font-size: 11px !important;
          }

          .scanner-footer-note {
            width: calc(100% - 262px);
            max-width: none;
            flex: 0 0 auto;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>
      <canvas ref={processedCanvasRef} className="hidden" />

      <input
        ref={replaceFileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleReplaceImage}
      />

      <div className="scanner-main-content">
        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FEE9E9] border border-[#FBB6B6] text-red-700 rounded-xl flex items-center justify-between text-sm font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[#B91C1C] shrink-0" />
              <span>{DL(errorMessage)}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-[#FEE9E9] rounded-lg cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="scanner-page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/sohoj-tools"
              className="p-1.5 sm:p-2 text-[#5A4A32] hover:bg-[#EFE3C8]/60 rounded-lg transition-colors cursor-pointer"
              title={DL("Back to Tools")}
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Link>

            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#FEE9E9] text-[#DC2626] rounded-lg flex items-center justify-center font-bold shadow-xs shrink-0">
              <Printer size={18} className="sm:w-5 sm:h-5" />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#3B2F1E] leading-tight">
                <DocumentText>{"Document Print\n              "}</DocumentText>
              </h1>
              <p className="text-[13px] sm:text-sm text-[#6B5A40] font-medium">
                <DocumentText>
                  {"All kind of documents print ready.\n              "}
                </DocumentText>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center bg-[#FBF6E8] border border-[#E3D6B8] rounded-lg p-0.5 sm:p-1 shadow-xs mr-1 sm:mr-2">
              <button
                onClick={() => handlePageNavigation(-1)}
                disabled={
                  images.length === 0 ||
                  selectedIndex === 0 ||
                  isProcessing ||
                  isManualCropping ||
                  isErasing ||
                  isSavingDocument
                }
                className="p-1 sm:p-1.5 text-[#5A4A32] hover:bg-[#EFE3C8] rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={DL("Previous document page")}
                aria-label={DL("Previous document page")}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="min-w-[34px] px-1 text-center text-[12px] sm:text-[13px] font-bold text-[#6B5A40] tabular-nums">
                {images.length > 0 ? (
                  <DocumentText>{`${selectedIndex + 1}/${images.length}`}</DocumentText>
                ) : (
                  <DocumentText>{"0/0"}</DocumentText>
                )}
              </div>

              <button
                onClick={() => handlePageNavigation(1)}
                disabled={
                  images.length === 0 ||
                  selectedIndex >= images.length - 1 ||
                  isProcessing ||
                  isManualCropping ||
                  isErasing ||
                  isSavingDocument
                }
                className="p-1 sm:p-1.5 text-[#5A4A32] hover:bg-[#EFE3C8] rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={DL("Next document page")}
                aria-label={DL("Next document page")}
              >
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => setIsComparing(!isComparing)}
                disabled={images.length === 0}
                className={`p-1 sm:p-1.5 rounded-md transition-colors cursor-pointer ${isComparing ? "bg-[#DC2626] text-white" : "text-[#5A4A32] hover:bg-[#EFE3C8]"} disabled:opacity-40 disabled:cursor-not-allowed`}
                title={DL("Compare Original & Cleaned")}
              >
                <Columns size={15} />
              </button>
            </div>

            <button
              onClick={() => void handleSaveDocument()}
              disabled={
                images.length === 0 ||
                !cleanBaseSrc ||
                isProcessing ||
                isManualCropping ||
                isErasing ||
                isSavingDocument
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] border border-[#DC2626] rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={DL(
                "Save the current final document to Cloudinary and MongoDB",
              )}
            >
              {isSavingDocument ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>
                {isSavingDocument
                  ? editingSavedDocumentId
                    ? DL("Updating...")
                    : DL("Saving...")
                  : editingSavedDocumentId
                    ? DL("Save changes")
                    : DL("Save document")}
              </span>
            </button>

            <button
              onClick={handlePrint}
              disabled={
                images.length === 0 ||
                isProcessing ||
                isSavingDocument ||
                isErasing
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] border border-[#DC2626] rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={14} />
              <span>
                <DocumentText>{"Print"}</DocumentText>
              </span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={
                images.length === 0 ||
                isProcessing ||
                isSavingDocument ||
                isErasing
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[13px] sm:text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={14} />
              <span>
                <DocumentText>{"PDF download"}</DocumentText>
              </span>
            </button>

            <button
              onClick={() => void handleDownloadImage()}
              disabled={images.length === 0 || isErasing}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[13px] sm:text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              <span>
                <DocumentText>{"Download"}</DocumentText>
              </span>
            </button>
          </div>
        </div>

        <div className="scanner-workspace flex flex-col lg:flex-row gap-4 items-start">
          <div className="scanner-workspace-panel flex-1 w-full bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs min-h-[500px] sm:min-h-[600px] lg:min-h-[720px]">
            <div className="scanner-workspace-inner flex flex-col md:flex-row gap-3 sm:gap-4 h-full flex-1">
              <div className="flex md:flex-col gap-2.5 shrink-0 overflow-x-auto md:overflow-y-auto max-h-none md:max-h-[600px] pb-2 md:pb-0 scrollbar-thin scroll">
                <label className="w-14 h-18 sm:w-16 sm:h-20 shrink-0 border-2 border-dashed border-[#D8C9A6] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl flex items-center justify-center cursor-pointer transition-colors">
                  <Plus size={20} className="text-[#5A4A32] sm:w-6 sm:h-6" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>

                {images.map((imgSrc, idx) => (
                  <div
                    key={`${imgSrc}-${idx}`}
                    onClick={() => requestPageNavigation(idx)}
                    className={`w-14 h-18 sm:w-16 sm:h-20 shrink-0 rounded-xl border-2 overflow-hidden relative cursor-pointer shadow-xs transition-all ${selectedIndex === idx ? "border-[#DC2626] ring-2 ring-[#DC2626]/40 bg-[#F6D9A8] scale-102" : "border-[#E3D6B8] opacity-80 hover:opacity-100"}`}
                  >
                    <img
                      src={imgSrc}
                      alt={DL("Thumbnail")}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1 right-1 bg-[#DC2626] text-white p-0.5 rounded-full hover:bg-[#B91C1C] shadow cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="scanner-preview-column flex-1 min-w-0 min-h-0 flex flex-col gap-2">
              <div ref={previewBoxRef} className="scanner-preview-canvas flex-1 bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl flex items-center justify-center p-1 sm:p-1.5 relative overflow-hidden min-h-[380px] sm:min-h-[480px] lg:min-h-[620px]">

                {images.length === 0 ? (
                  <label className="flex flex-col items-center justify-center gap-3 cursor-pointer text-[#6B5A40] hover:text-[#5A4A32] transition-colors p-6 text-center">
                    <Upload size={32} className="text-[#DC2626]" />
                    <span className="text-sm font-semibold px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg shadow-xs cursor-pointer">
                      <DocumentText>
                        {"Upload Document\n                    "}
                      </DocumentText>
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>
                ) : (
                  <div
                    ref={containerRef}
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                      transition: isPanning ? "none" : "transform 0.1s ease",
                      ...(previewFrameSize
                        ? {
                            width: previewFrameSize.width,
                            height: previewFrameSize.height,
                          }
                        : { width: "100%", height: "100%" }),
                    }}
                    className="scanner-paper-frame bg-transparent shadow-md rounded relative flex items-center justify-center overflow-hidden"
                  >
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Loader2
                          size={32}
                          className="text-[#DC2626] animate-spin"
                        />
                        <span className="text-sm font-bold text-[#3B2F1E]">
                          {enhanceProgress
                            ? enhanceProgress.stage === "download"
                              ? DL(
                                  `Downloading AI model… ${enhanceProgress.percent}% (first run)`,
                                )
                              : enhanceProgress.stage === "load"
                                ? DL("Starting AI engine…")
                                : DL(
                                    `${DL(ENHANCE_LABEL)} in progress… ${enhanceProgress.percent}%`,
                                  )
                            : isWaitingForOpenCv
                              ? DL(
                                  "Loading OpenCV… Auto crop will start as soon as it is ready.",
                                )
                              : isAutoCropping
                                ? DL("Auto crop is running…")
                                : activeStage === "clean"
                                  ? DL("Cleaning document…")
                                  : activeStage === "color"
                                    ? DL("Coloring document…")
                                    : DL("Processing Image...")}
                        </span>
                        {(enhanceProgress || isWaitingForOpenCv) && (
                          <button
                            type="button"
                            onClick={() => enhanceAbortRef.current?.abort()}
                            className="mt-1 px-3 py-1.5 border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] text-[12px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <X size={12} />
                            <DocumentText>
                              {"Cancel\n                          "}
                            </DocumentText>
                          </button>
                        )}
                      </div>
                    )}

                    {isWriting && (
                      <div className="absolute inset-0 bg-white/50 z-40 flex flex-col items-center justify-center gap-2 p-4 text-center pointer-events-none">
                        <Loader2
                          size={30}
                          className="text-[#DC2626] animate-spin"
                        />
                        <span className="text-sm font-bold text-[#3B2F1E]">
                          <DocumentText>
                            {"Loading handwriting font…"}
                          </DocumentText>
                        </span>
                      </div>
                    )}

                    {isSavingDocument && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] z-40 flex flex-col items-center justify-center gap-2 p-4 text-center pointer-events-none">
                        <Loader2
                          size={30}
                          className="text-[#DC2626] animate-spin"
                        />
                        <span className="text-sm font-bold text-[#3B2F1E]">
                          <DocumentText>
                            {"Saving document...\n                        "}
                          </DocumentText>
                        </span>
                        <span className="text-[13px] text-[#6B5A40]">
                          <DocumentText>
                            {
                              "Uploading image and saving your record\n                        "
                            }
                          </DocumentText>
                        </span>
                      </div>
                    )}

                    {isComparing && processedImageSrc ? (
                      <CompareSlider
                        leftSrc={processedImageSrc}
                        rightSrc={
                          rotatedOriginalSrc ||
                          croppedOriginalSrc ||
                          uncroppedSrc ||
                          images[selectedIndex]
                        }
                        leftLabel={DL("Cleaned")}
                        rightLabel={DL("Original")}
                      />
                    ) : (
                      <img
                        src={previewDisplaySrc}
                        alt={DL("Preview")}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    )}

                    {isErasing && (
                      <>
                        <canvas
                          ref={eraseCanvasRef}
                          onPointerDown={handleErasePointerDown}
                          onPointerMove={handleErasePointerMove}
                          onPointerUp={handleErasePointerUp}
                          onPointerCancel={handleErasePointerUp}
                          onPointerLeave={() => {
                            if (!eraseCurrentRef.current) setEraserCursor(null);
                            if (!punctDownRef.current) setPunctPos(null);
                          }}
                          style={{
                            touchAction: "none",
                            cursor: spaceHeld
                              ? isPanning
                                ? "grabbing"
                                : "grab"
                              : brushShape === "area" ||
                                  brushShape === "lasso" ||
                                  isLineTool ||
                                  isBorderTool ||
                                  isWriteTool ||
                                  isSealTool ||
                                  isPunctTool
                                ? "crosshair"
                                : "none",
                            visibility:
                              isHoldingOriginal || isComparing
                                ? "hidden"
                                : "visible",
                          }}
                          className="absolute inset-0 w-full h-full z-20"
                        />
                        {brushShape === "free" &&
                          !isLineTool &&
                          !isBorderTool &&
                          !isWriteTool &&
                          !isSealTool &&
                          !isPunctTool &&
                          eraserCursor &&
                          !isHoldingOriginal &&
                          !isComparing && (
                          <div
                            style={{
                              left: eraserCursor.x,
                              top: eraserCursor.y,
                              width: eraserCursor.d,
                              height: eraserCursor.d,
                            }}
                            className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#DC2626] bg-[#DC2626]/10 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                          />
                        )}
                        {lineDraft &&
                          eraseCanvasRef.current &&
                          (() => {
                            const cw = eraseCanvasRef.current!.offsetWidth;
                            const ch = eraseCanvasRef.current!.offsetHeight;
                            const lx0 = lineDraft.x0 * cw;
                            const ly0 = lineDraft.y0 * ch;
                            const len = Math.hypot(
                              lineDraft.x1 * cw - lx0,
                              lineDraft.y1 * ch - ly0,
                            );
                            const ang =
                              (Math.atan2(
                                lineDraft.y1 * ch - ly0,
                                lineDraft.x1 * cw - lx0,
                              ) *
                                180) /
                              Math.PI;
                            const th = Math.max(2, eraserRadiusFrac * 2 * cw);
                            const spacing = Math.max(3, eraserRadiusFrac * 4.4 * cw);
                            const dotted = brushTool === "dots";
                            return (
                              <div
                                style={{
                                  left: lx0,
                                  top: ly0 - th / 2,
                                  width: len,
                                  height: th,
                                  transformOrigin: `0 ${th / 2}px`,
                                  transform: `rotate(${ang}deg)`,
                                  borderRadius: dotted ? 0 : th / 2,
                                  ...(dotted
                                    ? {
                                        backgroundImage: `radial-gradient(circle ${th / 2}px at 50% 50%, ${brushPaintColor} calc(100% - 0.6px), transparent 100%)`,
                                        backgroundSize: `${spacing}px ${th}px`,
                                        backgroundPosition: `${-spacing / 2}px 0`,
                                        backgroundRepeat: "repeat-x",
                                      }
                                    : { backgroundColor: brushPaintColor }),
                                }}
                                className="absolute z-30 pointer-events-none"
                              />
                            );
                          })()}
                        {(isWriteTool || isPunctTool) && (
                          <canvas
                            ref={ghostCanvasRef}
                            className="absolute inset-0 w-full h-full z-30 pointer-events-none"
                          />
                        )}
                        {handDraft && handDraft.length > 0 && eraseCanvasRef.current && (
                          <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="absolute inset-0 w-full h-full z-30 pointer-events-none"
                          >
                            <polyline
                              points={(handDraft.length === 1
                                ? [handDraft[0], { x: handDraft[0].x + 0.0001, y: handDraft[0].y }]
                                : handDraft
                              )
                                .map((pt) => `${pt.x * 100},${pt.y * 100}`)
                                .join(" ")}
                              fill="none"
                              stroke={stampTint ?? "#DC2626"}
                              strokeOpacity="0.35"
                              strokeWidth={Math.max(2, eraserRadiusFrac * 2 * eraseCanvasRef.current.offsetWidth)}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        )}
                        {lassoDraft && lassoDraft.length > 1 && (
                          <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="absolute inset-0 w-full h-full z-30 pointer-events-none"
                          >
                            <polygon
                              points={lassoDraft
                                .map((p) => `${p.x * 100},${p.y * 100}`)
                                .join(" ")}
                              fill="rgba(220,38,38,0.12)"
                              stroke="#DC2626"
                              strokeWidth="2"
                              strokeDasharray="6 4"
                              vectorEffect="non-scaling-stroke"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {areaRect && (
                          <div
                            style={{
                              left: `${areaRect.x0 * 100}%`,
                              top: `${areaRect.y0 * 100}%`,
                              width: `${(areaRect.x1 - areaRect.x0) * 100}%`,
                              height: `${(areaRect.y1 - areaRect.y0) * 100}%`,
                            }}
                            className="absolute z-30 pointer-events-none border-2 border-dashed border-[#DC2626] bg-[#DC2626]/10 overflow-hidden"
                          >
                          </div>
                        )}
                      </>
                    )}

                    {!isProcessing &&
                      !isComparing &&
                      (handMode ||
                        (!isErasing && !isManualCropping)) && (
                        <div
                          onPointerDown={startPan}
                          onPointerMove={movePan}
                          onPointerUp={endPan}
                          onPointerCancel={endPan}
                          style={{ touchAction: "none" }}
                          className={`absolute inset-0 ${handMode ? "z-[35]" : "z-[25]"} ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
                          title={DL("Move the document (drag)")}
                        />
                      )}

                    {isManualCropping && !isComparing && (
                      <div className="absolute inset-0 bg-[#3B2F1E]/35 pointer-events-auto z-20">
                        <svg
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="w-full h-full pointer-events-none absolute inset-0"
                        >
                          <polygon
                            points={corners
                              .map((point) => `${point.x},${point.y}`)
                              .join(" ")}
                            className="fill-[#DC2626]/15 stroke-[#DC2626] stroke-2"
                            strokeDasharray="4"
                          />
                        </svg>

                        {corners.map((corner, index) => (
                          <div
                            key={index}
                            onPointerDown={(e) => handleCornerPointerDown(index, e)}
                            onPointerMove={(e) => handleCornerPointerMove(index, e)}
                            onPointerUp={(e) => handleCornerPointerUp(index, e)}
                            onPointerCancel={(e) => handleCornerPointerUp(index, e)}
                            style={{
                              left: `${corner.x}%`,
                              top: `${corner.y}%`,
                              touchAction: "none",
                            }}
                            className="group w-11 h-11 absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing flex items-center justify-center z-30 select-none"
                          >
                            <span className="w-7 h-7 sm:w-6 sm:h-6 bg-[#DC2626] group-hover:bg-[#B91C1C] border-2 border-[#FBF6E8] rounded-full shadow-lg flex items-center justify-center pointer-events-none">
                              <span className="w-2 h-2 bg-[#FBF6E8] rounded-full" />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-[#E3D6B8] flex flex-wrap gap-2 items-center justify-between text-sm text-[#5A4A32]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => zoomTo(zoomRef.current / 1.25)}
                  aria-label="Zoom out"
                  className="w-7 h-7 bg-[#FBF6E8] rounded-md border border-[#E3D6B8] flex items-center justify-center font-bold text-[#5A4A32] hover:bg-[#EFE3C8] cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => zoomTo(zoomRef.current * 1.25)}
                  aria-label="Zoom in"
                  className="w-7 h-7 bg-[#FBF6E8] rounded-md border border-[#E3D6B8] flex items-center justify-center font-bold text-[#5A4A32] hover:bg-[#EFE3C8] cursor-pointer"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={resetView}
                  className="px-2.5 py-1 bg-[#FBF6E8] rounded-md border border-[#E3D6B8] font-medium text-[#5A4A32] hover:bg-[#EFE3C8] flex items-center gap-1 cursor-pointer"
                >
                  <span>
                    <DocumentText>{"Reset view"}</DocumentText>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHandMode((v) => !v)}
                  aria-pressed={handMode}
                  title={DL("Move the document (drag)")}
                  className={`px-2.5 py-1 rounded-md border font-medium flex items-center gap-1 cursor-pointer ${handMode ? "bg-[#DC2626] border-[#DC2626] text-white" : "bg-[#FBF6E8] border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
                >
                  <Hand size={14} />
                  <span>{DL("Move")}</span>
                </button>
              </div>

                {images.length > 0 && (
                  <div className="scanner-preview-toolbar flex items-center gap-1 sm:gap-1.5 bg-[#FBF6E8] p-0.5 rounded-lg shadow-xs border border-[#E3D6B8] shrink-0">
                    <button
                      onClick={handleReset}
                      disabled={isProcessing || isSavingDocument || isErasing}
                      className="px-1.5 py-1 sm:px-2 bg-[#FBF6E8] hover:bg-[#EFE3C8] text-[#5A4A32] hover:text-[#3B2F1E] rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[13px] font-semibold"
                      title={DL(
                        "Reset all edits, crops, and adjustments to original state",
                      )}
                    >
                      <RotateCcw size={15} />
                      <span className="hidden sm:inline">
                        <DocumentText>{"Full Reset"}</DocumentText>
                      </span>
                    </button>

                    <button
                      onClick={() => replaceFileInputRef.current?.click()}
                      disabled={isProcessing || isSavingDocument || isErasing}
                      className="px-1.5 py-1 sm:px-2 bg-[#FBF6E8] hover:bg-[#EFE3C8] text-[#5A4A32] hover:text-[#3B2F1E] rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[13px] font-semibold"
                      title={DL("Replace current image with a new file")}
                    >
                      <ImagePlus size={15} />
                      <span className="hidden sm:inline">
                        <DocumentText>{"Replace"}</DocumentText>
                      </span>
                    </button>

                    <div className="w-[1px] h-4 bg-[#F3E9D2] mx-0.5" />

                    <button
                      onClick={handleRotate}
                      disabled={
                        isProcessing ||
                        isManualCropping ||
                        isErasing ||
                        isSavingDocument
                      }
                      className="px-1.5 py-1 sm:px-2 bg-[#FBF6E8] hover:bg-[#EFE3C8] text-[#5A4A32] hover:text-[#3B2F1E] rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[13px] font-semibold"
                      title={
                        isManualCropping
                          ? DL("Finish manual crop first")
                          : DL("Rotate Document 90°")
                      }
                    >
                      <RotateCw size={15} />
                      <span className="hidden sm:inline">
                        <DocumentText>{"Rotate"}</DocumentText>
                      </span>
                    </button>
                  </div>
                )}

              <span className="text-[12px] sm:text-[13px] text-[#6B5A40] font-medium">
                {(zoom / 100).toFixed(1)}
                <DocumentText>
                  {"x - Ctrl + scroll to zoom, drag to move\n              "}
                </DocumentText>
              </span>
            </div>
          </div>

          <div className="scanner-tools-sidebar w-full lg:w-[320px] shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            <div className="scanner-tools-col">
              <div className="scanner-tool-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                  <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                  <DocumentText>{"Crop\n              "}</DocumentText>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleTriggerAutoCrop}
                    disabled={
                      isProcessing ||
                      images.length === 0 ||
                      isSavingDocument ||
                      isErasing
                    }
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${autoCrop && !isManualCropping ? "bg-[#DC2626] text-white" : "bg-[#DC2626] hover:bg-[#B91C1C] text-white"}`}
                  >
                    <Crop size={14} />
                    <DocumentText>{"Auto crop\n                "}</DocumentText>
                  </button>

                  <button
                    onClick={handleTriggerManualCrop}
                    disabled={images.length === 0 || isSavingDocument || isErasing}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isManualCropping ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
                  >
                    <Crop size={14} />
                    <DocumentText>{"Manual crop\n                "}</DocumentText>
                  </button>
                </div>

                {renderDocToolsSection()}
              </div>
            </div>

            <div className="scanner-tools-col">
              {renderToolOptionsPanel()}

              {!isErasing && (
                <div className="scanner-tool-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                    <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                    <DocumentText>{"Enhance Document\n              "}</DocumentText>
                  </div>

                  {renderColorDocumentRow()}
                  {renderMagicCleanRow()}
                  {renderEffectRow("clean", "Document Clean", <Wand2 size={14} />)}
                  <button
                    type="button"
                    onClick={handleUndoLast}
                    disabled={
                      history.length === 0 ||
                      isProcessing ||
                      isManualCropping ||
                      isErasing ||
                      isSavingDocument
                    }
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold border border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#EFE3C8] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={12} />
                    {history.length > 0 ? (
                      <DocumentText>{`Undo: ${STEP_LABELS[history[history.length - 1].step]}`}</DocumentText>
                    ) : (
                      <DocumentText>{"Undo"}</DocumentText>
                    )}
                  </button>
                </div>
              )}

              <div className="scanner-tool-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                  <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                  <DocumentText>{"Mode\n              "}</DocumentText>
                </div>

                <div className="space-y-2">
                  <button
                    onMouseDown={() => setIsHoldingOriginal(true)}
                    onMouseUp={() => setIsHoldingOriginal(false)}
                    onMouseLeave={() => setIsHoldingOriginal(false)}
                    onTouchStart={() => setIsHoldingOriginal(true)}
                    onTouchEnd={() => setIsHoldingOriginal(false)}
                    disabled={images.length === 0}
                    className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer select-none active:scale-98 ${isHoldingOriginal ? "bg-[#DC2626] text-white shadow-xs" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Eye size={14} />
                    <span>
                      {isHoldingOriginal ? (
                        <DocumentText>{"Showing Original..."}</DocumentText>
                      ) : (
                        <DocumentText>
                          {"Hold for Normal (original)"}
                        </DocumentText>
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {!isErasing && (
                <div className="scanner-tool-card scanner-adjustments-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3 transition-all sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                      <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                      <DocumentText>{"Adjustments\n                "}</DocumentText>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetAdjustments}
                      disabled={
                        images.length === 0 ||
                        (blackness === 0 && contrast === 0 && brightness === 0)
                      }
                      className="px-2 py-1 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] hover:bg-[#EFE3C8] hover:text-[#3B2F1E] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title={DL("Reset only adjustments")}
                    >
                      <DocumentText>{"Reset\n                "}</DocumentText>
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between font-semibold text-[#5A4A32] mb-1">
                        <span>
                          <DocumentText>{"Black"}</DocumentText>
                        </span>
                        <span>{blackness}</span>
                      </div>
                      <input
                        type="range"
                        disabled={isErasing}
                        min="-100"
                        max="100"
                        value={blackness}
                        onChange={(e) => {
                          setBlackness(Number(e.target.value));
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-[#5A4A32] mb-1">
                        <span>
                          <DocumentText>{"Color"}</DocumentText>
                        </span>
                        <span>{brightness}</span>
                      </div>
                      <input
                        type="range"
                        disabled={isErasing}
                        min="-100"
                        max="100"
                        value={brightness}
                        onChange={(e) => {
                          setBrightness(Number(e.target.value));
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-[#5A4A32] mb-1">
                        <span>
                          <DocumentText>{"Contrast"}</DocumentText>
                        </span>
                        <span>{contrast}</span>
                      </div>
                      <input
                        type="range"
                        disabled={isErasing}
                        min="-100"
                        max="100"
                        value={contrast}
                        onChange={(e) => {
                          setContrast(Number(e.target.value));
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isErasing && (
                <div className="scanner-tool-card bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-3 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#3B2F1E] uppercase tracking-wider">
                      <span className="w-1.5 h-3 bg-[#DC2626] rounded-xs" />
                      {DL("Page margin")}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPageMargins(NO_MARGINS)}
                      disabled={!hasPageMargins(pageMargins)}
                      className="px-2 py-1 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] hover:bg-[#EFE3C8] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {DL("Reset")}
                    </button>
                  </div>
                  <p className="text-[12px] leading-snug text-[#6B5A40]">
                    {DL("Applies to Print, PDF download and Download.")}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MARGIN_PRESETS.map((pr) => {
                      const on =
                        pageMargins.top === pr.mm &&
                        pageMargins.right === pr.mm &&
                        pageMargins.bottom === pr.mm &&
                        pageMargins.left === pr.mm;
                      return (
                        <button
                          key={pr.label}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setPageMargins({
                              top: pr.mm,
                              right: pr.mm,
                              bottom: pr.mm,
                              left: pr.mm,
                            })
                          }
                          className={`px-1 py-1.5 rounded-lg text-[12px] leading-tight font-semibold cursor-pointer transition-all ${on ? "bg-[#DC2626] text-white" : "bg-[#F6EEDB] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}
                        >
                          {DL(pr.label)}
                          <span className="block text-[11px] font-medium opacity-80">
                            {pr.mm} mm
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 items-start">
                    {/* Mini A4 sheet showing where the document will sit. */}
                    <div
                      aria-hidden="true"
                      className="relative shrink-0 w-[62px] bg-white border border-[#CDBB93] shadow-xs"
                      style={{ aspectRatio: "210 / 297" }}
                    >
                      <div
                        className="absolute bg-[#F3D9D9] border border-dashed border-[#DC2626]"
                        style={{
                          left: `${(pageMargins.left / 210) * 100}%`,
                          right: `${(pageMargins.right / 210) * 100}%`,
                          top: `${(pageMargins.top / 297) * 100}%`,
                          bottom: `${(pageMargins.bottom / 297) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2 text-sm">
                      {(["top", "bottom", "left", "right"] as const).map((side) => (
                        <div key={side}>
                          <div className="flex justify-between font-semibold text-[#5A4A32] text-[13px]">
                            <span>{DL(side.charAt(0).toUpperCase() + side.slice(1))}</span>
                            <span>{pageMargins[side]} mm</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={MAX_MARGIN_MM}
                            value={pageMargins[side]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setPageMargins((prev) =>
                                marginsLinked
                                  ? { top: v, right: v, bottom: v, left: v }
                                  : { ...prev, [side]: v },
                              );
                            }}
                            className="w-full accent-[#DC2626] h-1.5 bg-[#F3E9D2] rounded-lg cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A4A32] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marginsLinked}
                      onChange={(e) => setMarginsLinked(e.target.checked)}
                      className="accent-[#DC2626] w-4 h-4 cursor-pointer"
                    />
                    <span>{DL("Same on all sides")}</span>
                  </label>
                </div>
              )}
            </div>

              {/* Hanging warning note: hangs on the right side of the Enhance card
                  (desktop fit mode, hung on the right edge) or sits under the buttons (narrow screens). */}
              <div
                role="note"
                className="scanner-note-wrap relative mt-4 sm:col-span-2 lg:col-span-1"
              >
                <span
                  aria-hidden="true"
                  className="scanner-note-nail absolute -top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#5A4A32] border-2 border-[#FBF6E8] shadow z-10"
                />
                <div className="scanner-hang-note">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 100 30"
                    preserveAspectRatio="none"
                    className="scanner-note-strings w-full h-7"
                  >
                    <path
                      d="M50 3 L14 30 M50 3 L86 30"
                      stroke="#8A6D2B"
                      strokeWidth="1.6"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div className="rounded-lg bg-[#FFF176] border-2 border-[#E6C200] shadow-[3px_8px_16px_rgba(90,74,50,0.32)] overflow-hidden">
                    <div className="flex items-center gap-2 bg-[#DC2626] text-white px-3 py-2">
                      <span className="relative flex w-3.5 h-3.5 shrink-0">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-75 animate-ping" />
                        <span className="relative inline-flex w-3.5 h-3.5 rounded-full bg-white" />
                      </span>
                      <AlertCircle size={16} className="shrink-0" />
                      <span className="text-[13px] font-extrabold uppercase tracking-wider">
                        <DocumentText>{"Important"}</DocumentText>
                      </span>
                    </div>
                    <div className="px-3 py-3 space-y-3">
                      <p className="text-[19px] leading-tight font-extrabold text-[#3B2F1E]">
                        <DocumentText>{"Blurry photo?"}</DocumentText>
                      </p>
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-[#DC2626] text-white text-[13px] font-bold flex items-center justify-center">
                          1
                        </span>
                        <p className="text-[15px] leading-snug font-semibold text-[#3B2F1E]">
                          <DocumentText>
                            {"Photo blurry? First press Fix Blur."}
                          </DocumentText>
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-[#DC2626] text-white text-[13px] font-bold flex items-center justify-center">
                          2
                        </span>
                        <p className="text-[15px] leading-snug font-semibold text-[#3B2F1E]">
                          <DocumentText>
                            {"Then press Document Clean."}
                          </DocumentText>
                        </p>
                      </div>
                      <div className="border-t-2 border-dashed border-[#C9A800] pt-2.5">
                        <p className="text-[14px] leading-snug font-bold text-[#7A1F1F]">
                          <DocumentText>
                            {
                              "Photo already sharp? Skip Fix Blur — go straight to Document Clean."
                            }
                          </DocumentText>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      {previewSavedDocument && (
        <div
          className="fixed inset-0 z-[95] bg-[#0F172A]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-document-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewSavedDocument(null);
            }
          }}
        >
          <div className="w-full max-w-6xl h-[min(92vh,900px)] bg-[#F3E9D2] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#D8C9A6] overflow-hidden flex flex-col">
            <div className="px-3 sm:px-5 py-3 bg-[#FBF6E8] border-b border-[#E3D6B8] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[13px] uppercase tracking-[0.16em] text-[#6B5A40] font-bold">
                  <DocumentText>
                    {"Saved document preview\n                "}
                  </DocumentText>
                </p>
                <h2
                  id="saved-document-preview-title"
                  className="text-base sm:text-lg font-bold text-[#3B2F1E] truncate"
                >
                  {previewSavedDocument.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPreviewSavedDocument(null)}
                className="w-9 h-9 rounded-xl bg-[#F3E9D2] hover:bg-[#EFE3C8] text-[#5A4A32] flex items-center justify-center cursor-pointer shrink-0"
                aria-label={DL("Close preview")}
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 min-h-0 p-3 sm:p-5 flex items-center justify-center overflow-auto scroll bg-[#F3E9D2]/70">
              <div className="max-w-full max-h-full bg-white rounded-xl shadow-xl border border-[#D8C9A6] p-2 sm:p-3 flex items-center justify-center">
                <img
                  src={previewSavedDocument.src}
                  alt={previewSavedDocument.name}
                  className="block max-w-full max-h-[calc(92vh-190px)] object-contain"
                />
              </div>
            </div>

            <div className="px-3 sm:px-5 py-3 bg-[#FBF6E8] border-t border-[#E3D6B8] flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleEditSavedDocument(previewSavedDocument)}
                disabled={isProcessing || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit size={14} />
                <DocumentText>{"Modify document\n              "}</DocumentText>
              </button>

              <button
                type="button"
                onClick={() => handlePrintSource(previewSavedDocument.src)}
                disabled={isProcessing || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={14} />
                <DocumentText>{"Print\n              "}</DocumentText>
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDownloadPDFForSource(
                    previewSavedDocument.src,
                    `${previewSavedDocument.name
                      .toLowerCase()
                      .replace(/\s+/g, "-")}.pdf`,
                  )
                }
                disabled={isProcessing || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown size={14} />
                <DocumentText>{"PDF download\n              "}</DocumentText>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownloadSavedDocument(previewSavedDocument)
                }
                disabled={isProcessing || isSavingDocument}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                <DocumentText>{"Download image\n              "}</DocumentText>
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingNavigationIndex !== null && hasUnsavedChanges && (
        <div
          className="fixed inset-0 z-[100] bg-[#0F172A]/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-document-title"
        >
          <div className="w-full max-w-sm bg-[#F0DDB5] rounded-2xl border-2 border-[#DC2626] shadow-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F6EEDB] text-[#DC2626] border border-[#E3D6B8] flex items-center justify-center shrink-0">
                <Save size={19} />
              </div>

              <div className="min-w-0">
                <h2
                  id="unsaved-document-title"
                  className="text-base font-bold text-[#3B2F1E]"
                >
                  <DocumentText>
                    {"Save current document?\n                "}
                  </DocumentText>
                </h2>
                <p className="text-sm text-[#6B5A40] mt-1.5 leading-5">
                  <DocumentText>
                    {
                      "You can save your current work before switching to another\n                  document.\n                "
                    }
                  </DocumentText>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={handleConfirmNavigationWithoutSave}
                disabled={isProcessing || isSavingDocument}
                className="py-2.5 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] text-[#5A4A32] hover:bg-[#EFE3C8] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentText>{"No\n              "}</DocumentText>
              </button>
              <button
                type="button"
                onClick={handleConfirmNavigationSave}
                disabled={isProcessing || isSavingDocument}
                className="py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDocument ? (
                  <DocumentText>{"Saving..."}</DocumentText>
                ) : (
                  <DocumentText>{"Yes, Save"}</DocumentText>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="scanner-saved-section mt-4 bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-[#3B2F1E]">
              <DocumentText>{"Saved Documents\n            "}</DocumentText>
            </h2>
            <p className="text-[13px] text-[#6B5A40] mt-0.5">
              <DocumentText>
                {"Saved documents are linked to your account.\n            "}
              </DocumentText>
            </p>
          </div>

          <span className="text-[12px] sm:text-[13px] font-semibold text-[#6B5A40] bg-[#F3E9D2] rounded-full px-2.5 py-1">
            {savedDocuments.length}
            <DocumentText>{"saved\n          "}</DocumentText>
          </span>
        </div>

        {isLoadingSavedDocuments ? (
          <div className="border border-[#E3D6B8] rounded-xl bg-[#F6EEDB] p-6 text-center">
            <Loader2
              size={22}
              className="mx-auto text-[#DC2626] animate-spin mb-2"
            />
            <p className="text-sm font-semibold text-[#5A4A32]">
              <DocumentText>
                {
                  "Saved documents load \u09B9\u099A\u09CD\u099B\u09C7...\n            "
                }
              </DocumentText>
            </p>
          </div>
        ) : savedDocuments.length === 0 ? (
          <div className="border border-dashed border-[#E3D6B8] rounded-xl bg-[#F6EEDB] p-6 text-center">
            <Save size={22} className="mx-auto text-[#7A6A50] mb-2" />
            <p className="text-sm font-semibold text-[#5A4A32]">
              <DocumentText>
                {
                  "\u098F\u0996\u09A8\u09CB \u0995\u09CB\u09A8\u09CB document save \u0995\u09B0\u09BE \u09B9\u09DF\u09A8\u09BF\u0964\n            "
                }
              </DocumentText>
            </p>
            <p className="text-[13px] text-[#6B5A40] mt-1">
              <DocumentText>
                {
                  "Crop, clean \u098F\u09AC\u0982 adjustment \u09B6\u09C7\u09B7 \u0995\u09B0\u09C7 \u0989\u09AA\u09B0\u09C7\u09B0 Save document \u099A\u09BE\u09AA\u09CB\u0964\n            "
                }
              </DocumentText>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {savedDocuments.map((savedDocument, index) => {
              const isDeleting = deletingSavedDocumentId === savedDocument.id;
              return (
                <div
                  key={savedDocument.id}
                  className="border border-[#E3D6B8] rounded-xl overflow-hidden bg-[#F6EEDB] group"
                >
                  <div
                    className="aspect-[1/1.414] bg-white flex items-center justify-center overflow-hidden border-b border-[#E3D6B8] relative cursor-pointer"
                    onClick={() => handleOpenSavedPreview(savedDocument)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenSavedPreview(savedDocument);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${DL("Preview")} ${savedDocument.name}`}
                  >
                    <img
                      src={savedDocument.src}
                      alt={savedDocument.name}
                      className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                      loading="lazy"
                    />

                    {isDeleting && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FBF6E8] border border-[#E3D6B8] shadow-md">
                          <Loader2
                            size={15}
                            className="text-[#DC2626] animate-spin"
                          />
                          <span className="text-[13px] font-semibold text-[#5A4A32]">
                            <DocumentText>
                              {"Deleting...\n                          "}
                            </DocumentText>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#3B2F1E] truncate">
                          {savedDocument.name}
                        </p>
                        <p className="text-[13px] text-[#6B5A40] mt-0.5">
                          <DocumentText>{"Saved"}</DocumentText>
                          {<DocumentText> </DocumentText>}
                          {index === 0 ? (
                            <DocumentText>{"just now"}</DocumentText>
                          ) : (
                            new Date(
                              savedDocument.createdAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          )}
                        </p>
                      </div>

                      <span className="text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] rounded-full px-2 py-0.5 shrink-0">
                        <DocumentText>
                          {"Saved\n                      "}
                        </DocumentText>
                      </span>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDownloadSavedDocument(savedDocument);
                        }}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#DC2626] text-white hover:bg-[#B91C1C] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={12} />
                        <DocumentText>
                          {"Download\n                      "}
                        </DocumentText>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveSavedDocument(savedDocument);
                        }}
                        disabled={isDeleting}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FBF6E8] border border-[#E3D6B8] text-[#6B5A40] hover:bg-[#FEE9E9] hover:text-[#991B1B] hover:border-[#FBB6B6] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`${DL("Remove")} ${savedDocument.name}`}
                        title={DL("Delete saved document")}
                      >
                        {isDeleting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <X size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="scanner-footer-note mt-4 pt-2 text-sm text-[#5A4A32] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
        <span>
          <DocumentText>
            {
              "Document Clean \u09A6\u09BF\u09DF\u09C7 Document \u0986\u09B0\u0993 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u0993 Clean \u0995\u09B0\u09C1\u09A8 A4 Print Ready\n        "
            }
          </DocumentText>
        </span>
      </div>
    </div>
  );
}
