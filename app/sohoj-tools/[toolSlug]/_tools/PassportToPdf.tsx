/* eslint-disable react/no-unescaped-entities */
"use client";

import React, {
  useCallback,
  useEffect,
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
  Printer,
  Upload,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  Crop,
  Trash2,
  Check,
  X,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";

type Orientation = "auto" | "portrait" | "landscape";
type Layout = "stacked" | "side-by-side";
type Position = "top" | "center" | "bottom";
type ImageSlot = "front" | "back";

type Point = {
  x: number;
  y: number;
};

type CropPolygon = {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
};

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
  url: string;
  naturalWidth: number;
  naturalHeight: number;
  crop: CropPolygon;
};

type Notice = {
  type: "success" | "error" | "info";
  message: string;
};

type SheetOrientation = "portrait" | "landscape";

type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SheetGeometry = {
  orientation: SheetOrientation;
  sheetWidth: number;
  sheetHeight: number;
  itemWidth: number;
  itemHeight: number;
  front: Placement | null;
  back: Placement | null;
};

const PASSPORT_WIDTH_MM = 88;
const PASSPORT_HEIGHT_MM = 125;
const GAP_MM = 4;
const SAFE_MARGIN_MM = 10;
const TARGET_RATIO = PASSPORT_WIDTH_MM / PASSPORT_HEIGHT_MM;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const OUTPUT_PX_PER_MM = 300 / 25.4;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultCrop(imageWidth: number, imageHeight: number): CropPolygon {
  const imageRatio = imageWidth / imageHeight;

  if (imageRatio > TARGET_RATIO) {
    const width = imageHeight * TARGET_RATIO;
    const x = (imageWidth - width) / 2 / imageWidth;

    return {
      tl: { x, y: 0 },
      tr: { x: x + width / imageWidth, y: 0 },
      br: { x: x + width / imageWidth, y: 1 },
      bl: { x, y: 1 },
    };
  }

  const height = imageWidth / TARGET_RATIO;
  const y = (imageHeight - height) / 2 / imageHeight;

  return {
    tl: { x: 0, y },
    tr: { x: 1, y },
    br: { x: 1, y: y + height / imageHeight },
    bl: { x: 0, y: y + height / imageHeight },
  };
}

function clampPoint(point: Point): Point {
  return {
    x: clamp(point.x, 0, 1),
    y: clamp(point.y, 0, 1),
  };
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

function getSafeCrop(start: CropPolygon, candidate: CropPolygon): CropPolygon {
  const bounded = {
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
    const test: CropPolygon = {
      tl: {
        x: start.tl.x + (bounded.tl.x - start.tl.x) * middle,
        y: start.tl.y + (bounded.tl.y - start.tl.y) * middle,
      },
      tr: {
        x: start.tr.x + (bounded.tr.x - start.tr.x) * middle,
        y: start.tr.y + (bounded.tr.y - start.tr.y) * middle,
      },
      br: {
        x: start.br.x + (bounded.br.x - start.br.x) * middle,
        y: start.br.y + (bounded.br.y - start.br.y) * middle,
      },
      bl: {
        x: start.bl.x + (bounded.bl.x - start.bl.x) * middle,
        y: start.bl.y + (bounded.bl.y - start.bl.y) * middle,
      },
    };

    if (isValidCropPolygon(test)) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return low === 0
    ? cloneCrop(start)
    : {
        tl: {
          x: start.tl.x + (bounded.tl.x - start.tl.x) * low,
          y: start.tl.y + (bounded.tl.y - start.tl.y) * low,
        },
        tr: {
          x: start.tr.x + (bounded.tr.x - start.tr.x) * low,
          y: start.tr.y + (bounded.tr.y - start.tr.y) * low,
        },
        br: {
          x: start.br.x + (bounded.br.x - start.br.x) * low,
          y: start.br.y + (bounded.br.y - start.br.y) * low,
        },
        bl: {
          x: start.bl.x + (bounded.bl.x - start.bl.x) * low,
          y: start.bl.y + (bounded.bl.y - start.bl.y) * low,
        },
      };
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

function readImageDimensions(url: string): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(
          new Error("The selected file does not contain a readable image."),
        );
        return;
      }

      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      reject(
        new Error(
          "This image could not be decoded by the browser. HEIC/HEIF files may need to be converted to JPG or PNG first.",
        ),
      );
    };

    image.src = url;
  });
}

