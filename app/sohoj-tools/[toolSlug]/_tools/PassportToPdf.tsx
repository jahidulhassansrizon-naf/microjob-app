/* eslint-disable react/no-unescaped-entities */
"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  BookOpen,
  Star,
  Share2,
  ArrowLeft,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Printer,
  Upload,
  Image as ImageIcon,
  CreditCard,
  Scissors,
  Crop,
  Trash2,
  Check,
  X,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Orientation = "auto" | "portrait" | "landscape";
type SheetOrientation = "portrait" | "landscape";
type Layout = "stacked" | "side-by-side";
type Position = "top" | "center" | "bottom";
type ImageSlot = "front" | "back";
type CopyArrangement = "vertical" | "horizontal";

type Point = { x: number; y: number };

type CropPolygon = { tl: Point; tr: Point; br: Point; bl: Point };

type CropHandle =
  | "move"
  | "tl"
  | "tr"
  | "br"
  | "bl"
  | "top"
  | "right"
  | "bottom"
  | "left";

type ImageAsset = {
  file: File;
  /** Object URL of the decoded (possibly HEIC-converted) image. */
  url: string;
  /** Decoded image, kept so it is never re-decoded while adjusting settings. */
  image: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
  crop: CropPolygon;
};

type Notice = { type: "success" | "error" | "info"; message: string };

type RenderSettings = {
  brightness: number;
  contrast: number;
  sharpening: number;
  rotation: number;
  roundedCorners: boolean;
};

type Placement = { x: number; y: number; width: number; height: number };

type PlacedItem = {
  slot: ImageSlot;
  copy: number;
  /** The slot reserved for the passport page (mm, sheet coordinates). */
  box: Placement;
  /** The picture itself, fitted inside `box` (mm, sheet coordinates). */
  image: Placement;
};

type SheetGeometry = {
  orientation: SheetOrientation;
  sheetWidth: number;
  sheetHeight: number;
  /** 1 = actual size (88×125 mm). Below 1 the content had to be shrunk. */
  scale: number;
  items: PlacedItem[];
};

type ExportImage = { dataUrl: string; width: number; height: number };

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const SLOTS: ImageSlot[] = ["front", "back"];

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PASSPORT_WIDTH_MM = 88;
const PASSPORT_HEIGHT_MM = 125;
const TARGET_RATIO = PASSPORT_WIDTH_MM / PASSPORT_HEIGHT_MM;

const SAFE_MARGIN_MM = 10;
const ITEM_GAP_MM = 4;
const COPY_GAP_MM = 6;

/** 14 CSS px at 96 dpi, expressed physically so preview, PDF and print agree. */
const CORNER_RADIUS_MM = (14 * 25.4) / 96;

const EXPORT_PX_PER_MM = 300 / 25.4; // 300 DPI
const PREVIEW_PX_PER_MM = 150 / 25.4; // 150 DPI is plenty for a screen
const THUMB_PX_PER_MM = 2.4;

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MIN_SIDE_PX = 240;
const MAX_WORK_PIXELS = 12_000_000;

const TOOLS_BASE = "/sohoj-tools";
const FAVORITE_KEY = "sohoj-passport-joiner-favorite";

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                             */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve()),
  );
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function get2d(
  canvas: HTMLCanvasElement,
  willReadFrequently = false,
): CanvasRenderingContext2D {
  const context = canvas.getContext(
    "2d",
    willReadFrequently ? { willReadFrequently: true } : undefined,
  );

  if (!context) {
    throw new Error("Your browser could not create a drawing canvas.");
  }

  return context;
}

/* -------------------------------------------------------------------------- */
/*  Crop polygon maths                                                        */
/* -------------------------------------------------------------------------- */

function getDefaultCrop(imageWidth: number, imageHeight: number): CropPolygon {
  const imageRatio = imageWidth / imageHeight;

  if (imageRatio > TARGET_RATIO) {
    const width = (imageHeight * TARGET_RATIO) / imageWidth;
    const x = (1 - width) / 2;

    return {
      tl: { x, y: 0 },
      tr: { x: x + width, y: 0 },
      br: { x: x + width, y: 1 },
      bl: { x, y: 1 },
    };
  }

  const height = imageWidth / TARGET_RATIO / imageHeight;
  const y = (1 - height) / 2;

  return {
    tl: { x: 0, y },
    tr: { x: 1, y },
    br: { x: 1, y: y + height },
    bl: { x: 0, y: y + height },
  };
}

function clampPoint(point: Point): Point {
  return { x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) };
}

function cloneCrop(crop: CropPolygon): CropPolygon {
  return {
    tl: { ...crop.tl },
    tr: { ...crop.tr },
    br: { ...crop.br },
    bl: { ...crop.bl },
  };
}

function cropPoints(crop: CropPolygon): Point[] {
  return [crop.tl, crop.tr, crop.br, crop.bl];
}

function signedPolygonArea(crop: CropPolygon): number {
  const points = cropPoints(crop);
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function isValidCropPolygon(crop: CropPolygon): boolean {
  const points = cropPoints(crop);

  if (
    points.some(
      (point) => point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1,
    )
  ) {
    return false;
  }

  if (Math.abs(signedPolygonArea(crop)) < 0.004) {
    return false;
  }

  const signs = [
    cross(points[0], points[1], points[2]),
    cross(points[1], points[2], points[3]),
    cross(points[2], points[3], points[0]),
    cross(points[3], points[0], points[1]),
  ];

  const hasPositive = signs.some((value) => value > 0.00001);
  const hasNegative = signs.some((value) => value < -0.00001);

  return (
    !(hasPositive && hasNegative) &&
    signs.every((value) => Math.abs(value) > 0.00001)
  );
}

function lerpCrop(a: CropPolygon, b: CropPolygon, t: number): CropPolygon {
  const mix = (p: Point, q: Point): Point => ({
    x: p.x + (q.x - p.x) * t,
    y: p.y + (q.y - p.y) * t,
  });

  return {
    tl: mix(a.tl, b.tl),
    tr: mix(a.tr, b.tr),
    br: mix(a.br, b.br),
    bl: mix(a.bl, b.bl),
  };
}

/** Keeps a dragged crop inside the image and convex, sliding back if needed. */
function getSafeCrop(start: CropPolygon, candidate: CropPolygon): CropPolygon {
  const bounded: CropPolygon = {
    tl: clampPoint(candidate.tl),
    tr: clampPoint(candidate.tr),
    br: clampPoint(candidate.br),
    bl: clampPoint(candidate.bl),
  };

  if (isValidCropPolygon(bounded)) {
    return bounded;
  }

  let low = 0;
  let high = 1;

  for (let step = 0; step < 14; step += 1) {
    const middle = (low + high) / 2;

    if (isValidCropPolygon(lerpCrop(start, bounded, middle))) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return low === 0 ? cloneCrop(start) : lerpCrop(start, bounded, low);
}

function moveCrop(crop: CropPolygon, dx: number, dy: number): CropPolygon {
  const points = cropPoints(crop);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  const safeDx = clamp(dx, -minX, 1 - maxX);
  const safeDy = clamp(dy, -minY, 1 - maxY);

  return {
    tl: { x: crop.tl.x + safeDx, y: crop.tl.y + safeDy },
    tr: { x: crop.tr.x + safeDx, y: crop.tr.y + safeDy },
    br: { x: crop.br.x + safeDx, y: crop.br.y + safeDy },
    bl: { x: crop.bl.x + safeDx, y: crop.bl.y + safeDy },
  };
}

/** Average width/height of the cropped quadrilateral, in source pixels. */
function getCropDimensions(
  crop: CropPolygon,
  sourceWidth: number,
  sourceHeight: number,
) {
  const edge = (a: Point, b: Point) =>
    Math.hypot((b.x - a.x) * sourceWidth, (b.y - a.y) * sourceHeight);

  return {
    width: Math.max(1, (edge(crop.tl, crop.tr) + edge(crop.bl, crop.br)) / 2),
    height: Math.max(1, (edge(crop.tl, crop.bl) + edge(crop.tr, crop.br)) / 2),
  };
}

function getCropRatio(asset: ImageAsset): number {
  const { width, height } = getCropDimensions(
    asset.crop,
    asset.naturalWidth,
    asset.naturalHeight,
  );
  return width / height;
}

/** Content size (mm) of the un-rotated page, contained in the 88×125 mm slot. */
function getContentSizeMm(asset: ImageAsset) {
  const ratio = getCropRatio(asset);

  return ratio > TARGET_RATIO
    ? { width: PASSPORT_WIDTH_MM, height: PASSPORT_WIDTH_MM / ratio }
    : { width: PASSPORT_HEIGHT_MM * ratio, height: PASSPORT_HEIGHT_MM };
}

/* -------------------------------------------------------------------------- */
/*  Image loading (incl. HEIC)                                                */
/* -------------------------------------------------------------------------- */

function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(
          new Error("The selected file does not contain a readable image."),
        );
        return;
      }
      resolve(image);
    };

    image.onerror = () =>
      reject(new Error("This image could not be decoded by your browser."));

    image.src = url;
  });
}

