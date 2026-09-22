"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";

import {
  ACCEPTED_FILE_TYPES,
  BACKGROUNDS,
  DEFAULT_FILTERS,
  DPI,
  MAX_FILE_SIZE,
  PASSPORT_PRESET,
  R_SIZE_PRESETS,
  VISA_PRESETS,
} from "./constants";

import type {
  AiTool,
  EditorFilters,
  ObjectTab,
  PhotoAsset,
  PhotoMode,
  SizePreset,
} from "./types";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampByte(value: number) {
  return clamp(Math.round(value), 0, 255);
}

function mmToPx(mm: number) {
  return Math.round((mm / 25.4) * DPI);
}

function revokeAsset(asset: PhotoAsset | null) {
  if (asset?.url) {
    URL.revokeObjectURL(asset.url);
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => reject(new Error("Unable to load image"));

    img.src = url;
  });
}

function fileName(name: string) {
  return `${
    name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-") ||
    "manual-editor"
  }-edited.png`;
}

/* -------------------------------------------------------------------------- */
/*                         Canvas Adjustment Helpers                          */
/* -------------------------------------------------------------------------- */

/**
 * Standard CSS filters that Canvas 2D can bake directly.
 *
 * These are deliberately separated from Sharpness because the positive
 * sharpness effect uses a convolution matrix which is not consistently
 * supported through CanvasRenderingContext2D.filter via an SVG url().
 */
function buildStandardFilter(
  brightness: number,
  contrast: number,
  saturation: number,
) {
  return [
    `brightness(${100 + brightness}%)`,
    `contrast(${100 + contrast}%)`,
    `saturate(${Math.max(0, 100 + saturation)}%)`,
  ].join(" ");
}

/**
 * Applies the same 3x3 sharpening matrix that the preview SVG filter uses.
 *
 * Original matrix:
 *
 *  0  -k   0
 * -k 1+4k -k
 *  0  -k   0
 *
 * where:
 *   k = (sharpness / 100) * 0.8
 */
function applyCanvasSharpen(ctx: CanvasRenderingContext2D, sharpness: number) {
  if (sharpness <= 0) {
    return;
  }

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  if (!width || !height) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, width, height);

  const source = new Uint8ClampedArray(imageData.data);

  const output = imageData.data;

  const k = (clamp(sharpness, 0, 100) / 100) * 0.8;

  const centerWeight = 1 + 4 * k;

  const indexOf = (x: number, y: number) => (y * width + x) * 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const centerIndex = indexOf(x, y);

      const alpha = source[centerIndex + 3];

      if (alpha === 0) {
        continue;
      }

      const leftX = Math.max(0, x - 1);

      const rightX = Math.min(width - 1, x + 1);

      const topY = Math.max(0, y - 1);

      const bottomY = Math.min(height - 1, y + 1);

      const leftIndex = indexOf(leftX, y);

      const rightIndex = indexOf(rightX, y);

      const topIndex = indexOf(x, topY);

      const bottomIndex = indexOf(x, bottomY);

      for (let channel = 0; channel < 3; channel++) {
        const center = source[centerIndex + channel];

        const left = source[leftIndex + channel];

        const right = source[rightIndex + channel];

        const top = source[topIndex + channel];

        const bottom = source[bottomIndex + channel];

        const sharpened =
          center * centerWeight - k * (left + right + top + bottom);

        output[centerIndex + channel] = clampByte(sharpened);
      }

      output[centerIndex + 3] = alpha;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Creates a fully processed image layer for one photo.
 *
 * Important:
 * - Background is NOT adjusted.
 * - Geometry/rotation/flip/zoom are applied first.
 * - Brightness/contrast/saturation are baked through Canvas filter.
 * - Negative sharpness uses Canvas blur.
 * - Positive sharpness uses pixel convolution.
 */