async function createImageAsset(file: File): Promise<ImageAsset> {
  if (
    !file.type.startsWith("image/") &&
    !/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name)
  ) {
    throw new Error(
      "Please choose a JPG, PNG, WebP, GIF, BMP, HEIC, or HEIF image.",
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image size must be 20 MB or smaller.");
  }

  const url = URL.createObjectURL(file);

  try {
    const { width, height } = await readImageDimensions(url);

    if (width < 240 || height < 240) {
      URL.revokeObjectURL(url);
      throw new Error(
        "Please upload a higher-resolution image (at least 240 × 240 px).",
      );
    }

    return {
      file,
      url,
      naturalWidth: width,
      naturalHeight: height,
      crop: getDefaultCrop(width, height),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function applySharpening(
  imageData: ImageData,
  amountPercent: number,
): ImageData {
  if (amountPercent <= 0) {
    return imageData;
  }

  const amount = clamp(amountPercent / 100, 0, 1) * 0.85;
  const { width, height, data } = imageData;
  const source = new Uint8ClampedArray(data);
  const index = (x: number, y: number) => (y * width + x) * 4;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const center = index(x, y);
      const left = index(x - 1, y);
      const right = index(x + 1, y);
      const top = index(x, y - 1);
      const bottom = index(x, y + 1);

      for (let channel = 0; channel < 3; channel += 1) {
        const value =
          source[center + channel] * (1 + amount * 4) -
          amount *
            (source[left + channel] +
              source[right + channel] +
              source[top + channel] +
              source[bottom + channel]);

        data[center + channel] = clamp(Math.round(value), 0, 255);
      }
    }
  }

  return imageData;
}

function solveHomography(source: [Point, Point, Point, Point]): number[] {
  // Maps destination normalized coordinates (u,v) -> source normalized (x,y).
  // h33 is fixed to 1, leaving eight unknowns.
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
      const temporary = matrix[column];
      matrix[column] = matrix[pivotRow];
      matrix[pivotRow] = temporary;
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

function sampleBilinear(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const safeX = clamp(x, 0, width - 1);
  const safeY = clamp(y, 0, height - 1);

  const x0 = Math.floor(safeX);
  const y0 = Math.floor(safeY);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);

  const fx = safeX - x0;
  const fy = safeY - y0;

  const index00 = (y0 * width + x0) * 4;
  const index10 = (y0 * width + x1) * 4;
  const index01 = (y1 * width + x0) * 4;
  const index11 = (y1 * width + x1) * 4;

  const output: [number, number, number, number] = [0, 0, 0, 0];

  for (let channel = 0; channel < 4; channel += 1) {
    const top =
      source[index00 + channel] * (1 - fx) + source[index10 + channel] * fx;
    const bottom =
      source[index01 + channel] * (1 - fx) + source[index11 + channel] * fx;

    output[channel] = Math.round(top * (1 - fy) + bottom * fy);
  }

  return output;
}

function perspectiveCropToCanvas(
  sourceCanvas: HTMLCanvasElement,
  crop: CropPolygon,
  outputWidth: number,
  outputHeight: number,
): HTMLCanvasElement {
  if (!isValidCropPolygon(crop)) {
    throw new Error("Please keep all four crop corners inside the image.");
  }

  const sourceContext = sourceCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!sourceContext) {
    throw new Error("Your browser could not read the uploaded image.");
  }

  const sourceData = sourceContext.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  const sourcePixels = sourceData.data;

  const sourcePoints: [Point, Point, Point, Point] = [
    crop.tl,
    crop.tr,
    crop.br,
    crop.bl,
  ];

  const homography = solveHomography(sourcePoints);
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;

  const outputContext = outputCanvas.getContext("2d");

  if (!outputContext) {
    throw new Error("Your browser could not create the crop canvas.");
  }

  const outputImageData = outputContext.createImageData(
    outputWidth,
    outputHeight,
  );
  const outputPixels = outputImageData.data;

  const [h11, h12, h13, h21, h22, h23, h31, h32] = homography;

  for (let y = 0; y < outputHeight; y += 1) {
    const v = outputHeight === 1 ? 0 : y / (outputHeight - 1);
    const rowOffset = y * outputWidth * 4;

    for (let x = 0; x < outputWidth; x += 1) {
      const u = outputWidth === 1 ? 0 : x / (outputWidth - 1);
      const denominator = h31 * u + h32 * v + 1;

      if (Math.abs(denominator) < 1e-10) {
        continue;
      }

      const sourceX =
        ((h11 * u + h12 * v + h13) / denominator) * (sourceCanvas.width - 1);
      const sourceY =
        ((h21 * u + h22 * v + h23) / denominator) * (sourceCanvas.height - 1);

      const rgba = sampleBilinear(
        sourcePixels,
        sourceCanvas.width,
        sourceCanvas.height,
        sourceX,
        sourceY,
      );

      const destinationIndex = rowOffset + x * 4;
      outputPixels[destinationIndex] = rgba[0];
      outputPixels[destinationIndex + 1] = rgba[1];
      outputPixels[destinationIndex + 2] = rgba[2];
      outputPixels[destinationIndex + 3] = rgba[3];
    }
  }

  outputContext.putImageData(outputImageData, 0, 0);
  return outputCanvas;
}

async function renderProcessedImage(
  asset: ImageAsset,
  brightness: number,
  contrast: number,
  sharpening: number,
  rotation: number,
  roundedCorners: boolean,
  pixelsPerMm = OUTPUT_PX_PER_MM,
): Promise<string> {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("The uploaded image could not be processed."));
    image.src = asset.url;
  });

  const baseWidth = Math.max(96, Math.round(PASSPORT_WIDTH_MM * pixelsPerMm));
  const baseHeight = Math.max(
    136,
    Math.round(PASSPORT_HEIGHT_MM * pixelsPerMm),
  );

  const maxSourceDimension = 3200;
  const sourceScale = Math.min(
    1,
    maxSourceDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const sourceWidth = Math.max(1, Math.round(image.naturalWidth * sourceScale));
  const sourceHeight = Math.max(
    1,
    Math.round(image.naturalHeight * sourceScale),
  );

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = sourceWidth;
  sourceCanvas.height = sourceHeight;

  const sourceContext = sourceCanvas.getContext("2d");

  if (!sourceContext) {
    throw new Error("Your browser could not create an image canvas.");
  }

  sourceContext.imageSmoothingEnabled = true;
  sourceContext.imageSmoothingQuality = "high";
  sourceContext.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
  );

  let croppedCanvas = perspectiveCropToCanvas(
    sourceCanvas,
    asset.crop,
    baseWidth,
    baseHeight,
  );

  const adjustedCanvas = document.createElement("canvas");
  adjustedCanvas.width = baseWidth;
  adjustedCanvas.height = baseHeight;

  const cropContext = adjustedCanvas.getContext("2d", {
    alpha: true,
    willReadFrequently: sharpening > 0,
  });

  if (!cropContext) {
    throw new Error("Your browser could not process the cropped image.");
  }

  cropContext.imageSmoothingEnabled = true;
  cropContext.imageSmoothingQuality = "high";
  cropContext.filter = `brightness(${brightness / 100}) contrast(${contrast / 100})`;
  cropContext.drawImage(croppedCanvas, 0, 0);
  cropContext.filter = "none";

  croppedCanvas = adjustedCanvas;

  if (sharpening > 0) {
    const imageData = cropContext.getImageData(
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height,
    );

    applySharpening(imageData, sharpening);
    cropContext.putImageData(imageData, 0, 0);
  }

  const turns = ((rotation % 360) + 360) % 360;
  const rotated = turns === 90 || turns === 270;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = rotated ? baseHeight : baseWidth;
  outputCanvas.height = rotated ? baseWidth : baseHeight;

  const outputContext = outputCanvas.getContext("2d");

  if (!outputContext) {
    throw new Error("Your browser could not create the output canvas.");
  }

  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = "high";

  if (roundedCorners) {
    const radius = Math.min(
      14,
      outputCanvas.width / 8,
      outputCanvas.height / 8,
    );

    outputContext.save();
    outputContext.beginPath();
    outputContext.roundRect(
      0,
      0,
      outputCanvas.width,
      outputCanvas.height,
      radius,
    );
    outputContext.clip();
  }

  outputContext.save();
  outputContext.translate(outputCanvas.width / 2, outputCanvas.height / 2);
  outputContext.rotate((turns * Math.PI) / 180);
  outputContext.drawImage(
    croppedCanvas,
    -baseWidth / 2,
    -baseHeight / 2,
    baseWidth,
    baseHeight,
  );
  outputContext.restore();

  if (roundedCorners) {
    outputContext.restore();
  }

  return outputCanvas.toDataURL("image/png");
}