type Heic2Any = (options: {
  blob: Blob;
  toType: string;
  quality?: number;
}) => Promise<Blob | Blob[]>;

declare global {
  interface Window {
    heic2any?: Heic2Any;
  }
}

const HEIC2ANY_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";

let heic2anyLoader: Promise<Heic2Any> | null = null;

function loadHeic2Any(): Promise<Heic2Any> {
  if (window.heic2any) {
    return Promise.resolve(window.heic2any);
  }

  if (heic2anyLoader) {
    return heic2anyLoader;
  }

  heic2anyLoader = new Promise<Heic2Any>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-heic2any="true"]',
    );

    const finish = () => {
      if (window.heic2any) {
        resolve(window.heic2any);
      } else {
        reject(new Error("HEIC converter could not be loaded."));
      }
    };

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("HEIC converter could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = HEIC2ANY_SCRIPT_SRC;
    script.async = true;
    script.dataset.heic2any = "true";
    script.onload = finish;
    script.onerror = () =>
      reject(new Error("HEIC converter could not be loaded."));
    document.head.appendChild(script);
  }).catch((error) => {
    heic2anyLoader = null;
    throw error;
  });

  return heic2anyLoader;
}

async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    const heic2any = await loadHeic2Any();
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });

    return Array.isArray(result) ? result[0] : result;
  } catch {
    throw new Error(
      "This HEIC photo could not be converted. Please export it as JPG or PNG and try again.",
    );
  }
}

async function createImageAsset(file: File): Promise<ImageAsset> {
  if (
    !file.type.startsWith("image/") &&
    !/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name)
  ) {
    throw new Error("Please choose a JPG, PNG, WebP or HEIC image.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image size must be 20 MB or smaller.");
  }

  let url = URL.createObjectURL(file);

  try {
    let image: HTMLImageElement;

    try {
      image = await loadImage(url);
    } catch (error) {
      // Safari decodes HEIC natively; every other browser needs a conversion.
      if (!isHeic(file)) {
        throw error;
      }

      URL.revokeObjectURL(url);
      url = URL.createObjectURL(await convertHeicToJpeg(file));
      image = await loadImage(url);
    }

    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (width < MIN_SIDE_PX || height < MIN_SIDE_PX) {
      throw new Error(
        `Please upload a higher-resolution image (at least ${MIN_SIDE_PX} × ${MIN_SIDE_PX} px).`,
      );
    }

    return {
      file,
      url,
      image,
      naturalWidth: width,
      naturalHeight: height,
      crop: getDefaultCrop(width, height),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*  Rendering pipeline: crop → adjust → rotate → round                        */
/* -------------------------------------------------------------------------- */

/**
 * Scales a region of `source` into a new white-backed canvas. Large reductions
 * are done in halving steps so browsers without high-quality resampling do not
 * alias.
 */
function scaleRegionToCanvas(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): HTMLCanvasElement {
  let current: CanvasImageSource = source;
  let cx = sx;
  let cy = sy;
  let cw = sw;
  let ch = sh;

  while (cw > dw * 2 || ch > dh * 2) {
    const nw = cw > dw * 2 ? Math.max(dw, Math.ceil(cw / 2)) : Math.round(cw);
    const nh = ch > dh * 2 ? Math.max(dh, Math.ceil(ch / 2)) : Math.round(ch);
    const step = createCanvas(nw, nh);
    const stepContext = get2d(step);

    stepContext.imageSmoothingEnabled = true;
    stepContext.imageSmoothingQuality = "high";
    stepContext.drawImage(
      current,
      cx,
      cy,
      cw,
      ch,
      0,
      0,
      step.width,
      step.height,
    );

    current = step;
    cx = 0;
    cy = 0;
    cw = step.width;
    ch = step.height;
  }

  const output = createCanvas(dw, dh);
  const context = get2d(output);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, output.width, output.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(current, cx, cy, cw, ch, 0, 0, output.width, output.height);

  return output;
}

function solveHomography(source: Point[]): number[] {
  const destination: [number, number][] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];

  const matrix: number[][] = [];

  for (let index = 0; index < 4; index += 1) {
    const [u, v] = destination[index];
    const { x, y } = source[index];

    matrix.push([u, v, 1, 0, 0, 0, -u * x, -v * x, x]);
    matrix.push([0, 0, 0, u, v, 1, -u * y, -v * y, y]);
  }

  for (let column = 0; column < 8; column += 1) {
    let pivotRow = column;

    for (let row = column + 1; row < 8; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivotRow][column])) {
        pivotRow = row;
      }
    }

    if (Math.abs(matrix[pivotRow][column]) < 1e-10) {
      throw new Error(
        "The crop shape is too narrow or unstable. Please adjust the corners.",
      );
    }

    if (pivotRow !== column) {
      [matrix[column], matrix[pivotRow]] = [matrix[pivotRow], matrix[column]];
    }

    const pivot = matrix[column][column];

    for (let cell = column; cell < 9; cell += 1) {
      matrix[column][cell] /= pivot;
    }

    for (let row = 0; row < 8; row += 1) {
      if (row === column) {
        continue;
      }

      const factor = matrix[row][column];

      if (Math.abs(factor) < 1e-12) {
        continue;
      }

      for (let cell = column; cell < 9; cell += 1) {
        matrix[row][cell] -= factor * matrix[column][cell];
      }
    }
  }

  return matrix.map((row) => row[8]);
}