async function createAdjustedImageLayer(
  asset: PhotoAsset,
  targetW: number,
  targetH: number,
  zoom: number,
  rotation: number,
  flipX: boolean,
  brightness: number,
  contrast: number,
  saturation: number,
  sharpness: number,
) {
  const canvas = document.createElement("canvas");

  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d", {
    willReadFrequently: sharpness > 0,
  });

  if (!ctx) {
    throw new Error("Unable to create canvas context");
  }

  const img = await loadImage(asset.url);

  ctx.imageSmoothingEnabled = true;

  ctx.imageSmoothingQuality = "high";

  const standardFilter = buildStandardFilter(brightness, contrast, saturation);

  /*
   * For negative sharpness, use the browser's native Canvas blur.
   * This follows the same visual pipeline used by CSS preview.
   */
  const negativeSharpFilter =
    sharpness < 0 ? ` blur(${(-sharpness / 100) * 3}px)` : "";

  ctx.save();

  ctx.filter = standardFilter + negativeSharpFilter;

  ctx.translate(targetW / 2, targetH / 2);

  ctx.rotate((rotation * Math.PI) / 180);

  ctx.scale(flipX ? -1 : 1, 1);

  const scale =
    Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight) *
    (zoom / 100);

  ctx.drawImage(
    img,
    (-img.naturalWidth * scale) / 2,
    (-img.naturalHeight * scale) / 2,
    img.naturalWidth * scale,
    img.naturalHeight * scale,
  );

  ctx.restore();

  /*
   * SVG url(#sharpness-filter) is not reliable for exported Canvas data.
   * So positive sharpness is baked directly into pixel data.
   *
   * Because standard filters were already rendered by Canvas before this
   * convolution, the order matches the preview:
   *
   * brightness → contrast → saturation → sharpness
   */
  if (sharpness > 0) {
    applyCanvasSharpen(ctx, sharpness);
  }

  ctx.filter = "none";

  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality?: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/* -------------------------------------------------------------------------- */
/*                              Context Type                                  */
/* -------------------------------------------------------------------------- */

export type ManualEditorContextValue = {
  isAuthenticated: boolean;
  loading: boolean;

  showCreditBanner: boolean;

  setShowCreditBanner: (value: boolean) => void;

  photoMode: PhotoMode;

  setPhotoMode: (value: PhotoMode) => void;

  selectedPreset: SizePreset | null;

  setSelectedPreset: (value: SizePreset | null) => void;

  freeWidth: number;
  freeHeight: number;

  setFreeWidth: (value: number) => void;

  setFreeHeight: (value: number) => void;

  sizeMenu: "visa" | "rsizes" | null;

  setSizeMenu: Dispatch<SetStateAction<"visa" | "rsizes" | null>>;

  freeSizeOpen: boolean;

  setFreeSizeOpen: (value: boolean) => void;

  currentPreset: SizePreset;

  selectedBg: string;

  setSelectedBg: (value: string) => void;

  customBg: string;

  setCustomBg: (value: string) => void;

  activeBackground: string;

  activeAiTool: AiTool | null;

  setActiveAiTool: (value: AiTool | null) => void;

  aiNotice: string;

  setAiNotice: (value: string) => void;

  objectTab: ObjectTab;

  setObjectTab: (value: ObjectTab) => void;

  objectBrightness: number;
  objectContrast: number;
  shadowStrength: number;
  brushSize: number;

  setObjectBrightness: (value: number) => void;

  setObjectContrast: (value: number) => void;

  setShadowStrength: (value: number) => void;

  setBrushSize: (value: number) => void;

  objectPreview: boolean;

  setObjectPreview: (value: boolean) => void;

  showUnsupportedAiMessage: (tool: AiTool) => void;

  singlePhoto: PhotoAsset | null;

  dualPhotos: [PhotoAsset | null, PhotoAsset | null];

  activeDualSlot: 0 | 1;

  activePhoto: PhotoAsset | null;

  setActiveDualSlot: (slot: 0 | 1) => void;

  selectMode: (mode: PhotoMode) => void;

  selectPreset: (preset: SizePreset, source: "visa" | "rsizes") => void;

  swapDualPhotos: () => void;

  removeActivePhoto: () => void;

  resetEditor: () => void;

  fileInputRef: RefObject<HTMLInputElement | null>;

  uploadError: string;

  isDragging: boolean;

  setIsDragging: (value: boolean) => void;

  isDraggingEnter: () => void;

  handleFileInput: (event: ChangeEvent<HTMLInputElement>) => void;

  handleDrop: (event: DragEvent<HTMLDivElement>) => void;

  processFile: (file?: File) => Promise<void>;

  applyCroppedDataUrl: (dataUrl: string, fileName?: string) => Promise<string>;

  openFilePicker: () => void;

  brightness: number;
  contrast: number;
  saturation: number;
  sharp: number;

  setBrightness: (value: number) => void;

  setContrast: (value: number) => void;

  setSaturation: (value: number) => void;

  setSharp: (value: number) => void;

  zoom: number;
  rotation: number;
  flipX: boolean;

  setZoom: (value: number) => void;

  setRotation: (value: number) => void;

  setFlipX: (value: boolean) => void;

  filterString: string;

  downloadEdited: () => Promise<void>;

  printEdited: () => Promise<void>;

  saveEdited: () => Promise<void>;

  saveNotice: string;

  generatedPhotos: string[];

  loadHistoryImage: (dataUrl: string) => Promise<void>;

  scanOpen: boolean;

  setScanOpen: (value: boolean) => void;
};