function getGeometry(
  frontImage: ImageAsset | null,
  backImage: ImageAsset | null,
  orientation: Orientation,
  layout: Layout,
  position: Position,
  rotation: number,
): SheetGeometry {
  const rotated =
    ((rotation % 360) + 360) % 360 === 90 ||
    ((rotation % 360) + 360) % 360 === 270;
  const itemWidth = rotated ? PASSPORT_HEIGHT_MM : PASSPORT_WIDTH_MM;
  const itemHeight = rotated ? PASSPORT_WIDTH_MM : PASSPORT_HEIGHT_MM;

  const hasFront = Boolean(frontImage);
  const hasBack = Boolean(backImage);
  const count = Number(hasFront) + Number(hasBack);

  const autoFitsPortrait = () => {
    const sheetWidth = 210;
    const sheetHeight = 297;
    const gap = count > 1 ? GAP_MM : 0;
    const groupWidth =
      layout === "side-by-side" ? itemWidth * count + gap : itemWidth;
    const groupHeight =
      layout === "stacked" ? itemHeight * count + gap : itemHeight;

    return (
      groupWidth <= sheetWidth - SAFE_MARGIN_MM * 2 &&
      groupHeight <= sheetHeight - SAFE_MARGIN_MM * 2
    );
  };

  let sheetOrientation: SheetOrientation;
  if (orientation === "portrait") {
    sheetOrientation = "portrait";
  } else if (orientation === "landscape") {
    sheetOrientation = "landscape";
  } else {
    sheetOrientation = autoFitsPortrait() ? "portrait" : "landscape";
  }

  const sheetWidth = sheetOrientation === "portrait" ? 210 : 297;
  const sheetHeight = sheetOrientation === "portrait" ? 297 : 210;

  if (!count) {
    return {
      orientation: sheetOrientation,
      sheetWidth,
      sheetHeight,
      itemWidth,
      itemHeight,
      front: null,
      back: null,
    };
  }

  const gap = count > 1 ? GAP_MM : 0;

  const groupWidth =
    layout === "side-by-side" ? itemWidth * count + gap : itemWidth;
  const groupHeight =
    layout === "stacked" ? itemHeight * count + gap : itemHeight;

  const scale = Math.min(
    1,
    (sheetWidth - SAFE_MARGIN_MM * 2) / groupWidth,
    (sheetHeight - SAFE_MARGIN_MM * 2) / groupHeight,
  );

  const scaledItemWidth = itemWidth * scale;
  const scaledItemHeight = itemHeight * scale;
  const scaledGap = gap * scale;
  const scaledGroupWidth =
    layout === "side-by-side"
      ? scaledItemWidth * count + scaledGap
      : scaledItemWidth;
  const scaledGroupHeight =
    layout === "stacked"
      ? scaledItemHeight * count + scaledGap
      : scaledItemHeight;

  const groupX = (sheetWidth - scaledGroupWidth) / 2;
  const groupY =
    position === "top"
      ? SAFE_MARGIN_MM
      : position === "center"
        ? (sheetHeight - scaledGroupHeight) / 2
        : sheetHeight - scaledGroupHeight - SAFE_MARGIN_MM;

  const makePlacement = (slot: ImageSlot): Placement | null => {
    const exists = slot === "front" ? hasFront : hasBack;
    if (!exists) {
      return null;
    }

    const index = slot === "front" ? 0 : hasFront ? 1 : 0;

    if (layout === "side-by-side") {
      return {
        x: groupX + index * (scaledItemWidth + scaledGap),
        y: groupY,
        width: scaledItemWidth,
        height: scaledItemHeight,
      };
    }

    return {
      x: groupX,
      y: groupY + index * (scaledItemHeight + scaledGap),
      width: scaledItemWidth,
      height: scaledItemHeight,
    };
  };

  return {
    orientation: sheetOrientation,
    sheetWidth,
    sheetHeight,
    itemWidth,
    itemHeight,
    front: makePlacement("front"),
    back: makePlacement("back"),
  };
}

const PREVIEW_PIXELS_PER_MM = 96 / 25.4;

type ProcessedThumbnailProps = {
  asset: ImageAsset;
  brightness: number;
  contrast: number;
  rotation: number;
  roundedCorners: boolean;
  alt: string;
  className?: string;
};

// Renders the ACTUAL processed output (perspective crop + brightness/contrast +
// rotation), the same pipeline used for the live preview and the final PDF.
// This must be used anywhere the user needs to see what their crop produced —
// falling back to the raw, uncropped asset.url (as the old upload-slot
// thumbnail did) shows a generic browser auto-crop that has nothing to do
// with the quadrilateral the user actually selected.
function ProcessedThumbnail({
  asset,
  brightness,
  contrast,
  rotation,
  roundedCorners,
  alt,
  className,
}: ProcessedThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void renderProcessedImage(
      asset,
      brightness,
      contrast,
      0,
      rotation,
      roundedCorners,
      PREVIEW_PIXELS_PER_MM,
    )
      .then((dataUrl) => {
        if (active) {
          setSrc(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setSrc(null);
        }
      });

    return () => {
      active = false;
    };
  }, [asset, brightness, contrast, rotation, roundedCorners]);

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <span className="w-4 h-4 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className ?? "w-full h-full object-contain select-none"}
    />
  );
}