/** Straightens the crop quadrilateral into an `outW × outH` canvas. */
function warpPerspective(
  asset: ImageAsset,
  crop: CropPolygon,
  outW: number,
  outH: number,
): HTMLCanvasElement {
  const { naturalWidth: W, naturalHeight: H } = asset;
  const points = cropPoints(crop);

  const minX = clamp(
    Math.floor(Math.min(...points.map((p) => p.x)) * W) - 1,
    0,
    W - 1,
  );
  const maxX = clamp(
    Math.ceil(Math.max(...points.map((p) => p.x)) * W) + 1,
    minX + 1,
    W,
  );
  const minY = clamp(
    Math.floor(Math.min(...points.map((p) => p.y)) * H) - 1,
    0,
    H - 1,
  );
  const maxY = clamp(
    Math.ceil(Math.max(...points.map((p) => p.y)) * H) + 1,
    minY + 1,
    H,
  );

  const boxW = maxX - minX;
  const boxH = maxY - minY;
  const cropSize = getCropDimensions(crop, W, H);

  // Work at ~2× the output resolution (never more than the memory budget) so
  // bilinear sampling stays smooth instead of aliasing on big photos.
  const scale = Math.min(
    1,
    (outW * 2) / cropSize.width,
    (outH * 2) / cropSize.height,
    Math.sqrt(MAX_WORK_PIXELS / (boxW * boxH)),
  );

  const work = scaleRegionToCanvas(
    asset.image,
    minX,
    minY,
    boxW,
    boxH,
    Math.max(1, Math.round(boxW * scale)),
    Math.max(1, Math.round(boxH * scale)),
  );

  const workW = work.width;
  const workH = work.height;
  const scaleX = workW / boxW;
  const scaleY = workH / boxH;

  const homography = solveHomography(
    points.map((p) => ({
      x: (p.x * W - minX) * scaleX,
      y: (p.y * H - minY) * scaleY,
    })),
  );

  const pixels = get2d(work, true).getImageData(0, 0, workW, workH).data;
  const output = createCanvas(outW, outH);
  const outputContext = get2d(output);
  const outputData = outputContext.createImageData(output.width, output.height);
  const out = outputData.data;

  const [h11, h12, h13, h21, h22, h23, h31, h32] = homography;

  for (let y = 0; y < output.height; y += 1) {
    const v = (y + 0.5) / output.height;

    for (let x = 0; x < output.width; x += 1) {
      const u = (x + 0.5) / output.width;
      const denominator = h31 * u + h32 * v + 1;
      const o = (y * output.width + x) * 4;

      if (Math.abs(denominator) < 1e-10) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 255;
        continue;
      }

      const sx = clamp(
        (h11 * u + h12 * v + h13) / denominator - 0.5,
        0,
        workW - 1,
      );
      const sy = clamp(
        (h21 * u + h22 * v + h23) / denominator - 0.5,
        0,
        workH - 1,
      );

      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(x0 + 1, workW - 1);
      const y1 = Math.min(y0 + 1, workH - 1);
      const fx = sx - x0;
      const fy = sy - y0;

      const i00 = (y0 * workW + x0) * 4;
      const i10 = (y0 * workW + x1) * 4;
      const i01 = (y1 * workW + x0) * 4;
      const i11 = (y1 * workW + x1) * 4;

      const w00 = (1 - fx) * (1 - fy);
      const w10 = fx * (1 - fy);
      const w01 = (1 - fx) * fy;
      const w11 = fx * fy;

      out[o] =
        pixels[i00] * w00 +
        pixels[i10] * w10 +
        pixels[i01] * w01 +
        pixels[i11] * w11;
      out[o + 1] =
        pixels[i00 + 1] * w00 +
        pixels[i10 + 1] * w10 +
        pixels[i01 + 1] * w01 +
        pixels[i11 + 1] * w11;
      out[o + 2] =
        pixels[i00 + 2] * w00 +
        pixels[i10 + 2] * w10 +
        pixels[i01 + 2] * w01 +
        pixels[i11 + 2] * w11;
      out[o + 3] = 255;
    }
  }

  outputContext.putImageData(outputData, 0, 0);
  return output;
}

function getAxisAlignedRect(crop: CropPolygon) {
  const eps = 0.0005;
  const { tl, tr, br, bl } = crop;

  const aligned =
    Math.abs(tl.x - bl.x) < eps &&
    Math.abs(tr.x - br.x) < eps &&
    Math.abs(tl.y - tr.y) < eps &&
    Math.abs(bl.y - br.y) < eps;

  if (!aligned) {
    return null;
  }

  const x0 = (tl.x + bl.x) / 2;
  const x1 = (tr.x + br.x) / 2;
  const y0 = (tl.y + tr.y) / 2;
  const y1 = (bl.y + br.y) / 2;

  return x1 > x0 && y1 > y0 ? { x0, x1, y0, y1 } : null;
}

const croppedCache = new WeakMap<ImageAsset, Map<string, HTMLCanvasElement>>();

/** Crops (and straightens) the asset to `outW × outH`. Cached for previews. */
function getCroppedCanvas(
  asset: ImageAsset,
  outW: number,
  outH: number,
  useCache: boolean,
): HTMLCanvasElement {
  const key = `${outW}x${outH}`;
  const cache = croppedCache.get(asset);
  const hit = useCache ? cache?.get(key) : undefined;

  if (hit) {
    return hit;
  }

  if (!isValidCropPolygon(asset.crop)) {
    throw new Error("Please keep all four crop corners inside the image.");
  }

  const rect = getAxisAlignedRect(asset.crop);
  const canvas = rect
    ? scaleRegionToCanvas(
        asset.image,
        rect.x0 * asset.naturalWidth,
        rect.y0 * asset.naturalHeight,
        (rect.x1 - rect.x0) * asset.naturalWidth,
        (rect.y1 - rect.y0) * asset.naturalHeight,
        outW,
        outH,
      )
    : warpPerspective(asset, asset.crop, outW, outH);

  if (useCache) {
    const store = cache ?? new Map<string, HTMLCanvasElement>();

    if (store.size >= 4) {
      const oldest = store.keys().next().value;
      if (oldest !== undefined) {
        store.delete(oldest);
      }
    }

    store.set(key, canvas);
    croppedCache.set(asset, store);
  }

  return canvas;
}

/** Same maths as CSS `brightness()` followed by `contrast()`, but Safari-safe. */
function buildToneLut(brightness: number, contrast: number) {
  const lut = new Uint8ClampedArray(256);
  const b = brightness / 100;
  const c = contrast / 100;

  for (let value = 0; value < 256; value += 1) {
    lut[value] = (value * b - 127.5) * c + 127.5;
  }

  return lut;
}

function sharpenPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amountPercent: number,
  radius: number,
) {
  const amount = clamp(amountPercent / 100, 0, 1) * 0.85;
  const source = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y += 1) {
    const above = Math.max(0, y - radius);
    const below = Math.min(height - 1, y + radius);

    for (let x = 0; x < width; x += 1) {
      const leftX = Math.max(0, x - radius);
      const rightX = Math.min(width - 1, x + radius);

      const center = (y * width + x) * 4;
      const left = (y * width + leftX) * 4;
      const right = (y * width + rightX) * 4;
      const top = (above * width + x) * 4;
      const bottom = (below * width + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        data[center + channel] =
          source[center + channel] * (1 + amount * 4) -
          amount *
            (source[left + channel] +
              source[right + channel] +
              source[top + channel] +
              source[bottom + channel]);
      }
    }
  }
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(radius, 0);
  context.arcTo(width, 0, width, height, radius);
  context.arcTo(width, height, 0, height, radius);
  context.arcTo(0, height, 0, 0, radius);
  context.arcTo(0, 0, width, 0, radius);
  context.closePath();
}

/**
 * Renders one passport page to a canvas at `pxPerMm`.
 * The bitmap is exactly the size of the picture on paper, so
 * `EXPORT_PX_PER_MM` gives a true 300 DPI image at 100% scale.
 */
function renderPassportCanvas(
  asset: ImageAsset,
  settings: RenderSettings,
  pxPerMm: number,
  useCache: boolean,
): HTMLCanvasElement {
  const content = getContentSizeMm(asset);
  const outW = Math.max(8, Math.round(content.width * pxPerMm));
  const outH = Math.max(8, Math.round(content.height * pxPerMm));

  const cropped = getCroppedCanvas(asset, outW, outH, useCache);

  const adjusted = createCanvas(outW, outH);
  const adjustedContext = get2d(adjusted, true);
  adjustedContext.drawImage(cropped, 0, 0);

  const needsTone = settings.brightness !== 100 || settings.contrast !== 100;

  if (needsTone || settings.sharpening > 0) {
    const imageData = adjustedContext.getImageData(0, 0, outW, outH);

    if (needsTone) {
      const lut = buildToneLut(settings.brightness, settings.contrast);
      const { data } = imageData;

      for (let index = 0; index < data.length; index += 4) {
        data[index] = lut[data[index]];
        data[index + 1] = lut[data[index + 1]];
        data[index + 2] = lut[data[index + 2]];
      }
    }

    if (settings.sharpening > 0) {
      // Keep the physical sharpening radius (~0.17 mm) stable across resolutions.
      const radius = Math.max(1, Math.round(pxPerMm / 6));
      sharpenPixels(imageData.data, outW, outH, settings.sharpening, radius);
    }

    adjustedContext.putImageData(imageData, 0, 0);
  }

  const turns = normalizeRotation(settings.rotation);
  const swapped = turns === 90 || turns === 270;
  const finalCanvas = createCanvas(
    swapped ? outH : outW,
    swapped ? outW : outH,
  );
  const context = get2d(finalCanvas);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (settings.roundedCorners) {
    const radius = Math.min(
      CORNER_RADIUS_MM * pxPerMm,
      finalCanvas.width / 2,
      finalCanvas.height / 2,
    );
    roundedRectPath(context, finalCanvas.width, finalCanvas.height, radius);
    context.clip();
  }

  // Integer-exact quarter-turn matrices avoid the half-pixel blur of rotate().
  if (turns === 90) {
    context.setTransform(0, 1, -1, 0, outH, 0);
  } else if (turns === 180) {
    context.setTransform(-1, 0, 0, -1, outW, outH);
  } else if (turns === 270) {
    context.setTransform(0, -1, 1, 0, 0, outW);
  }

  context.drawImage(adjusted, 0, 0);

  return finalCanvas;
}