const ManualEditorContext = createContext<ManualEditorContextValue | null>(
  null,
);

/* -------------------------------------------------------------------------- */
/*                               Provider                                     */
/* -------------------------------------------------------------------------- */

export function ManualEditorProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [loading, setLoading] = useState(true);

  const [showCreditBanner, setShowCreditBanner] = useState(true);

  const [photoMode, setPhotoMode] = useState<PhotoMode>("passport");

  const [selectedPreset, setSelectedPreset] = useState<SizePreset | null>(null);

  const [sizeMenu, setSizeMenu] = useState<"visa" | "rsizes" | null>(null);

  const [freeSizeOpen, setFreeSizeOpen] = useState(false);

  const [freeWidth, setFreeWidth] = useState(45);

  const [freeHeight, setFreeHeight] = useState(55);

  const [selectedBg, setSelectedBg] = useState("white");

  const [customBg, setCustomBg] = useState("#ffffff");

  const [activeAiTool, setActiveAiTool] = useState<AiTool | null>(null);

  const [aiNotice, setAiNotice] = useState("");

  const [objectTab, setObjectTab] = useState<ObjectTab>("face");

  const [objectBrightness, setObjectBrightness] = useState(200);

  const [objectContrast, setObjectContrast] = useState(200);

  const [shadowStrength, setShadowStrength] = useState(100);

  const [brushSize, setBrushSize] = useState(4);

  const [objectPreview, setObjectPreview] = useState(false);

  const [singlePhoto, setSinglePhoto] = useState<PhotoAsset | null>(null);

  const [dualPhotos, setDualPhotos] = useState<
    [PhotoAsset | null, PhotoAsset | null]
  >([null, null]);

  const [activeDualSlot, setActiveDualSlot] = useState<0 | 1>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadError, setUploadError] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  const [brightness, setBrightness] = useState(DEFAULT_FILTERS.brightness);

  const [contrast, setContrast] = useState(DEFAULT_FILTERS.contrast);

  const [saturation, setSaturation] = useState(DEFAULT_FILTERS.saturation);

  const [sharp, setSharp] = useState(DEFAULT_FILTERS.sharp);

  const [zoom, setZoom] = useState(100);

  const [rotation, setRotation] = useState(0);

  const [flipX, setFlipX] = useState(false);

  const [generatedPhotos, setGeneratedPhotos] = useState<string[]>([]);

  const [saveNotice, setSaveNotice] = useState("");

  const [scanOpen, setScanOpen] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*                              Auth                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));

    const token = tokenCookie ? tokenCookie.slice("token=".length) : null;

    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      localStorage.clear();
      sessionStorage.clear();

      document.cookie =
        "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

      window.location.href = "/login";

      return;
    }

    setIsAuthenticated(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    const history = JSON.parse(
      localStorage.getItem("manual-editor-history") || "[]",
    ) as string[];

    setGeneratedPhotos(history.slice(0, 8));
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                           Keyboard shortcut                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "u") {
        event.preventDefault();

        fileInputRef.current?.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                            Derived state                                  */
  /* ------------------------------------------------------------------------ */

  const activePhoto =
    photoMode === "dual" ? dualPhotos[activeDualSlot] : singlePhoto;

  const currentPreset = useMemo<SizePreset>(() => {
    if (photoMode === "passport" || photoMode === "dual") {
      return PASSPORT_PRESET;
    }

    if (photoMode === "visa") {
      if (
        selectedPreset &&
        VISA_PRESETS.some((preset) => preset.id === selectedPreset.id)
      ) {
        return selectedPreset;
      }

      return VISA_PRESETS[0];
    }

    if (photoMode === "rsizes") {
      if (
        selectedPreset &&
        R_SIZE_PRESETS.some((preset) => preset.id === selectedPreset.id)
      ) {
        return selectedPreset;
      }

      return R_SIZE_PRESETS[0];
    }

    return {
      id: "free",
      label: `${freeWidth} × ${freeHeight} mm`,
      widthMm: freeWidth,
      heightMm: freeHeight,
    };
  }, [photoMode, selectedPreset, freeWidth, freeHeight]);

  const activeBackground =
    selectedBg === "custom"
      ? customBg
      : BACKGROUNDS.find((item) => item.id === selectedBg)?.color || "#ffffff";

  /* ------------------------------------------------------------------------ */
  /*                              Assets                                       */
  /* ------------------------------------------------------------------------ */

  const createPhotoAsset = useCallback(
    async (file: File): Promise<PhotoAsset> => {
      const url = URL.createObjectURL(file);

      try {
        const img = await loadImage(url);

        return {
          file,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
      } catch (error) {
        URL.revokeObjectURL(url);
        throw error;
      }
    },
    [],
  );

  const resetTransforms = useCallback(() => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharp(0);
    setZoom(100);
    setRotation(0);
    setFlipX(false);
  }, []);

  const replaceActivePhoto = useCallback(
    (asset: PhotoAsset) => {
      if (photoMode === "dual") {
        setDualPhotos((current) => {
          const next = [...current] as [PhotoAsset | null, PhotoAsset | null];

          revokeAsset(next[activeDualSlot]);

          next[activeDualSlot] = asset;

          return next;
        });
      } else {
        setSinglePhoto((current) => {
          revokeAsset(current);
          return asset;
        });
      }
    },
    [activeDualSlot, photoMode],
  );

  const processFile = useCallback(
    async (file?: File) => {
      if (!file) {
        return;
      }

      setUploadError("");

      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setUploadError("Please upload a JPG, JPEG, PNG or WEBP image.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadError("Image size must be 10 MB or less.");
        return;
      }

      try {
        const asset = await createPhotoAsset(file);

        replaceActivePhoto(asset);

        resetTransforms();

        setUploadError("");
      } catch {
        setUploadError(
          "This image could not be read. Please choose another image.",
        );
      }
    },
    [createPhotoAsset, replaceActivePhoto, resetTransforms],
  );

  const applyCroppedDataUrl = useCallback(
    async (dataUrl: string, name = "cropped-photo.png") => {
      const response = await fetch(dataUrl);

      const blob = await response.blob();

      const file = new File([blob], name, {
        type: blob.type || "image/png",
      });

      const asset = await createPhotoAsset(file);

      replaceActivePhoto(asset);

      resetTransforms();

      return asset.url;
    },
    [createPhotoAsset, replaceActivePhoto, resetTransforms],
  );

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void processFile(event.target.files?.[0]);

      event.target.value = "";
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragging(false);

      void processFile(event.dataTransfer.files?.[0]);
    },
    [processFile],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isDraggingEnter = useCallback(() => {
    setIsDragging(true);
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                           Size selection                                  */
  /* ------------------------------------------------------------------------ */

  const selectMode = useCallback(
    (mode: PhotoMode) => {
      setPhotoMode(mode);

      setSizeMenu(null);

      setFreeSizeOpen(mode === "freesize");

      if (mode === "visa") {
        setSelectedPreset((current) =>
          current && VISA_PRESETS.some((preset) => preset.id === current.id)
            ? current
            : VISA_PRESETS[0],
        );
      } else if (mode === "rsizes") {
        setSelectedPreset((current) =>
          current && R_SIZE_PRESETS.some((preset) => preset.id === current.id)
            ? current
            : R_SIZE_PRESETS[0],
        );
      } else {
        setSelectedPreset(null);
      }

      resetTransforms();
    },
    [resetTransforms],
  );

  const selectPreset = useCallback(
    (preset: SizePreset, source: "visa" | "rsizes") => {
      setPhotoMode(source);

      setSelectedPreset(preset);

      setSizeMenu(null);
      setFreeSizeOpen(false);
    },
    [],
  );

  /* ------------------------------------------------------------------------ */
  /*                          Photo controls                                   */
  /* ------------------------------------------------------------------------ */

  const removeActivePhoto = useCallback(() => {
    if (photoMode === "dual") {
      setDualPhotos((current) => {
        const next = [...current] as [PhotoAsset | null, PhotoAsset | null];

        revokeAsset(next[activeDualSlot]);

        next[activeDualSlot] = null;

        return next;
      });
    } else {
      setSinglePhoto((current) => {
        revokeAsset(current);
        return null;
      });
    }

    resetTransforms();
  }, [activeDualSlot, photoMode, resetTransforms]);

  const swapDualPhotos = useCallback(() => {
    setDualPhotos(([a, b]) => [b, a]);
  }, []);

  const resetEditor = useCallback(() => {
    resetTransforms();

    setSelectedBg("white");
    setCustomBg("#ffffff");

    setActiveAiTool(null);
    setAiNotice("");

    setSizeMenu(null);
    setFreeSizeOpen(false);
  }, [resetTransforms]);

  /* ------------------------------------------------------------------------ */
  /*                           Preview filter                                  */
  /* ------------------------------------------------------------------------ */

  const filterString = useMemo(() => {
    const standard = buildStandardFilter(brightness, contrast, saturation);

    /*
     * Keep the preview filter order equal to the canvas export order:
     *
     * brightness → contrast → saturation → sharpness
     */
    if (sharp > 0) {
      return `${standard} url(#sharpness-filter)`;
    }

    if (sharp < 0) {
      return `${standard} blur(${(-sharp / 100) * 3}px)`;
    }

    return standard;
  }, [brightness, contrast, saturation, sharp]);

  /* ------------------------------------------------------------------------ */
  /*                    SINGLE SOURCE OF TRUTH RENDERER                       */
  /* ------------------------------------------------------------------------ */

  const renderCurrentCanvas = useCallback(async () => {
    const hasRenderablePhoto =
      photoMode === "dual" ? dualPhotos.some(Boolean) : Boolean(activePhoto);

    if (!hasRenderablePhoto) {
      return null;
    }

    const targetW = mmToPx(currentPreset.widthMm);

    const targetH = mmToPx(currentPreset.heightMm);

    const canvas = document.createElement("canvas");

    canvas.width = photoMode === "dual" ? targetW * 2 : targetW;

    canvas.height = targetH;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    ctx.imageSmoothingEnabled = true;

    ctx.imageSmoothingQuality = "high";

    /* ---------------------------- Background ------------------------- */

    ctx.fillStyle = activeBackground;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* ----------------------------- Single ----------------------------- */

    if (photoMode !== "dual") {
      if (!activePhoto) {
        return null;
      }

      const layer = await createAdjustedImageLayer(
        activePhoto,
        targetW,
        targetH,
        zoom,
        rotation,
        flipX,
        brightness,
        contrast,
        saturation,
        sharp,
      );

      ctx.drawImage(layer, 0, 0, targetW, targetH);

      return canvas;
    }

    /* ------------------------------ Dual ------------------------------ */

    const left = dualPhotos[0];

    const right = dualPhotos[1];

    if (left) {
      const leftLayer = await createAdjustedImageLayer(
        left,
        targetW,
        targetH,
        zoom,
        rotation,
        flipX,
        brightness,
        contrast,
        saturation,
        sharp,
      );

      ctx.drawImage(leftLayer, 0, 0, targetW, targetH);
    }

    if (right) {
      const rightLayer = await createAdjustedImageLayer(
        right,
        targetW,
        targetH,
        zoom,
        rotation,
        flipX,
        brightness,
        contrast,
        saturation,
        sharp,
      );

      ctx.drawImage(rightLayer, targetW, 0, targetW, targetH);
    }

    return canvas;
  }, [
    activePhoto,
    activeBackground,
    brightness,
    contrast,
    currentPreset,
    dualPhotos,
    flipX,
    photoMode,
    rotation,
    saturation,
    sharp,
    zoom,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                              Download                                     */
  /* ------------------------------------------------------------------------ */

  const downloadEdited = useCallback(async () => {
    const canvas = await renderCurrentCanvas();

    if (!canvas) {
      return;
    }

    const primaryAsset = activePhoto || dualPhotos.find(Boolean) || null;

    const link = document.createElement("a");

    link.download = primaryAsset
      ? fileName(primaryAsset.file.name)
      : "manual-editor-edited.png";

    link.href = canvas.toDataURL("image/png");

    document.body.appendChild(link);

    link.click();

    link.remove();
  }, [activePhoto, dualPhotos, renderCurrentCanvas]);

  /* ------------------------------------------------------------------------ */
  /*                               Print                                       */
  /* ------------------------------------------------------------------------ */

  const printEdited = useCallback(async () => {
    /*
     * IMPORTANT:
     * Never pass activePhoto.url directly to the print window.
     *
     * renderCurrentCanvas() is the single source of truth and already
     * contains:
     *   - brightness
     *   - contrast
     *   - saturation
     *   - sharpness
     *   - background
     *   - crop/fit geometry
     *   - zoom
     *   - rotation
     *   - mirror
     *   - dual layout
     */
    const canvas = await renderCurrentCanvas();

    if (!canvas) {
      return;
    }

    const blob = await canvasToBlob(canvas, "image/png");

    if (!blob) {
      return;
    }

    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open("", "_blank", "width=900,height=900");

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);

      return;
    }

    const doc = printWindow.document;

    doc.open();

    doc.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Print Photo</title>

            <style>
              html,
              body {
                margin: 0;
                padding: 0;
                width: 100%;
                min-height: 100%;
                background: #ffffff;
              }

              body {
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .print-page {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .print-page img {
                display: block;
                width: 100%;
                height: auto;
                max-width: 100%;
                object-fit: contain;
              }

              @page {
                margin: 0;
              }

              @media print {
                html,
                body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  min-height: 100%;
                }

                .print-page {
                  width: 100%;
                  height: auto;
                }

                .print-page img {
                  width: 100%;
                  height: auto;
                  max-width: 100%;
                }
              }
            </style>
          </head>

          <body>
            <div class="print-page">
              <img
                id="manual-editor-print-image"
                alt="Edited photo"
              />
            </div>
          </body>
        </html>
      `);

    doc.close();

    const image = doc.getElementById(
      "manual-editor-print-image",
    ) as HTMLImageElement | null;

    if (!image) {
      URL.revokeObjectURL(blobUrl);

      printWindow.close();

      return;
    }

    let cleaned = false;

    const cleanup = () => {
      if (cleaned) {
        return;
      }

      cleaned = true;

      URL.revokeObjectURL(blobUrl);

      try {
        printWindow.close();
      } catch {
        // Ignore close errors.
      }
    };

    printWindow.addEventListener("afterprint", cleanup, {
      once: true,
    });

    image.onload = () => {
      /*
       * Give the print document one paint cycle so the browser has the
       * baked Canvas image fully decoded before opening print preview.
       */
      window.setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          cleanup();
        }
      }, 80);
    };

    image.onerror = () => {
      cleanup();
    };

    image.src = blobUrl;
  }, [renderCurrentCanvas]);

  /* ------------------------------------------------------------------------ */
  /*                                Save                                       */
  /* ------------------------------------------------------------------------ */

  const saveEdited = useCallback(async () => {
    const canvas = await renderCurrentCanvas();

    if (!canvas) {
      return;
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setGeneratedPhotos((current) => {
      const next = [
        dataUrl,
        ...current.filter((item) => item !== dataUrl),
      ].slice(0, 8);

      localStorage.setItem("manual-editor-history", JSON.stringify(next));

      return next;
    });

    setSaveNotice("Saved successfully");

    window.setTimeout(() => setSaveNotice(""), 1800);
  }, [renderCurrentCanvas]);

  /* ------------------------------------------------------------------------ */
  /*                             History                                       */
  /* ------------------------------------------------------------------------ */

  const loadHistoryImage = useCallback(
    async (dataUrl: string) => {
      const response = await fetch(dataUrl);

      const blob = await response.blob();

      const file = new File([blob], "manual-editor-history.jpg", {
        type: blob.type || "image/jpeg",
      });

      const asset = await createPhotoAsset(file);

      replaceActivePhoto(asset);
    },
    [createPhotoAsset, replaceActivePhoto],
  );

  /* ------------------------------------------------------------------------ */
  /*                             AI helpers                                    */
  /* ------------------------------------------------------------------------ */

  const showUnsupportedAiMessage = useCallback((tool: AiTool) => {
    const names: Record<AiTool, string> = {
      face: "AI Face Enhance",
      object: "Object Adjust",
      transparent: "Transparent",
      upscale: "Upscale",
      cutout: "Cutout Editor",
    };

    setActiveAiTool(tool);

    setAiNotice(
      `${names[tool]} UI is ready. Python/image-processing service will be connected in the final backend step.`,
    );
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                               Context                                     */
  /* ------------------------------------------------------------------------ */

  const value = {
    isAuthenticated,
    loading,

    showCreditBanner,
    setShowCreditBanner,

    photoMode,
    setPhotoMode,

    selectedPreset,
    setSelectedPreset,

    freeWidth,
    freeHeight,

    setFreeWidth,
    setFreeHeight,

    sizeMenu,
    setSizeMenu,

    freeSizeOpen,
    setFreeSizeOpen,

    currentPreset,

    selectedBg,
    setSelectedBg,

    customBg,
    setCustomBg,

    activeBackground,

    activeAiTool,
    setActiveAiTool,

    aiNotice,
    setAiNotice,

    objectTab,
    setObjectTab,

    objectBrightness,
    objectContrast,
    shadowStrength,
    brushSize,

    setObjectBrightness,
    setObjectContrast,
    setShadowStrength,
    setBrushSize,

    objectPreview,
    setObjectPreview,

    showUnsupportedAiMessage,

    singlePhoto,
    dualPhotos,

    activeDualSlot,
    activePhoto,

    setActiveDualSlot,

    selectMode,
    selectPreset,

    swapDualPhotos,
    removeActivePhoto,
    resetEditor,

    fileInputRef,

    uploadError,

    isDragging,
    setIsDragging,
    isDraggingEnter,

    handleFileInput,
    handleDrop,

    processFile,
    applyCroppedDataUrl,
    openFilePicker,

    brightness,
    contrast,
    saturation,
    sharp,

    setBrightness,
    setContrast,
    setSaturation,
    setSharp,

    zoom,
    rotation,
    flipX,

    setZoom,
    setRotation,
    setFlipX,

    filterString,

    downloadEdited,
    printEdited,
    saveEdited,

    saveNotice,

    generatedPhotos,
    loadHistoryImage,

    scanOpen,
    setScanOpen,
  } satisfies ManualEditorContextValue;

  return (
    <ManualEditorContext.Provider value={value}>
      {children}
    </ManualEditorContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Hook                                         */
/* -------------------------------------------------------------------------- */

export function useManualEditor(): ManualEditorContextValue {
  const context = useContext(ManualEditorContext);

  if (!context) {
    throw new Error("useManualEditor must be used inside ManualEditorProvider");
  }

  return context;
}