type CropModalProps = {
  asset: ImageAsset;
  onClose: () => void;
  onApply: (crop: CropPolygon) => void;
};

function CropModal({ asset, onClose, onApply }: CropModalProps) {
  const [crop, setCrop] = useState<CropPolygon>(() => cloneCrop(asset.crop));
  const imageRef = useRef<HTMLImageElement | null>(null);
  const interactionRef = useRef<{
    action: CropHandle;
    startX: number;
    startY: number;
    startCrop: CropPolygon;
  } | null>(null);

  const [imageBox, setImageBox] = useState({ width: 0, height: 0 });

  const updateImageBox = useCallback(() => {
    if (!imageRef.current) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();

    setImageBox({
      width: rect.width,
      height: rect.height,
    });
  }, []);

  useLayoutEffect(() => {
    updateImageBox();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateImageBox)
        : null;

    if (imageRef.current && resizeObserver) {
      resizeObserver.observe(imageRef.current);
    }

    window.addEventListener("resize", updateImageBox);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateImageBox);
    };
  }, [updateImageBox]);

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

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;

      if (!interaction || !imageBox.width || !imageBox.height) {
        return;
      }

      const dx = (event.clientX - interaction.startX) / imageBox.width;
      const dy = (event.clientY - interaction.startY) / imageBox.height;
      const start = interaction.startCrop;
      let candidate = cloneCrop(start);

      switch (interaction.action) {
        case "move":
          candidate = moveCrop(start, dx, dy);
          break;

        case "tl":
          candidate.tl = {
            x: start.tl.x + dx,
            y: start.tl.y + dy,
          };
          break;

        case "tr":
          candidate.tr = {
            x: start.tr.x + dx,
            y: start.tr.y + dy,
          };
          break;

        case "br":
          candidate.br = {
            x: start.br.x + dx,
            y: start.br.y + dy,
          };
          break;

        case "bl":
          candidate.bl = {
            x: start.bl.x + dx,
            y: start.bl.y + dy,
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

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [imageBox.height, imageBox.width]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const resetCrop = () => {
    setCrop(getDefaultCrop(asset.naturalWidth, asset.naturalHeight));
  };

  const scalePoint = (point: Point) => ({
    x: point.x * imageBox.width,
    y: point.y * imageBox.height,
  });

  const tl = scalePoint(crop.tl);
  const tr = scalePoint(crop.tr);
  const br = scalePoint(crop.br);
  const bl = scalePoint(crop.bl);

  const edgeTop = {
    x: (tl.x + tr.x) / 2,
    y: (tl.y + tr.y) / 2,
  };
  const edgeRight = {
    x: (tr.x + br.x) / 2,
    y: (tr.y + br.y) / 2,
  };
  const edgeBottom = {
    x: (bl.x + br.x) / 2,
    y: (bl.y + br.y) / 2,
  };
  const edgeLeft = {
    x: (tl.x + bl.x) / 2,
    y: (tl.y + bl.y) / 2,
  };

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
      <div className="w-full max-w-6xl bg-[#fffdf2] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-amber-100">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">
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
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition-colors shrink-0"
            aria-label="Close crop editor"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-[#151515] p-3 md:p-5">
          <div className="min-h-[420px] max-h-[72vh] flex items-center justify-center overflow-auto">
            <div className="relative inline-block max-w-full select-none">
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

                  <line
                    x1={tl.x}
                    y1={tl.y}
                    x2={br.x}
                    y2={br.y}
                    stroke="rgba(251,191,36,0.5)"
                    strokeWidth={1}
                    strokeDasharray="6 5"
                    pointerEvents="none"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={tr.x}
                    y1={tr.y}
                    x2={bl.x}
                    y2={bl.y}
                    stroke="rgba(251,191,36,0.5)"
                    strokeWidth={1}
                    strokeDasharray="6 5"
                    pointerEvents="none"
                    vectorEffect="non-scaling-stroke"
                  />

                  <circle
                    cx={tl.x}
                    cy={tl.y}
                    r={8}
                    className={`${handleClass} cursor-nwse-resize`}
                    onPointerDown={(event) => beginInteraction("tl", event)}
                  />
                  <circle
                    cx={tr.x}
                    cy={tr.y}
                    r={8}
                    className={`${handleClass} cursor-nesw-resize`}
                    onPointerDown={(event) => beginInteraction("tr", event)}
                  />
                  <circle
                    cx={br.x}
                    cy={br.y}
                    r={8}
                    className={`${handleClass} cursor-nwse-resize`}
                    onPointerDown={(event) => beginInteraction("br", event)}
                  />
                  <circle
                    cx={bl.x}
                    cy={bl.y}
                    r={8}
                    className={`${handleClass} cursor-nesw-resize`}
                    onPointerDown={(event) => beginInteraction("bl", event)}
                  />

                  <circle
                    cx={edgeTop.x}
                    cy={edgeTop.y}
                    r={6}
                    className={`${handleClass} cursor-ns-resize`}
                    onPointerDown={(event) => beginInteraction("top", event)}
                  />
                  <circle
                    cx={edgeRight.x}
                    cy={edgeRight.y}
                    r={6}
                    className={`${handleClass} cursor-ew-resize`}
                    onPointerDown={(event) => beginInteraction("right", event)}
                  />
                  <circle
                    cx={edgeBottom.x}
                    cy={edgeBottom.y}
                    r={6}
                    className={`${handleClass} cursor-ns-resize`}
                    onPointerDown={(event) => beginInteraction("bottom", event)}
                  />
                  <circle
                    cx={edgeLeft.x}
                    cy={edgeLeft.y}
                    r={6}
                    className={`${handleClass} cursor-ew-resize`}
                    onPointerDown={(event) => beginInteraction("left", event)}
                  />

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-amber-100">
          <div className="flex flex-col gap-1 text-[10px] text-gray-500">
            <div className="flex items-center gap-2">
              <GripVertical size={13} className="text-amber-500" />
              <span>
                Corner handles move independently; edge handles move two corners
                together.
              </span>
            </div>
            <span className="text-gray-400 pl-5">
              Your crop can be wider, narrower, taller, shorter, shifted up,
              down, left, or right without a locked ratio.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetCrop}
              className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-white transition-colors"
            >
              Reset crop
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(getSafeCrop(crop, crop))}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors flex items-center gap-1.5"
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

type UploadSlotProps = {
  slot: ImageSlot;
  label: string;
  asset: ImageAsset | null;
  onUpload: (slot: ImageSlot, files: FileList | null) => void;
  onCrop: (slot: ImageSlot) => void;
  onRemove: (slot: ImageSlot) => void;
  brightness: number;
  contrast: number;
  rotation: number;
  roundedCorners: boolean;
};

function UploadSlot({
  slot,
  label,
  asset,
  onUpload,
  onCrop,
  onRemove,
  brightness,
  contrast,
  rotation,
  roundedCorners,
}: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onUpload(slot, event.dataTransfer.files);
  };

  return (
    <div
      className="relative w-full border-2 border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/60 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all overflow-hidden"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) {
          return;
        }
        openPicker();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
    >
      {asset ? (
        <>
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center p-4">
            <div className="relative max-w-full max-h-full aspect-[88/125] h-[175px] rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
              <ProcessedThumbnail
                asset={asset}
                brightness={brightness}
                contrast={contrast}
                rotation={rotation}
                roundedCorners={roundedCorners}
                alt={`${label} preview`}
                className="w-full h-full object-cover select-none"
              />
            </div>
          </div>

          <div className="absolute inset-x-2 bottom-2 z-10 bg-white/95 backdrop-blur rounded-xl border border-gray-200 px-2.5 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <p className="text-[10px] font-bold text-gray-800 truncate">
                  {asset.file.name}
                </p>
                <p className="text-[9px] text-gray-400">
                  {asset.naturalWidth} × {asset.naturalHeight} px
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCrop(slot);
                  }}
                  className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                  title="Crop image"
                  aria-label={`Crop ${label}`}
                >
                  <Crop size={13} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(slot);
                  }}
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
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2">
            <Upload size={18} />
          </div>
          <span className="text-xs font-bold text-gray-800">{label}</span>
          <span className="text-[9px] text-gray-400 mt-0.5">
            Click or drop an image here
          </span>
          <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded mt-2">
            JPG • PNG • WEBP • HEIC
          </span>
          <span className="text-[8px] text-gray-400 mt-1">Maximum 20 MB</span>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif"
        onChange={(event) => {
          onUpload(slot, event.target.files);
          event.currentTarget.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}

type PreviewImageProps = {
  asset: ImageAsset;
  placement: Placement;
  brightness: number;
  contrast: number;
  rotation: number;
  roundedCorners: boolean;
  geometry: SheetGeometry;
  label: string;
};

function PreviewImage({
  asset,
  placement,
  brightness,
  contrast,
  rotation,
  roundedCorners,
  geometry,
  label,
}: PreviewImageProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void renderProcessedImage(
      asset,
      brightness,
      contrast,
      0,
      rotation,
      roundedCorners,
      PREVIEW_PIXELS_PER_MM,
    )
      .then((dataUrl) => {
        if (active) {
          setSrc(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setSrc(null);
        }
      });

    return () => {
      active = false;
    };
  }, [asset, brightness, contrast, rotation, roundedCorners]);

  return (
    <div
      className="absolute overflow-hidden bg-white shadow-sm border border-gray-200"
      style={{
        left: `${(placement.x / geometry.sheetWidth) * 100}%`,
        top: `${(placement.y / geometry.sheetHeight) * 100}%`,
        width: `${(placement.width / geometry.sheetWidth) * 100}%`,
        height: `${(placement.height / geometry.sheetHeight) * 100}%`,
        borderRadius: roundedCorners ? 14 : 0,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={`${label} passport page`}
          draggable={false}
          className="block w-full h-full object-fill select-none"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <span className="w-4 h-4 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
        </div>
      )}
    </div>
  );
}

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

  const [frontImage, setFrontImage] = useState<ImageAsset | null>(null);
  const [backImage, setBackImage] = useState<ImageAsset | null>(null);

  const [cropTarget, setCropTarget] = useState<ImageSlot | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const previewPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      setIsFavorite(
        window.localStorage.getItem("sohoj-passport-to-pdf-favorite") === "1",
      );
    } catch {
      setIsFavorite(false);
    }
  }, []);

  // Keep refs pointing at the *latest* assets so the unmount cleanup below
  // always revokes the current URLs — never the ones from a stale closure.
  const frontImageRef = useRef<ImageAsset | null>(null);
  const backImageRef = useRef<ImageAsset | null>(null);

  useEffect(() => {
    frontImageRef.current = frontImage;
  }, [frontImage]);

  useEffect(() => {
    backImageRef.current = backImage;
  }, [backImage]);

  // Runs ONLY on unmount (empty deps). Per-slot revocation when an image is
  // replaced/removed/reset is already handled inline in replaceImage,
  // handleRemove, and resetAll — this effect must not re-run on every image
  // change, or it revokes the *other* slot's still-in-use blob URL.
  useEffect(() => {
    return () => {
      if (frontImageRef.current) {
        URL.revokeObjectURL(frontImageRef.current.url);
      }
      if (backImageRef.current) {
        URL.revokeObjectURL(backImageRef.current.url);
      }
    };
  }, []);

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

  const geometry = useMemo(
    () =>
      getGeometry(
        frontImage,
        backImage,
        orientation,
        layout,
        position,
        rotation,
      ),
    [frontImage, backImage, orientation, layout, position, rotation],
  );

  const currentPageCount = frontImage || backImage ? copies : 1;

  const replaceImage = useCallback(
    async (slot: ImageSlot, file: File | null) => {
      if (!file) {
        return;
      }

      setIsProcessing(true);
      try {
        const asset = await createImageAsset(file);

        if (slot === "front") {
          setFrontImage((previous) => {
            if (previous) {
              URL.revokeObjectURL(previous.url);
            }
            return asset;
          });
        } else {
          setBackImage((previous) => {
            if (previous) {
              URL.revokeObjectURL(previous.url);
            }
            return asset;
          });
        }

        setCropTarget(null);
        showNotice(
          "success",
          `${slot === "front" ? "Front" : "Back"} passport image added.`,
        );
      } catch (error) {
        showNotice(
          "error",
          error instanceof Error
            ? error.message
            : "The image could not be uploaded.",
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [showNotice],
  );

  const handleUpload = useCallback(
    (slot: ImageSlot, files: FileList | null) => {
      const file = files?.[0] ?? null;
      void replaceImage(slot, file);
    },
    [replaceImage],
  );

  const handleRemove = useCallback((slot: ImageSlot) => {
    if (slot === "front") {
      setFrontImage((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous.url);
        }
        return null;
      });
    } else {
      setBackImage((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous.url);
        }
        return null;
      });
    }

    setCropTarget(null);
  }, []);

  const handleApplyCrop = (crop: CropPolygon) => {
    if (cropTarget === "front") {
      setFrontImage((previous) =>
        previous ? { ...previous, crop } : previous,
      );
    } else if (cropTarget === "back") {
      setBackImage((previous) => (previous ? { ...previous, crop } : previous));
    }

    setCropTarget(null);
    showNotice("success", "Crop applied.");
  };

  const resetAll = () => {
    if (frontImage) {
      URL.revokeObjectURL(frontImage.url);
    }
    if (backImage) {
      URL.revokeObjectURL(backImage.url);
    }

    setFrontImage(null);
    setBackImage(null);
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
    showNotice("info", "Passport PDF settings have been reset.");
  };

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);

    try {
      window.localStorage.setItem(
        "sohoj-passport-to-pdf-favorite",
        next ? "1" : "0",
      );
    } catch {
      // Ignore storage errors.
    }

    showNotice(
      "success",
      next ? "Added to your favorites." : "Removed from your favorites.",
    );
  };

  const handleShare = async () => {
    const shareData = {
      title: "Passport to PDF",
      text: "Create a clean A4 passport PDF directly in the browser.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      showNotice("success", "Page link copied to clipboard.");
    } catch {
      showNotice(
        "info",
        "Sharing was cancelled or isn't available in this browser.",
      );
    }
  };

  const getOutputDataUrls = useCallback(async () => {
    const entries: { slot: ImageSlot; asset: ImageAsset; dataUrl: string }[] =
      [];

    const assets: [ImageSlot, ImageAsset | null][] = [
      ["front", frontImage],
      ["back", backImage],
    ];

    for (const [slot, asset] of assets) {
      if (!asset) {
        continue;
      }

      const dataUrl = await renderProcessedImage(
        asset,
        brightness,
        contrast,
        sharpening,
        rotation,
        roundedCorners,
      );

      entries.push({
        slot,
        asset,
        dataUrl,
      });
    }

    return entries;
  }, [
    backImage,
    brightness,
    contrast,
    frontImage,
    roundedCorners,
    rotation,
    sharpening,
  ]);

  const createPdf = async () => {
    if (!frontImage && !backImage) {
      showNotice(
        "error",
        "Upload at least one passport page before creating the PDF.",
      );
      return;
    }

    setIsProcessing(true);

    try {
      const [{ default: JsPDF }, outputEntries] = await Promise.all([
        import("jspdf"),
        getOutputDataUrls(),
      ]);

      const doc = new JsPDF({
        orientation: geometry.orientation === "portrait" ? "p" : "l",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      doc.setProperties({
        title: "Passport to PDF",
        subject: "Passport page PDF",
        creator: "SohojKaj",
      });

      const dataUrls = new Map(
        outputEntries.map((entry) => [entry.slot, entry.dataUrl]),
      );

      for (let copy = 0; copy < copies; copy += 1) {
        if (copy > 0) {
          doc.addPage("a4", geometry.orientation === "portrait" ? "p" : "l");
        }

        const placements: [ImageSlot, Placement | null][] = [
          ["front", geometry.front],
          ["back", geometry.back],
        ];

        for (const [slot, placement] of placements) {
          if (!placement) {
            continue;
          }

          const dataUrl = dataUrls.get(slot);
          if (!dataUrl) {
            continue;
          }

          doc.addImage(
            dataUrl,
            "PNG",
            placement.x,
            placement.y,
            placement.width,
            placement.height,
            undefined,
            "FAST",
          );
        }
      }

      doc.save("passport-to-pdf.pdf");
      showNotice(
        "success",
        `PDF created successfully — ${currentPageCount} sheet${currentPageCount === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the PDF.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    if (!frontImage && !backImage) {
      showNotice("error", "Upload at least one passport page before printing.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      showNotice(
        "error",
        "Please allow pop-ups for this site to print the passport PDF.",
      );
      return;
    }

    setIsProcessing(true);

    try {
      const outputEntries = await getOutputDataUrls();
      const dataUrls = new Map(
        outputEntries.map((entry) => [entry.slot, entry.dataUrl]),
      );

      const imageTags: string[] = [];

      const placements: [ImageSlot, Placement | null][] = [
        ["front", geometry.front],
        ["back", geometry.back],
      ];

      for (const [slot, placement] of placements) {
        if (!placement) {
          continue;
        }

        const dataUrl = dataUrls.get(slot);
        if (!dataUrl) {
          continue;
        }

        imageTags.push(
          `<img class="passport-image" src="${dataUrl}" alt="${slot} passport page" style="left:${placement.x}mm;top:${placement.y}mm;width:${placement.width}mm;height:${placement.height}mm;border-radius:${roundedCorners ? "3.7mm" : "0"};" />`,
        );
      }

      const pageMarkup = Array.from({ length: copies }, (_, index) => {
        return `
          <section class="sheet">
            ${imageTags.join("\n")}
            <div class="sheet-label">Passport to PDF · Sheet ${index + 1}</div>
          </section>
        `;
      }).join("\n");

      const pageWidth = geometry.orientation === "portrait" ? 210 : 297;
      const pageHeight = geometry.orientation === "portrait" ? 297 : 210;

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Passport to PDF</title>
            <style>
              @page {
                size: ${pageWidth}mm ${pageHeight}mm;
                margin: 0;
              }
              * { box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 0;
                background: #fff;
              }
              body {
                font-family: Arial, Helvetica, sans-serif;
              }
              .sheet {
                position: relative;
                width: ${pageWidth}mm;
                height: ${pageHeight}mm;
                overflow: hidden;
                background: #fff;
                page-break-after: always;
              }
              .passport-image {
                position: absolute;
                display: block;
                object-fit: fill;
              }
              .sheet-label {
                position: absolute;
                left: 5mm;
                bottom: 3mm;
                font-size: 2.3mm;
                color: #9ca3af;
                letter-spacing: 0.02em;
                opacity: 0.7;
              }
              @media print {
                .sheet-label {
                  display: none;
                }
                .sheet {
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body>
            ${pageMarkup}
            <script>
              window.addEventListener("load", function () {
                setTimeout(function () {
                  window.focus();
                  window.print();
                }, 350);
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      showNotice("success", "Print preview opened.");
    } catch (error) {
      printWindow.close();
      showNotice(
        "error",
        error instanceof Error
          ? error.message
          : "Something went wrong while preparing the print layout.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await previewPanelRef.current?.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      showNotice("info", "Fullscreen mode is not available in this browser.");
    }
  };

  useEffect(() => {
    const handleFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, []);

  const sheetStyle = useMemo(() => {
    const aspect = geometry.sheetWidth / geometry.sheetHeight;
    return {
      width: "min(100%, 510px)",
      aspectRatio: `${aspect}`,
    };
  }, [geometry.sheetHeight, geometry.sheetWidth]);

  const hasImages = Boolean(frontImage || backImage);
  const selectedCropAsset =
    cropTarget === "front"
      ? frontImage
      : cropTarget === "back"
        ? backImage
        : null;

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {notice ? (
        <div
          className={`fixed right-5 top-5 z-[120] max-w-sm rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${
            notice.type === "error"
              ? "bg-red-50/95 border-red-200 text-red-700"
              : notice.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-700"
                : "bg-white/95 border-gray-200 text-gray-700"
          }`}
          role="status"
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
              className="ml-1 text-current/60 hover:text-current"
              aria-label="Close notification"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Sohoj Tools</span>
        </Link>
        <span>/</span>
        <span>Image Tools</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">Passport to PDF</span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Passport to PDF
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFavorite}
            className={`p-2 rounded-xl transition-all border ${
              isFavorite
                ? "text-amber-600 bg-amber-50 border-amber-100"
                : "text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-100"
            }`}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
            aria-label="Share this tool"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4 max-h-[750px] overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
            Settings
          </h2>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
              <span>Page settings</span>
              <span className="text-gray-400 text-[10px]">Page</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
              {(
                [
                  ["auto", "Auto"],
                  ["portrait", "Portrait"],
                  ["landscape", "Landscape"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrientation(value)}
                  disabled={isProcessing}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center gap-1 ${
                    orientation === value
                      ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                      : "text-gray-500 hover:text-gray-800"
                  } disabled:opacity-50`}
                >
                  {value === "portrait" ? (
                    <div className="w-3 h-4 border-2 border-current rounded-xs" />
                  ) : value === "landscape" ? (
                    <div className="w-4 h-3 border-2 border-current rounded-xs" />
                  ) : (
                    label
                  )}
                  {value !== "auto" ? null : null}
                  {value === "auto" ? null : <span>{label}</span>}
                </button>
              ))}
            </div>
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
                className="text-[10px] text-amber-600 font-bold hover:underline disabled:opacity-50"
              >
                Switch
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setLayout("side-by-side")}
                disabled={isProcessing}
                className={`py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1 transition-all ${
                  layout === "side-by-side"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                } disabled:opacity-50`}
              >
                <div className="flex gap-0.5">
                  <div className="w-3 h-4 bg-amber-500 rounded-xs" />
                  <div className="w-3 h-4 bg-amber-500 rounded-xs" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => setLayout("stacked")}
                disabled={isProcessing}
                className={`py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1 transition-all ${
                  layout === "stacked"
                    ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                } disabled:opacity-50`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-5 h-2 bg-amber-500 rounded-xs" />
                  <div className="w-5 h-2 bg-amber-500 rounded-xs" />
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-600">
              <span>Rotate</span>
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                disabled={isProcessing}
                className="text-[10px] text-amber-600 font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <RotateCw size={10} />
                Rotate 90°
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setRotation(deg)}
                  disabled={isProcessing}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    rotation === deg
                      ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                      : "hover:bg-white/50"
                  } disabled:opacity-50`}
                >
                  {deg}°
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">
              Both pages rotate together.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-600 block">
              Position on page
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
              {(["top", "center", "bottom"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPosition(value)}
                  disabled={isProcessing}
                  className={`py-1.5 rounded-lg transition-all capitalize ${
                    position === value
                      ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                      : "hover:bg-white/50"
                  } disabled:opacity-50`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-600 block">
              Copies
            </span>
            <div className="grid grid-cols-2 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCopies(num)}
                  disabled={isProcessing}
                  className={`py-1.5 rounded-lg transition-all ${
                    copies === num
                      ? "bg-white text-amber-600 shadow-xs border border-gray-100"
                      : "hover:bg-white/50"
                  } disabled:opacity-50`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">
              A copy repeats the complete passport layout on another A4 sheet.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-gray-700 block">
                Rounded corners (14px)
              </span>
              <span className="text-[10px] text-gray-400 block">
                14px round corners on page images
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRoundedCorners(!roundedCorners)}
              disabled={isProcessing}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                roundedCorners
                  ? "bg-amber-500 justify-end"
                  : "bg-gray-300 justify-start"
              } disabled:opacity-50`}
              aria-pressed={roundedCorners}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-800">
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
                className="text-[10px] text-amber-600 font-bold hover:underline disabled:opacity-50"
              >
                Reset
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>Brightness {brightness}%</span>
                <span className="bg-amber-100 text-amber-700 px-1 rounded">
                  {brightness}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(event) => setBrightness(Number(event.target.value))}
                disabled={isProcessing}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>Contrast {contrast}%</span>
                <span className="bg-amber-100 text-amber-700 px-1 rounded">
                  {contrast}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(event) => setContrast(Number(event.target.value))}
                disabled={isProcessing}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>Sharpening {sharpening}</span>
                <span className="bg-amber-100 text-amber-700 px-1 rounded">
                  {sharpening}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpening}
                onChange={(event) => setSharpening(Number(event.target.value))}
                disabled={isProcessing}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-[11px] font-bold text-gray-500">
            <span>
              {currentPageCount} sheet{currentPageCount === 1 ? "" : "s"} ·{" "}
              {geometry.orientation === "portrait"
                ? "A4 Portrait"
                : "A4 Landscape"}
            </span>
            <span>
              {copies} copy{copies === 1 ? "" : "ies"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handlePrint()}
            disabled={!hasImages || isProcessing}
            className={`w-full py-2.5 border text-xs font-bold rounded-xl hover:bg-amber-50 transition-all flex items-center justify-center gap-1.5 ${
              hasImages && !isProcessing
                ? "border-amber-500 text-amber-600"
                : "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
            }`}
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>

        <div
          ref={previewPanelRef}
          className={`lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between ${
            isFullscreen
              ? "fixed inset-0 z-[90] rounded-none overflow-auto"
              : ""
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-800">Live preview</h2>
              <span className="text-[10px] text-gray-400 font-medium">
                A4 —{" "}
                {geometry.orientation === "portrait"
                  ? "794×1123 px"
                  : "1123×794 px"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
              <span>{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((value) => clamp(value + 10, 50, 160))}
                disabled={isProcessing}
                className="hover:text-gray-800 disabled:opacity-40"
                aria-label="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                disabled={isProcessing}
                className="hover:text-gray-800 disabled:opacity-40"
                aria-label="Rotate both passport pages"
              >
                <RotateCw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom((value) => clamp(value - 10, 50, 160))}
                disabled={isProcessing}
                className="hover:text-gray-800 disabled:opacity-40"
                aria-label="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                disabled={isProcessing}
                className="text-[10px] hover:text-gray-800 disabled:opacity-40"
                title="Reset zoom"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                disabled={isProcessing}
                className="hover:text-gray-800 disabled:opacity-40"
                aria-label="Toggle fullscreen preview"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-4 md:p-6 my-4 flex-1 flex justify-center items-start min-h-[580px] overflow-auto">
            <div
              className="relative transition-transform duration-200 origin-top shadow-md border border-gray-200 bg-white shrink-0"
              style={{
                ...sheetStyle,
                transform: `scale(${zoom / 100})`,
                marginBottom: `${Math.max(0, (zoom - 100) * 4)}px`,
              }}
            >
              {geometry.front && frontImage ? (
                <PreviewImage
                  asset={frontImage}
                  placement={geometry.front}
                  brightness={brightness}
                  contrast={contrast}
                  rotation={rotation}
                  roundedCorners={roundedCorners}
                  geometry={geometry}
                  label="Front"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                      <Upload size={21} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">
                      Upload your passport page
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] mx-auto">
                      Add the front and back page photos from the controls
                      below.
                    </p>
                  </div>
                </div>
              )}

              {geometry.back && backImage ? (
                <PreviewImage
                  asset={backImage}
                  placement={geometry.back}
                  brightness={brightness}
                  contrast={contrast}
                  rotation={rotation}
                  roundedCorners={roundedCorners}
                  geometry={geometry}
                  label="Back"
                />
              ) : null}

              {hasImages ? null : (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-full bg-gray-900/80 text-white text-[9px] font-semibold whitespace-nowrap">
                  A4 output preview
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
            asset={frontImage}
            onUpload={handleUpload}
            onCrop={setCropTarget}
            onRemove={handleRemove}
            brightness={brightness}
            contrast={contrast}
            rotation={rotation}
            roundedCorners={roundedCorners}
          />
          <UploadSlot
            slot="back"
            label="Back passport page"
            asset={backImage}
            onUpload={handleUpload}
            onCrop={setCropTarget}
            onRemove={handleRemove}
            brightness={brightness}
            contrast={contrast}
            rotation={rotation}
            roundedCorners={roundedCorners}
          />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              hasImages ? "bg-emerald-500" : "bg-amber-500"
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
            className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void createPdf()}
            disabled={!hasImages || isProcessing}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              hasImages && !isProcessing
                ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
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
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/image-size-reducer"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-500 transition-colors">
                Image Size Reducer
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Shrink JPG, PNG, and WebP photos in your browser — quality stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/nid-joiner"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-500 transition-colors">
                NID Joiner
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Turn NID card front and back photos into a clean A4 PDF — all in
                your browser.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/remove-background"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <Wand2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-500 transition-colors">
                Remove Background
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Erase portrait, product, or logo backgrounds in your browser —
                download a transparent PNG.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {selectedCropAsset ? (
        <CropModal
          asset={selectedCropAsset}
          onClose={() => setCropTarget(null)}
          onApply={handleApplyCrop}
        />
      ) : null}
    </div>
  );
}