/* -------------------------------------------------------------------------- */
/*  Sheet geometry (A4, copies, orientation, layout)                          */
/* -------------------------------------------------------------------------- */

function fitInside(box: Placement, ratio: number): Placement {
  const boxRatio = box.width / box.height;
  const width = ratio > boxRatio ? box.width : box.height * ratio;
  const height = ratio > boxRatio ? box.width / ratio : box.height;

  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  };
}

type GeometryInput = {
  slots: { slot: ImageSlot; ratio: number }[];
  orientation: Orientation;
  layout: Layout;
  position: Position;
  rotation: number;
  copies: number;
};

function getSheetGeometry(input: GeometryInput): SheetGeometry {
  const { slots, layout, position } = input;
  const copies = clamp(Math.round(input.copies), 1, 2);
  const turns = normalizeRotation(input.rotation);
  const swapped = turns === 90 || turns === 270;

  const itemW = swapped ? PASSPORT_HEIGHT_MM : PASSPORT_WIDTH_MM;
  const itemH = swapped ? PASSPORT_WIDTH_MM : PASSPORT_HEIGHT_MM;
  const count = Math.max(1, slots.length);

  const blockW =
    layout === "side-by-side"
      ? itemW * count + ITEM_GAP_MM * (count - 1)
      : itemW;
  const blockH =
    layout === "stacked" ? itemH * count + ITEM_GAP_MM * (count - 1) : itemH;

  const orientations: SheetOrientation[] =
    input.orientation === "auto"
      ? ["portrait", "landscape"]
      : [input.orientation];
  const arrangements: CopyArrangement[] =
    copies > 1 ? ["vertical", "horizontal"] : ["vertical"];

  // Pick the sheet orientation / copy arrangement that needs the least shrinking.
  // Ties keep portrait + vertical, so the result is stable.
  let best: {
    orientation: SheetOrientation;
    arrangement: CopyArrangement;
    scale: number;
  } | null = null;

  for (const orientation of orientations) {
    const sheetW = orientation === "portrait" ? A4_WIDTH_MM : A4_HEIGHT_MM;
    const sheetH = orientation === "portrait" ? A4_HEIGHT_MM : A4_WIDTH_MM;

    for (const arrangement of arrangements) {
      const totalW =
        arrangement === "horizontal"
          ? blockW * copies + COPY_GAP_MM * (copies - 1)
          : blockW;
      const totalH =
        arrangement === "vertical"
          ? blockH * copies + COPY_GAP_MM * (copies - 1)
          : blockH;

      const scale = Math.min(
        1,
        (sheetW - SAFE_MARGIN_MM * 2) / totalW,
        (sheetH - SAFE_MARGIN_MM * 2) / totalH,
      );

      if (!best || scale > best.scale + 1e-6) {
        best = { orientation, arrangement, scale };
      }
    }
  }

  const chosen = best ?? {
    orientation: "portrait" as const,
    arrangement: "vertical" as const,
    scale: 1,
  };
  const sheetWidth =
    chosen.orientation === "portrait" ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const sheetHeight =
    chosen.orientation === "portrait" ? A4_HEIGHT_MM : A4_WIDTH_MM;

  if (!slots.length) {
    return {
      orientation: chosen.orientation,
      sheetWidth,
      sheetHeight,
      scale: 1,
      items: [],
    };
  }

  const scale = chosen.scale;
  const iw = itemW * scale;
  const ih = itemH * scale;
  const gap = ITEM_GAP_MM * scale;
  const copyGap = COPY_GAP_MM * scale;
  const bw = blockW * scale;
  const bh = blockH * scale;

  const totalW =
    chosen.arrangement === "horizontal"
      ? bw * copies + copyGap * (copies - 1)
      : bw;
  const totalH =
    chosen.arrangement === "vertical"
      ? bh * copies + copyGap * (copies - 1)
      : bh;

  const startX = (sheetWidth - totalW) / 2;
  const startY =
    position === "top"
      ? SAFE_MARGIN_MM
      : position === "center"
        ? (sheetHeight - totalH) / 2
        : sheetHeight - totalH - SAFE_MARGIN_MM;

  const items: PlacedItem[] = [];

  for (let copy = 0; copy < copies; copy += 1) {
    const blockX =
      startX +
      (chosen.arrangement === "horizontal" ? copy * (bw + copyGap) : 0);
    const blockY =
      startY + (chosen.arrangement === "vertical" ? copy * (bh + copyGap) : 0);

    slots.forEach(({ slot, ratio }, index) => {
      const box: Placement =
        layout === "side-by-side"
          ? { x: blockX + index * (iw + gap), y: blockY, width: iw, height: ih }
          : {
              x: blockX,
              y: blockY + index * (ih + gap),
              width: iw,
              height: ih,
            };

      items.push({
        slot,
        copy,
        box,
        image: fitInside(box, swapped ? 1 / ratio : ratio),
      });
    });
  }

  return {
    orientation: chosen.orientation,
    sheetWidth,
    sheetHeight,
    scale,
    items,
  };
}

/* -------------------------------------------------------------------------- */
/*  PDF + print                                                               */
/* -------------------------------------------------------------------------- */

