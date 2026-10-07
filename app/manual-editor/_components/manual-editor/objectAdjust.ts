/*
 * Client-side "Object Adjust" renderer built on fabric.js (v6+).
 *
 * The selection mask (face / skin / hair / shadow) limits where the
 * brightness, contrast, colour (saturation + hue) and shadow-lift filters
 * apply:
 *
 *   layer 1  original photo with the selection punched out
 *   layer 2  fabric-filtered photo, clipped to the selection
 *
 * Both layers are weighted by the same soft mask, so the sum is exactly
 *   original * (1 - mask) + adjusted * mask
 * and the photo's own transparency (e.g. after background removal) is kept.
 */

import type { FabricImage } from "fabric";
import type { ObjectTab } from "./types";
import { clamp, createCanvas, get2d, releaseCanvas } from "./canvasUtils";

export type ObjectAdjustParams = {
  target: ObjectTab;
  /** 0..200, 100 = unchanged */
  brightness: number;
  /** 0..200, 100 = unchanged */
  contrast: number;
  /** 0..200, 100 = unchanged */
  saturation: number;
  /** -180..180 degrees, 0 = unchanged */
  hue: number;
  /** 0..100, only used by the shadow target */
  shadowStrength: number;
};

export type RenderObjectAdjustOptions = {
  source: HTMLImageElement | HTMLCanvasElement;
  /** White image whose alpha channel is the selection strength. */
  mask: HTMLImageElement | HTMLCanvasElement;
  width: number;
  height: number;
  params: ObjectAdjustParams;
};

type FabricModule = typeof import("fabric");

let fabricPromise: Promise<FabricModule> | null = null;

/** fabric touches `window`, so it is only ever imported in the browser. */
function loadFabric() {
  if (!fabricPromise) {
    fabricPromise = import("fabric").catch((error: unknown) => {
      fabricPromise = null;
      throw error;
    });
  }

  return fabricPromise;
}

/* Keeps the old Face / Skin / Hair feel: skin is treated gently, hair a bit
 * more strongly. */
const TARGET_STRENGTH: Record<ObjectTab, number> = {
  face: 0.95,
  skin: 0.9,
  hair: 1.1,
  shadow: 1,
};

function buildFilters(fabric: FabricModule, params: ObjectAdjustParams) {
  const { filters } = fabric;

  const list: FabricImage["filters"] = [];

  if (params.target === "shadow") {
    const lift = clamp(params.shadowStrength / 100, 0, 1);

    if (lift > 0) {
      const gamma = 1 + 0.45 * lift;

      list.push(new filters.Gamma({ gamma: [gamma, gamma, gamma] }));
      list.push(new filters.Brightness({ brightness: 0.04 * lift }));
    }

    return list;
  }

  const strength = TARGET_STRENGTH[params.target];

  const brightness = clamp(
    ((params.brightness - 100) / 100) * 0.4 * strength,
    -1,
    1,
  );

  const contrast = clamp(((params.contrast - 100) / 100) * 0.5, -1, 1);

  const saturation = clamp((params.saturation - 100) / 100, -1, 1);

  const hue = clamp(params.hue / 180, -1, 1);

  if (brightness !== 0) {
    list.push(new filters.Brightness({ brightness }));
  }

  if (contrast !== 0) {
    list.push(new filters.Contrast({ contrast }));
  }

  if (saturation !== 0) {
    list.push(new filters.Saturation({ saturation }));
  }

  if (hue !== 0) {
    list.push(new filters.HueRotation({ rotation: hue }));
  }

  return list;
}

export function isObjectAdjustNeutral(params: ObjectAdjustParams) {
  if (params.target === "shadow") {
    return params.shadowStrength <= 0;
  }

  return (
    params.brightness === 100 &&
    params.contrast === 100 &&
    params.saturation === 100 &&
    params.hue === 0
  );
}

function drawScaled(
  source: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
) {
  const canvas = createCanvas(width, height);

  get2d(canvas).drawImage(source, 0, 0, width, height);

  return canvas;
}

/**
 * Returns a new canvas (width x height) with the adjustment applied only
 * where the mask selects. The caller owns the returned canvas.
 *
 * fabric.js is used for the colour filters (FabricImage + filters). The
 * final mask compositing uses plain 2D canvas operations so every layer is
 * guaranteed to be exactly width x height and pixel-aligned.
 */
export async function renderObjectAdjust({
  source,
  mask,
  width,
  height,
  params,
}: RenderObjectAdjustOptions): Promise<HTMLCanvasElement> {
  const fabric = await loadFabric();

  const { FabricImage } = fabric;

  const output = drawScaled(source, width, height);

  const filterList = buildFilters(fabric, params);

  // Nothing to change: return the plain photo.
  if (filterList.length === 0) {
    return output;
  }

  /* ---- 1. selection mask at output size -------------------------- */
  const maskCanvas = drawScaled(mask, width, height);

  /* ---- 2. fully filtered copy of the photo (fabric filters) ------- */
  const filterInput = drawScaled(source, width, height);

  const filteredImage = new FabricImage(filterInput);

  filteredImage.filters = filterList;
  filteredImage.applyFilters();

  const filteredElement = filteredImage.getElement() as
    | HTMLImageElement
    | HTMLCanvasElement;

  // Always copy into a canvas we fully control (exact size, no scaling).
  const adjustedCanvas = drawScaled(filteredElement, width, height);

  releaseCanvas(filterInput);

  /* ---- 3. clip the adjusted copy to the selection ----------------- */
  const adjustedCtx = get2d(adjustedCanvas);

  adjustedCtx.globalCompositeOperation = "destination-in";
  adjustedCtx.drawImage(maskCanvas, 0, 0, width, height);
  adjustedCtx.globalCompositeOperation = "source-over";

  /* ---- 4. punch the selection out of the original ----------------- */
  const outputCtx = get2d(output);

  outputCtx.globalCompositeOperation = "destination-out";
  outputCtx.drawImage(maskCanvas, 0, 0, width, height);

  /* ---- 5. add the adjusted selection back ------------------------- */
  // "lighter" adds premultiplied pixels:
  //   original * (1 - mask) + adjusted * mask
  outputCtx.globalCompositeOperation = "lighter";
  outputCtx.drawImage(adjustedCanvas, 0, 0, width, height);
  outputCtx.globalCompositeOperation = "source-over";

  releaseCanvas(maskCanvas);
  releaseCanvas(adjustedCanvas);

  return output;
}