async function createPdfDocument(
  geometry: SheetGeometry,
  images: Partial<Record<ImageSlot, ExportImage>>,
) {
  const { default: JsPDF } = await import("jspdf");

  const doc = new JsPDF({
    orientation: geometry.orientation === "portrait" ? "p" : "l",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  doc.setProperties({
    title: "Passport Joiner",
    subject: "Passport page PDF",
    creator: "SohojKaj",
  });

  for (const item of geometry.items) {
    const image = images[item.slot];

    if (!image) {
      continue;
    }

    // The alias lets jsPDF embed each picture once, even with two copies.
    doc.addImage(
      image.dataUrl,
      "JPEG",
      item.image.x,
      item.image.y,
      item.image.width,
      item.image.height,
      `passport-${item.slot}`,
      "NONE",
    );
  }

  return doc;
}

function buildPrintHtml(
  geometry: SheetGeometry,
  images: Partial<Record<ImageSlot, ExportImage>>,
) {
  const tags = geometry.items
    .filter((item) => images[item.slot])
    .map(
      (item) =>
        `<img src="${images[item.slot]?.dataUrl}" alt="${item.slot} passport page" style="left:${item.image.x.toFixed(3)}mm;top:${item.image.y.toFixed(3)}mm;width:${item.image.width.toFixed(3)}mm;height:${item.image.height.toFixed(3)}mm;" />`,
    )
    .join("\n");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Passport Joiner</title>
    <style>
      @page { size: ${geometry.sheetWidth}mm ${geometry.sheetHeight}mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; }
      .sheet { position: relative; width: ${geometry.sheetWidth}mm; height: ${geometry.sheetHeight}mm; overflow: hidden; break-inside: avoid; }
      .sheet img { position: absolute; display: block; }
    </style>
  </head>
  <body>
    <section class="sheet">${tags}</section>
    <script>
      window.addEventListener("load", function () {
        setTimeout(function () { window.focus(); window.print(); }, 250);
      });
    </script>
  </body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                     */
/* -------------------------------------------------------------------------- */

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

type ProcessedResult = { canvas: HTMLCanvasElement | null; failed: boolean };

/** Renders an asset for on-screen use, debounced and cached. */
function useProcessedCanvas(
  asset: ImageAsset | null,
  settings: RenderSettings,
  pxPerMm: number,
): ProcessedResult {
  const debounced = useDebouncedValue(settings, 60);
  const [result, setResult] = useState<ProcessedResult>({
    canvas: null,
    failed: false,
  });

  useEffect(() => {
    if (!asset) {
      setResult({ canvas: null, failed: false });
      return;
    }

    let cancelled = false;

    const frame = window.requestAnimationFrame(() => {
      try {
        const canvas = renderPassportCanvas(asset, debounced, pxPerMm, true);
        if (!cancelled) {
          setResult({ canvas, failed: false });
        }
      } catch {
        if (!cancelled) {
          setResult({ canvas: null, failed: true });
        }
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [asset, debounced, pxPerMm]);

  return result;
}

/* -------------------------------------------------------------------------- */
/*  Small UI building blocks                                                  */
/* -------------------------------------------------------------------------- */

function ProcessedCanvas({
  result,
  label,
  className = "block w-full h-full object-contain select-none",
}: {
  result: ProcessedResult;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { canvas, failed } = result;

  useEffect(() => {
    const element = ref.current;

    if (!element || !canvas) {
      return;
    }

    element.width = canvas.width;
    element.height = canvas.height;
    element.getContext("2d")?.drawImage(canvas, 0, 0);
  }, [canvas]);

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[9px] text-gray-400 text-center p-2">
        Preview unavailable — check the crop.
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <span className="w-4 h-4 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <canvas ref={ref} role="img" aria-label={label} className={className} />
  );
}

type SegmentOption<T> = {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
};

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      className="grid gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          aria-pressed={value === option.value}
          aria-label={option.ariaLabel}
          className={`py-1.5 rounded-lg transition-all flex justify-center items-center gap-1 disabled:opacity-50 ${
            value === option.value
              ? "bg-white text-[#2563EB] shadow-xs border border-gray-100"
              : "text-gray-500 hover:text-[#0F172A]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  unit = "",
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const id = useId();

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold text-gray-600">
        <label htmlFor={id}>{label}</label>
        <span className="bg-[#E2E8F0] text-[#2563EB] px-1 rounded">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB] disabled:opacity-50"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Crop modal                                                                */
/* -------------------------------------------------------------------------- */

type CropModalProps = {
  asset: ImageAsset;
  onClose: () => void;
  onApply: (crop: CropPolygon) => void;
};

function CropModal({ asset, onClose, onApply }: CropModalProps) {
  const [crop, setCrop] = useState<CropPolygon>(() => cloneCrop(asset.crop));
  const [imageBox, setImageBox] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const interactionRef = useRef<{
    action: CropHandle;
    startX: number;
    startY: number;
    startCrop: CropPolygon;
  } | null>(null);

  const updateImageBox = useCallback(() => {
    if (!imageRef.current) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    setImageBox({ width: rect.width, height: rect.height });
  }, []);

  useLayoutEffect(() => {
    updateImageBox();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateImageBox)
        : null;

    if (imageRef.current) {
      observer?.observe(imageRef.current);
    }

    window.addEventListener("resize", updateImageBox);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateImageBox);
    };
  }, [updateImageBox]);

  // Lock page scroll while the editor is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;

      if (!interaction || !imageBox.width || !imageBox.height) {
        return;
      }

      const dx = (event.clientX - interaction.startX) / imageBox.width;
      const dy = (event.clientY - interaction.startY) / imageBox.height;
      const start = interaction.startCrop;
      const candidate = cloneCrop(start);

      switch (interaction.action) {
        case "move":
          setCrop(getSafeCrop(start, moveCrop(start, dx, dy)));
          return;
        case "tl":
        case "tr":
        case "br":
        case "bl":
          candidate[interaction.action] = {
            x: start[interaction.action].x + dx,
            y: start[interaction.action].y + dy,
          };
          break;
        case "top":
          candidate.tl.y = start.tl.y + dy;
          candidate.tr.y = start.tr.y + dy;
          break;
        case "right":
          candidate.tr.x = start.tr.x + dx;
          candidate.br.x = start.br.x + dx;
          break;
        case "bottom":
          candidate.bl.y = start.bl.y + dy;
          candidate.br.y = start.br.y + dy;
          break;
        case "left":
          candidate.tl.x = start.tl.x + dx;
          candidate.bl.x = start.bl.x + dx;
          break;
      }

      setCrop(getSafeCrop(start, candidate));
    };

    const handleUp = () => {
      interactionRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [imageBox.height, imageBox.width]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const beginInteraction = (
    action: CropHandle,
    event: React.PointerEvent<SVGElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    interactionRef.current = {
      action,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: cloneCrop(crop),
    };
  };

  const scalePoint = (point: Point): Point => ({
    x: point.x * imageBox.width,
    y: point.y * imageBox.height,
  });

  const tl = scalePoint(crop.tl);
  const tr = scalePoint(crop.tr);
  const br = scalePoint(crop.br);
  const bl = scalePoint(crop.bl);
  const mid = (a: Point, b: Point): Point => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const cornerHandles: { key: CropHandle; point: Point; cursor: string }[] = [
    { key: "tl", point: tl, cursor: "cursor-nwse-resize" },
    { key: "tr", point: tr, cursor: "cursor-nesw-resize" },
    { key: "br", point: br, cursor: "cursor-nwse-resize" },
    { key: "bl", point: bl, cursor: "cursor-nesw-resize" },
  ];

  const edgeHandles: { key: CropHandle; point: Point; cursor: string }[] = [
    { key: "top", point: mid(tl, tr), cursor: "cursor-ns-resize" },
    { key: "right", point: mid(tr, br), cursor: "cursor-ew-resize" },
    { key: "bottom", point: mid(bl, br), cursor: "cursor-ns-resize" },
    { key: "left", point: mid(tl, bl), cursor: "cursor-ew-resize" },
  ];

  const polygonPoints = `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`;
  const outerPath =
    `M0 0 H${imageBox.width} V${imageBox.height} H0 Z ` +
    `M${tl.x} ${tl.y} L${tr.x} ${tr.y} L${br.x} ${br.y} L${bl.x} ${bl.y} Z`;

  const handleClass =
    "fill-amber-500 stroke-white stroke-2 hover:fill-amber-400 transition-colors";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-3 md:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Free perspective crop editor"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-6xl bg-[#F8FAFC] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E2E8F0]">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Crop & straighten passport page
            </h3>
            <p className="text-[11px] text-gray-500 mt-1">
              Drag any corner or edge freely. Drag inside the selected area to
              move the entire crop. The selected quadrilateral is straightened
              automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-[#0F172A] hover:bg-white transition-colors shrink-0"
            aria-label="Close crop editor"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-[#151515] p-3 md:p-5">
          <div className="min-h-[420px] max-h-[72vh] flex items-center justify-center overflow-auto">
            <div className="relative inline-block max-w-full select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={asset.url}
                alt="Passport crop source"
                draggable={false}
                onLoad={updateImageBox}
                className="block max-w-[88vw] max-h-[68vh] w-auto h-auto select-none"
              />

              {imageBox.width > 0 && imageBox.height > 0 ? (
                <svg
                  className="absolute inset-0 w-full h-full touch-none overflow-visible"
                  viewBox={`0 0 ${imageBox.width} ${imageBox.height}`}
                  preserveAspectRatio="none"
                  aria-label="Passport crop controls"
                >
                  <path
                    d={outerPath}
                    fill="rgba(0,0,0,0.60)"
                    fillRule="evenodd"
                    pointerEvents="none"
                  />

                  <polygon
                    points={polygonPoints}
                    fill="rgba(245,158,11,0.06)"
                    stroke="rgb(251,191,36)"
                    strokeWidth={2.25}
                    vectorEffect="non-scaling-stroke"
                    className="cursor-move"
                    onPointerDown={(event) => beginInteraction("move", event)}
                  />

                  {[
                    [tl, br],
                    [tr, bl],
                  ].map(([a, b], index) => (
                    <line
                      key={index}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="rgba(251,191,36,0.5)"
                      strokeWidth={1}
                      strokeDasharray="6 5"
                      pointerEvents="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}

                  {cornerHandles.map((handle) => (
                    <circle
                      key={handle.key}
                      cx={handle.point.x}
                      cy={handle.point.y}
                      r={8}
                      className={`${handleClass} ${handle.cursor}`}
                      onPointerDown={(event) =>
                        beginInteraction(handle.key, event)
                      }
                    />
                  ))}

                  {edgeHandles.map((handle) => (
                    <circle
                      key={handle.key}
                      cx={handle.point.x}
                      cy={handle.point.y}
                      r={6}
                      className={`${handleClass} ${handle.cursor}`}
                      onPointerDown={(event) =>
                        beginInteraction(handle.key, event)
                      }
                    />
                  ))}

                  <text
                    x={(tl.x + tr.x + br.x + bl.x) / 4}
                    y={(tl.y + tr.y + br.y + bl.y) / 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.92)"
                    fontSize="12"
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    Drag inside to move
                  </text>
                </svg>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-[#E2E8F0]">
          <div className="flex flex-col gap-1 text-[10px] text-gray-500">
            <div className="flex items-center gap-2">
              <GripVertical size={13} className="text-[#2563EB]" />
              <span>
                Corner handles move independently; edge handles move two corners
                together.
              </span>
            </div>
            <span className="text-gray-400 pl-5">
              The crop ratio is free — the page is fitted inside the 88×125 mm
              slot without stretching.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCrop(getDefaultCrop(asset.naturalWidth, asset.naturalHeight))
              }
              className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-[#0F172A] hover:bg-white transition-colors"
            >
              Reset crop
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-[#0F172A] hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(getSafeCrop(crop, crop))}
              className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5"
            >
              <Check size={14} />
              Apply crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Upload slot                                                               */
/* -------------------------------------------------------------------------- */

type UploadSlotProps = {
  slot: ImageSlot;
  label: string;
  asset: ImageAsset | null;
  settings: RenderSettings;
  onUpload: (slot: ImageSlot, files: FileList | null) => void;
  onCrop: (slot: ImageSlot) => void;
  onRemove: (slot: ImageSlot) => void;
};

function UploadSlot({
  slot,
  label,
  asset,
  settings,
  onUpload,
  onCrop,
  onRemove,
}: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const thumbSettings = useMemo<RenderSettings>(
    () => ({ ...settings, sharpening: 0 }),
    [settings],
  );
  const thumbnail = useProcessedCanvas(asset, thumbSettings, THUMB_PX_PER_MM);

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      className={`relative w-full border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[220px] transition-all overflow-hidden ${
        isDragging
          ? "border-[#1D4ED8] bg-[#E2E8F0]/60"
          : "border-[#2563EB] bg-[#F8FAFC]/30 hover:bg-[#F8FAFC]/60"
      } ${asset ? "" : "cursor-pointer"}`}
      onClick={asset ? undefined : openPicker}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        onUpload(slot, event.dataTransfer.files);
      }}
      role={asset ? undefined : "button"}
      tabIndex={asset ? undefined : 0}
      aria-label={asset ? undefined : `Upload ${label}`}
      onKeyDown={
        asset
          ? undefined
          : (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPicker();
              }
            }
      }
    >
      {asset ? (
        <>
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center p-4 pb-16">
            <div className="relative aspect-[88/125] h-[150px] rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
              <ProcessedCanvas result={thumbnail} label={`${label} preview`} />
            </div>
          </div>

          <div className="absolute inset-x-2 bottom-2 z-10 bg-white/95 backdrop-blur rounded-xl border border-gray-200 px-2.5 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <p className="text-[10px] font-bold text-[#0F172A] truncate">
                  {asset.file.name}
                </p>
                <p className="text-[9px] text-gray-400">
                  {asset.naturalWidth} × {asset.naturalHeight} px
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={openPicker}
                  className="p-1.5 rounded-lg bg-[#F8FAFC] text-[#2563EB] hover:bg-[#E2E8F0] transition-colors"
                  title="Replace image"
                  aria-label={`Replace ${label}`}
                >
                  <Upload size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onCrop(slot)}
                  className="p-1.5 rounded-lg bg-[#F8FAFC] text-[#2563EB] hover:bg-[#E2E8F0] transition-colors"
                  title="Crop image"
                  aria-label={`Crop ${label}`}
                >
                  <Crop size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(slot)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  title="Remove image"
                  aria-label={`Remove ${label}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-10 h-10 bg-[#E2E8F0] text-[#2563EB] rounded-full flex items-center justify-center mb-2">
            <Upload size={18} />
          </div>
          <span className="text-xs font-bold text-[#0F172A]">{label}</span>
          <span className="text-[9px] text-gray-400 mt-0.5">
            Click or drop an image here
          </span>
          <span className="text-[8px] bg-[#E2E8F0] text-[#2563EB] font-bold px-1.5 py-0.5 rounded mt-2">
            JPG • PNG • WEBP • HEIC
          </span>
          <span className="text-[8px] text-gray-400 mt-1">Maximum 20 MB</span>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        onChange={(event) => {
          onUpload(slot, event.target.files);
          event.currentTarget.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const RELATED_TOOLS = [
  {
    href: `${TOOLS_BASE}/image-size-reducer`,
    title: "Image Size Reducer",
    text: "Shrink JPG, PNG, and WebP photos in your browser — quality stays sharp.",
    icon: ImageIcon,
  },
  {
    href: `${TOOLS_BASE}/nid-joiner`,
    title: "NID Joiner",
    text: "Turn NID card front and back photos into a clean A4 PDF — all in your browser.",
    icon: CreditCard,
  },
  {
    href: `${TOOLS_BASE}/remove-background`,
    title: "Remove Background",
    text: "Erase portrait, product, or logo backgrounds in your browser — download a transparent PNG.",
    icon: Scissors,
  },
];

const ZOOM_MIN = 50;
const ZOOM_MAX = 300;
const ZOOM_STEP = 25;

export default function PassportToPdf() {
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [layout, setLayout] = useState<Layout>("stacked");
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<Position>("top");
  const [copies, setCopies] = useState<number>(1);
  const [roundedCorners, setRoundedCorners] = useState(false);

  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [sharpening, setSharpening] = useState<number>(50);

  const [assets, setAssets] = useState<Record<ImageSlot, ImageAsset | null>>({
    front: null,
    back: null,
  });
  const assetsRef = useRef(assets);
  const uploadTokens = useRef<Record<ImageSlot, number>>({ front: 0, back: 0 });

  const [cropTarget, setCropTarget] = useState<ImageSlot | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const previewPanelRef = useRef<HTMLDivElement | null>(null);

  const isProcessing = pendingUploads > 0 || isExporting;
  const hasImages = Boolean(assets.front || assets.back);

  /* ---- notices, favorites ---- */

  const showNotice = useCallback((type: Notice["type"], message: string) => {
    setNotice({ type, message });
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    try {
      setIsFavorite(window.localStorage.getItem(FAVORITE_KEY) === "1");
    } catch {
      setIsFavorite(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreen = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener("fullscreenchange", handleFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  /* ---- asset management (object-URL lifecycle lives here, not in updaters) ---- */

  const setSlotAsset = useCallback(
    (slot: ImageSlot, next: ImageAsset | null) => {
      const previous = assetsRef.current[slot];
      const updated = { ...assetsRef.current, [slot]: next };

      assetsRef.current = updated;
      setAssets(updated);

      if (previous && previous.url !== next?.url) {
        URL.revokeObjectURL(previous.url);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      SLOTS.forEach((slot) => {
        const asset = assetsRef.current[slot];
        if (asset) {
          URL.revokeObjectURL(asset.url);
        }
      });
    };
  }, []);

  const replaceImage = useCallback(
    async (slot: ImageSlot, file: File) => {
      const token = (uploadTokens.current[slot] += 1);
      setPendingUploads((count) => count + 1);

      try {
        const asset = await createImageAsset(file);

        // A newer upload or a removal happened while this one was decoding.
        if (token !== uploadTokens.current[slot]) {
          URL.revokeObjectURL(asset.url);
          return;
        }

        setSlotAsset(slot, asset);
        setCropTarget(null);
        showNotice(
          "success",
          `${slot === "front" ? "Front" : "Back"} passport image added.`,
        );
      } catch (error) {
        if (token === uploadTokens.current[slot]) {
          showNotice(
            "error",
            error instanceof Error
              ? error.message
              : "The image could not be uploaded.",
          );
        }
      } finally {
        setPendingUploads((count) => count - 1);
      }
    },
    [setSlotAsset, showNotice],
  );

  const handleUpload = useCallback(
    (slot: ImageSlot, files: FileList | null) => {
      const list = Array.from(files ?? []);

      if (!list.length) {
        return;
      }

      void replaceImage(slot, list[0]);

      // Dropping two photos at once fills the other side too.
      if (list[1]) {
        void replaceImage(slot === "front" ? "back" : "front", list[1]);
      }
    },
    [replaceImage],
  );

  const handleRemove = useCallback(
    (slot: ImageSlot) => {
      uploadTokens.current[slot] += 1;
      setSlotAsset(slot, null);
      setCropTarget(null);
    },
    [setSlotAsset],
  );

  const handleApplyCrop = (crop: CropPolygon) => {
    if (!cropTarget) {
      return;
    }

    const current = assetsRef.current[cropTarget];

    if (current) {
      setSlotAsset(cropTarget, { ...current, crop });
    }

    setCropTarget(null);
    showNotice("success", "Crop applied.");
  };

  const resetAll = () => {
    SLOTS.forEach((slot) => {
      uploadTokens.current[slot] += 1;
      setSlotAsset(slot, null);
    });

    setOrientation("auto");
    setLayout("stacked");
    setRotation(0);
    setPosition("top");
    setCopies(1);
    setRoundedCorners(false);
    setBrightness(100);
    setContrast(100);
    setSharpening(50);
    setZoom(100);
    setCropTarget(null);
    showNotice("info", "Passport Joiner settings have been reset.");
  };

  /* ---- derived render data ---- */

  const settings = useMemo<RenderSettings>(
    () => ({ brightness, contrast, sharpening, rotation, roundedCorners }),
    [brightness, contrast, sharpening, rotation, roundedCorners],
  );

  const slotInputs = useMemo(
    () =>
      SLOTS.flatMap((slot) => {
        const asset = assets[slot];
        return asset ? [{ slot, ratio: getCropRatio(asset) }] : [];
      }),
    [assets],
  );

  const geometry = useMemo(
    () =>
      getSheetGeometry({
        slots: slotInputs,
        orientation,
        layout,
        position,
        rotation,
        copies,
      }),
    [slotInputs, orientation, layout, position, rotation, copies],
  );

  const frontPreview = useProcessedCanvas(
    assets.front,
    settings,
    PREVIEW_PX_PER_MM,
  );
  const backPreview = useProcessedCanvas(
    assets.back,
    settings,
    PREVIEW_PX_PER_MM,
  );
  const previews: Record<ImageSlot, ProcessedResult> = {
    front: frontPreview,
    back: backPreview,
  };

  const selectedCropAsset = cropTarget ? assets[cropTarget] : null;
  const scalePercent = Math.round(geometry.scale * 100);

  /* ---- export ---- */

  const buildExportImages = async () => {
    const images: Partial<Record<ImageSlot, ExportImage>> = {};

    for (const slot of SLOTS) {
      const asset = assetsRef.current[slot];

      if (!asset) {
        continue;
      }

      await nextFrame(); // let the spinner paint between heavy renders

      const canvas = renderPassportCanvas(
        asset,
        settings,
        EXPORT_PX_PER_MM,
        false,
      );
      images[slot] = {
        dataUrl: canvas.toDataURL("image/jpeg", 0.95),
        width: canvas.width,
        height: canvas.height,
      };
    }

    return images;
  };

  const createPdf = async () => {
    if (!hasImages) {
      showNotice(
        "error",
        "Upload at least one passport page before creating the PDF.",
      );
      return;
    }

    setIsExporting(true);

    try {
      await nextFrame();
      const images = await buildExportImages();
      const doc = await createPdfDocument(geometry, images);

      doc.save("passport-joiner.pdf");
      showNotice("success", "PDF created — A4, 300 DPI.");
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the PDF.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (!hasImages) {
      showNotice("error", "Upload at least one passport page before printing.");
      return;
    }

    // Open synchronously (inside the click) so pop-up blockers allow it.
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      showNotice("error", "Please allow pop-ups for this site to print.");
      return;
    }

    setIsExporting(true);

    try {
      await nextFrame();
      const images = await buildExportImages();

      printWindow.document.open();
      printWindow.document.write(buildPrintHtml(geometry, images));
      printWindow.document.close();

      showNotice(
        "success",
        "Print dialog opened — choose 'Actual size' / 100%.",
      );
    } catch (error) {
      printWindow.close();
      showNotice(
        "error",
        error instanceof Error
          ? error.message
          : "Something went wrong while preparing the print layout.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  /* ---- page chrome ---- */

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);

    try {
      window.localStorage.setItem(FAVORITE_KEY, next ? "1" : "0");
    } catch {
      // Ignore storage errors (private mode, blocked storage).
    }

    showNotice(
      "success",
      next ? "Added to your favorites." : "Removed from your favorites.",
    );
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Passport Joiner",
          text: "Create a clean A4 passport PDF directly in the browser.",
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      showNotice("success", "Page link copied to clipboard.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return; // user closed the share sheet
      }
      showNotice("info", "Sharing isn't available in this browser.");
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await previewPanelRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      showNotice("info", "Fullscreen mode is not available in this browser.");
    }
  };

  const sheetBase = isFullscreen ? "760px" : "510px";
  const sheetStyle: React.CSSProperties = {
    width: `calc(min(100%, ${sheetBase}) * ${zoom / 100})`,
    aspectRatio: `${geometry.sheetWidth} / ${geometry.sheetHeight}`,
  };

  const zoomIconButton =
    "hover:text-[#0F172A] disabled:opacity-40 transition-colors";

  return (
    <div className="w-full space-y-5 text-[#0F172A] font-sans">
      {notice ? (
        <div
          className={`fixed right-5 top-5 z-[120] max-w-sm rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${
            notice.type === "error"
              ? "bg-red-50/95 border-red-200 text-red-700"
              : notice.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-700"
                : "bg-white/95 border-gray-200 text-[#0F172A]"
          }`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          <div className="flex items-start gap-2">
            {notice.type === "error" ? (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            ) : notice.type === "success" ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <Download size={16} className="mt-0.5 shrink-0" />
            )}
            <p className="text-xs font-semibold leading-5">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-1 opacity-60 hover:opacity-100"
              aria-label="Close notification"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href={TOOLS_BASE}
          className="flex items-center gap-1 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Sohoj Tools</span>
        </Link>
        <span>/</span>
        <span>Image Tools</span>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">Passport Joiner</span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#F8FAFC] text-[#2563EB] rounded-xl flex items-center justify-center shrink-0 border border-[#E2E8F0]">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]">
                Passport Joiner
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Turn passport front and back page photos into a clean A4 PDF —
              ICAO 88×125 mm layout, all in your browser.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleFavorite}
            className={`p-2 rounded-xl transition-all border ${
              isFavorite
                ? "text-[#2563EB] bg-[#F8FAFC] border-[#E2E8F0]"
                : "text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-100"
            }`}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={isFavorite}
          >
            <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
            aria-label="Share this tool"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ------------------------------ Settings ------------------------------ */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4 max-h-[750px] overflow-y-auto">
          <h2 className="text-xs font-bold text-[#0F172A] border-b border-gray-100 pb-2">
            Settings
          </h2>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-600 block">
              Page orientation
            </span>
            <Segmented<Orientation>
              value={orientation}
              onChange={setOrientation}
              disabled={isProcessing}
              options={[
                { value: "auto", label: "Auto" },
                {
                  value: "portrait",
                  label: (
                    <>
                      <span className="w-3 h-4 border-2 border-current rounded-xs" />
                      <span>Portrait</span>
                    </>
                  ),
                },
                {
                  value: "landscape",
                  label: (
                    <>
                      <span className="w-4 h-3 border-2 border-current rounded-xs" />
                      <span>Landscape</span>
                    </>
                  ),
                },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
              <span>Layout</span>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  setLayout((previous) =>
                    previous === "stacked" ? "side-by-side" : "stacked",
                  )
                }
                className="text-[10px] text-[#2563EB] font-bold hover:underline disabled:opacity-50"
              >
                Switch
              </button>
            </div>
            <Segmented<Layout>
              value={layout}
              onChange={setLayout}
              disabled={isProcessing}
              options={[
                {
                  value: "side-by-side",
                  ariaLabel: "Side by side",
                  label: (
                    <span className="flex gap-0.5 py-0.5">
                      <span className="w-3 h-4 bg-[#2563EB] rounded-xs" />
                      <span className="w-3 h-4 bg-[#2563EB] rounded-xs" />
                    </span>
                  ),
                },
                {
                  value: "stacked",
                  ariaLabel: "Stacked",
                  label: (
                    <span className="flex flex-col gap-0.5 py-0.5">
                      <span className="w-5 h-2 bg-[#2563EB] rounded-xs" />
                      <span className="w-5 h-2 bg-[#2563EB] rounded-xs" />
                    </span>
                  ),
                },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
              <span>Rotate</span>
              <button
                type="button"
                onClick={() => setRotation((previous) => (previous + 90) % 360)}
                disabled={isProcessing}
                className="text-[10px] text-[#2563EB] font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <RotateCw size={10} />
                Rotate 90°
              </button>
            </div>
            <Segmented<number>
              value={rotation}
              onChange={setRotation}
              disabled={isProcessing}
              options={[0, 90, 180, 270].map((deg) => ({
                value: deg,
                label: `${deg}°`,
              }))}
            />
            <p className="text-[10px] text-gray-400">
              Both pages rotate together.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-600 block">
              Position on page
            </span>
            <Segmented<Position>
              value={position}
              onChange={setPosition}
              disabled={isProcessing}
              options={[
                { value: "top", label: "Top" },
                { value: "center", label: "Center" },
                { value: "bottom", label: "Bottom" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-600 block">
              Copies
            </span>
            <Segmented<number>
              value={copies}
              onChange={setCopies}
              disabled={isProcessing}
              options={[
                { value: 1, label: "1" },
                { value: 2, label: "2" },
              ]}
            />
            <p className="text-[10px] text-gray-400">
              Two copies are placed on the same A4 sheet, at actual size when
              they fit.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">
                Rounded corners (14px)
              </span>
              <span className="text-[10px] text-gray-400 block">
                Round the corners of each page image
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={roundedCorners}
              aria-label="Rounded corners"
              onClick={() => setRoundedCorners((value) => !value)}
              disabled={isProcessing}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center disabled:opacity-50 ${
                roundedCorners
                  ? "bg-[#2563EB] justify-end"
                  : "bg-gray-300 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#0F172A]">
                Adjustments
              </span>
              <button
                type="button"
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSharpening(50);
                }}
                disabled={isProcessing}
                className="text-[10px] text-[#2563EB] font-bold hover:underline disabled:opacity-50"
              >
                Reset
              </button>
            </div>

            <SliderRow
              label="Brightness"
              value={brightness}
              min={50}
              max={150}
              unit="%"
              onChange={setBrightness}
              disabled={isProcessing}
            />
            <SliderRow
              label="Contrast"
              value={contrast}
              min={50}
              max={150}
              unit="%"
              onChange={setContrast}
              disabled={isProcessing}
            />
            <SliderRow
              label="Sharpening"
              value={sharpening}
              min={0}
              max={100}
              onChange={setSharpening}
              disabled={isProcessing}
            />
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1 text-[11px] font-bold text-gray-500">
            <div className="flex items-center justify-between">
              <span>
                A4{" "}
                {geometry.orientation === "portrait" ? "Portrait" : "Landscape"}
              </span>
              <span>
                {copies} copy{copies === 1 ? "" : "ies"} · 1 sheet
              </span>
            </div>
            {hasImages ? (
              <p
                className={`text-[10px] font-medium ${
                  scalePercent < 100 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {scalePercent < 100
                  ? `Scaled to ${scalePercent}% to fit the sheet — not actual size.`
                  : "Actual size: each page is 88×125 mm."}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void handlePrint()}
            disabled={!hasImages || isProcessing}
            className={`w-full py-2.5 border text-xs font-bold rounded-xl hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-1.5 ${
              hasImages && !isProcessing
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
            }`}
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>

        {/* ------------------------------ Preview ------------------------------- */}
        <div
          ref={previewPanelRef}
          className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col [&:fullscreen]:overflow-auto [&:fullscreen]:rounded-none [&:fullscreen]:bg-white"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-[#0F172A]">Live preview</h2>
              <span className="text-[10px] text-gray-400 font-medium">
                A4 —{" "}
                {geometry.orientation === "portrait"
                  ? "794×1123 px"
                  : "1123×794 px"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
              <button
                type="button"
                onClick={() =>
                  setZoom((value) =>
                    clamp(value - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX),
                  )
                }
                disabled={zoom <= ZOOM_MIN}
                className={zoomIconButton}
                aria-label="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="min-w-9 text-center tabular-nums">{zoom}%</span>
              <button
                type="button"
                onClick={() =>
                  setZoom((value) =>
                    clamp(value + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX),
                  )
                }
                disabled={zoom >= ZOOM_MAX}
                className={zoomIconButton}
                aria-label="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                disabled={zoom === 100}
                className={`text-[10px] ${zoomIconButton}`}
                title="Reset zoom to 100%"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setRotation((previous) => (previous + 90) % 360)}
                disabled={isProcessing}
                className={zoomIconButton}
                aria-label="Rotate both passport pages"
              >
                <RotateCw size={14} />
              </button>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className={zoomIconButton}
                aria-label="Toggle fullscreen preview"
              >
                {isFullscreen ? (
                  <Minimize2 size={14} />
                ) : (
                  <Maximize2 size={14} />
                )}
              </button>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-4 md:p-6 my-4 flex-1 min-h-[580px] overflow-auto">
            <div
              className="relative mx-auto bg-white shadow-md ring-1 ring-gray-200 transition-[width] duration-150"
              style={sheetStyle}
            >
              {geometry.items.map((item) => (
                <div
                  key={`${item.slot}-${item.copy}`}
                  className="absolute"
                  style={{
                    left: `${(item.image.x / geometry.sheetWidth) * 100}%`,
                    top: `${(item.image.y / geometry.sheetHeight) * 100}%`,
                    width: `${(item.image.width / geometry.sheetWidth) * 100}%`,
                    height: `${(item.image.height / geometry.sheetHeight) * 100}%`,
                  }}
                >
                  <ProcessedCanvas
                    result={previews[item.slot]}
                    label={`${item.slot === "front" ? "Front" : "Back"} passport page, copy ${item.copy + 1}`}
                  />
                </div>
              ))}

              {hasImages ? null : (
                <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-[#F8FAFC] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
                      <Upload size={21} />
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      Upload your passport page
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] mx-auto">
                      Add the front and back page photos from the controls
                      below.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <UploadSlot
            slot="front"
            label="Front passport page"
            asset={assets.front}
            settings={settings}
            onUpload={handleUpload}
            onCrop={setCropTarget}
            onRemove={handleRemove}
          />
          <UploadSlot
            slot="back"
            label="Back passport page"
            asset={assets.back}
            settings={settings}
            onUpload={handleUpload}
            onCrop={setCropTarget}
            onRemove={handleRemove}
          />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              hasImages ? "bg-emerald-500" : "bg-[#2563EB]"
            }`}
          />
          <span>
            {hasImages
              ? "Images ready — review the crop and create your PDF."
              : "Upload front and back page photos to get started."}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetAll}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-200 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void createPdf()}
            disabled={!hasImages || isProcessing}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              hasImages && !isProcessing
                ? "bg-[#2563EB] text-white shadow-xs hover:bg-[#1D4ED8]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isExporting ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Create PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RELATED_TOOLS.map(({ href, title, text, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group"
            >
              <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
                <Icon size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  {title}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                  {text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {selectedCropAsset ? (
        <CropModal
          key={selectedCropAsset.url}
          asset={selectedCropAsset}
          onClose={() => setCropTarget(null)}
          onApply={handleApplyCrop}
        />
      ) : null}
    </div>
  );
}
