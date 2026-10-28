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
  type DragEvent,
  type ReactNode,
  type RefObject,
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

import { getClientSession } from "@/lib/clientAuth";
import { canvasToBlob, fitSize, releaseCanvas } from "./canvasUtils";
import {
  cancelCurrentAiOperation,
  enhanceFacesWithTransformers,
  preloadUpscaler,
  upscaleImageWithEsrgan,
} from "./aiEnhancement";
import { renderObjectAdjust } from "./objectAdjust";
import { applyCssFilterPixels, isNeutralCssFilter, supportsCanvasFilter } from "./photoTools";
import {
  MIN_SELECTION_COVERAGE,
  clearSegmenterImageCache,
  detectTargetMask,
  disposeSegmenter,
  preloadBackgroundRemoval,
  preloadSegmenter,
  removeBackgroundFromImage,
} from "./segmentation";
import { useManualEditorText } from "./manualEditorI18n";
import type {
  AiTool,
  ObjectBrushMode,
  ObjectTab,
  PhotoAsset,
  PhotoMode,
  SizePreset,
} from "./types";

/*
 * Longest side of the image produced by "Apply" in Object Adjust.
 * Keeps memory use sane on very large uploads.
 */
const MAX_ADJUST_SIDE = 3200;

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

    img.onerror = () => reject(new Error("Unable to load image."));

    img.src = url;
  });
}

function getManualHistoryStorageKey(userId: string | null | undefined) {
  return userId ? `manual-editor-history:${userId}` : null;
}

function fileName(name: string) {
  return `${
    name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-") ||
    "manual-editor"
  }-edited.png`;
}

async function dataUrlToFile(dataUrl: string, name: string) {
  const response = await fetch(dataUrl);

  const blob = await response.blob();

  return new File([blob], name, {
    type: blob.type || "image/png",
  });
}

function presetBelongsToMode(
  preset: SizePreset | null,
  mode: "visa" | "rsizes",
) {
  if (!preset) {
    return false;
  }

  const collection = mode === "visa" ? VISA_PRESETS : R_SIZE_PRESETS;

  return collection.some((item) => item.id === preset.id);
}

export type ManualEditorContextValue = {
  isAuthenticated: boolean;

  loading: boolean;

  photoMode: PhotoMode;

  setPhotoMode: (value: PhotoMode) => void;

  selectedPreset: SizePreset | null;

  setSelectedPreset: (value: SizePreset | null) => void;

  freeWidth: number;

  freeHeight: number;

  setFreeWidth: (value: number) => void;

  setFreeHeight: (value: number) => void;

  sizeMenu: "visa" | "rsizes" | null;

  setSizeMenu: (value: "visa" | "rsizes" | null) => void;

  freeSizeOpen: boolean;

  setFreeSizeOpen: (value: boolean) => void;

  currentPreset: SizePreset;

  selectedBg: string;

  setSelectedBg: (value: string) => void;

  customBg: string;

  setCustomBg: (value: string) => void;

  activeBackground: string;

  /*
   * Canonical background removal state.
   */
  backgroundRemoved: boolean;

  /*
   * Backward-compatible alias.
   * Older components can safely use this name too.
   */
  isBackgroundRemoved: boolean;

  /*
   * Public setter.
   * Prevents runtime errors in older components
   * that still call setBackgroundRemoved(...).
   */
  setBackgroundRemoved: (value: boolean) => void;

  isRemovingBackground: boolean;

  handleRemoveBackground: () => Promise<void>;

  activeAiTool: AiTool | null;

  setActiveAiTool: (value: AiTool | null) => void;

  aiNotice: string;

  setAiNotice: (value: string) => void;

  objectTab: ObjectTab;

  setObjectTab: (value: ObjectTab) => void;

  objectBrightness: number;

  objectContrast: number;

  objectSaturation: number;

  objectHue: number;

  shadowStrength: number;

  brushSize: number;

  setObjectBrightness: (value: number) => void;

  setObjectContrast: (value: number) => void;

  setObjectSaturation: (value: number) => void;

  setObjectHue: (value: number) => void;

  setShadowStrength: (value: number) => void;

  setBrushSize: (value: number) => void;

  objectPreview: boolean;

  setObjectPreview: (value: boolean) => void;

  objectBrushMode: ObjectBrushMode;

  setObjectBrushMode: (value: ObjectBrushMode) => void;

  objectMaskDataUrl: string | null;

  objectMaskBusy: boolean;

  objectApplyBusy: boolean;

  objectMaskRequest: (target?: ObjectTab) => Promise<void>;

  commitObjectMask: (dataUrl: string) => void;

  undoObjectMask: () => void;

  redoObjectMask: () => void;

  resetObjectMask: () => Promise<void>;

  applyObjectAdjust: () => Promise<void>;

  cancelObjectAdjust: () => void;

  resetObjectAdjust: () => Promise<void>;

  showUnsupportedAiMessage: (tool: AiTool) => void;

  aiProcessing: "upscale" | "face" | null;

  aiProgress: number;

  cancelAiProcessing: () => void;

  runUpscale: () => Promise<void>;

  runFaceEnhance: () => Promise<void>;

  singlePhoto: PhotoAsset | null;

  dualPhotos: [PhotoAsset | null, PhotoAsset | null];

  activeDualSlot: 0 | 1;

  activePhoto: PhotoAsset | null;

  comparisonOriginalFile: File | null;

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

  applyCutoutFile: (file: File, originalFile?: File) => Promise<string>;

  applyRetouchedFile: (file: File, originalFile?: File) => Promise<string>;

  cropAvailable: boolean;

  consumeCrop: () => void;

  openFilePicker: () => void;

  brightness: number;

  contrast: number;

  saturation: number;

  sharp: number;

  setBrightness: (value: number) => void;

  setContrast: (value: number) => void;

  setSaturation: (value: number) => void;

  setSharp: (value: number) => void;

  hue: number;

  sepia: number;

  grayscale: number;

  setHue: (value: number) => void;

  setSepia: (value: number) => void;

  setGrayscale: (value: number) => void;

  zoom: number;

  rotation: number;

  flipX: boolean;

  setZoom: (value: number) => void;

  setRotation: (value: number) => void;

  setFlipX: (value: boolean) => void;

  downloadEdited: (format?: "png" | "jpeg" | "webp", quality?: number) => Promise<void>;

  printEdited: () => Promise<void>;

  printStudioOpen: boolean;

  printStudioImage: string | null;

  closePrintStudio: () => void;

  openPrintStudioWithImage: (image: string) => void;

  saveEdited: () => Promise<void>;

  isSavingEdited: boolean;

  saveNotice: string;

  generatedPhotos: GeneratedPhoto[];

  loadHistoryImage: (photo: GeneratedPhoto) => Promise<void>;

  downloadHistoryImage: (photo: GeneratedPhoto) => Promise<void>;

  printHistoryImage: (photo: GeneratedPhoto) => Promise<void>;

  deleteHistoryImage: (photo: GeneratedPhoto) => Promise<void>;

  scanOpen: boolean;

  setScanOpen: (value: boolean) => void;
};

export type GeneratedPhoto = {
  id: string;
  url: string;
  publicId?: string;
  createdAt?: string;
  updatedAt?: string;
  size?: string;
  sizeType?: string;
  widthPx?: number;
  heightPx?: number;
  dpi?: number;
};

const ManualEditorContext = createContext<ManualEditorContextValue | null>(
  null,
);

function applyCanvasSharpness(
  ctx: CanvasRenderingContext2D,
  strengthValue: number,
) {
  const strength = Math.min(
    0.45,
    Math.max(0, (Number(strengthValue) / 100) * 0.45),
  );

  if (strength <= 0) {
    return;
  }

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  if (width < 3 || height < 3) {
    return;
  }

  const image = ctx.getImageData(0, 0, width, height);

  const source = image.data;

  const copy = new Uint8ClampedArray(source);

  const clampChannel = (value: number) => Math.min(255, Math.max(0, value));

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;

      const alpha = source[index + 3];

      if (alpha < 8) {
        continue;
      }

      const north = index - width * 4;

      const south = index + width * 4;

      const west = index - 4;

      const east = index + 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const center = copy[index + channel];

        const neighbours =
          (copy[north + channel] +
            copy[south + channel] +
            copy[west + channel] +
            copy[east + channel]) /
          4;

        const sharpened = center + (center - neighbours) * strength * 4;

        source[index + channel] = clampChannel(sharpened);
      }
    }
  }

  ctx.putImageData(image, 0, 0);
}

export function ManualEditorProvider({ children }: { children: ReactNode }) {
  const { t } = useManualEditorText();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [photoMode, setPhotoMode] = useState<PhotoMode>("passport");

  const [selectedPreset, setSelectedPresetState] = useState<SizePreset | null>(
    null,
  );

  const [sizeMenu, setSizeMenu] = useState<"visa" | "rsizes" | null>(null);

  const [freeSizeOpen, setFreeSizeOpen] = useState(false);

  const [freeWidth, setFreeWidth] = useState(45);

  const [freeHeight, setFreeHeight] = useState(55);

  const [selectedBg, setSelectedBgState] = useState("white");

  const [customBg, setCustomBgState] = useState("#ffffff");

  const [backgroundRemoved, setBackgroundRemoved] = useState(false);

  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  const [activeAiTool, setActiveAiTool] = useState<AiTool | null>(null);

  const [aiNotice, setAiNotice] = useState("");

  const [aiProcessing, setAiProcessing] = useState<"upscale" | "face" | null>(
    null,
  );

  const [aiProgress, setAiProgress] = useState(0);

  const [objectTab, setObjectTabState] = useState<ObjectTab>("face");

  const [objectBrightness, setObjectBrightness] = useState(100);

  const [objectContrast, setObjectContrast] = useState(100);

  const [objectSaturation, setObjectSaturation] = useState(100);

  const [objectHue, setObjectHue] = useState(0);

  const [shadowStrength, setShadowStrength] = useState(100);

  const [brushSize, setBrushSize] = useState(20);

  /*
   * true means the soft blue selection overlay is visible.
   * The adjustment preview itself remains independent.
   */
  const [objectPreview, setObjectPreview] = useState(false);

  const [objectBrushMode, setObjectBrushMode] =
    useState<ObjectBrushMode>("brush");

  const [singlePhoto, setSinglePhoto] = useState<PhotoAsset | null>(null);

  const [dualPhotos, setDualPhotos] = useState<
    [PhotoAsset | null, PhotoAsset | null]
  >([null, null]);

  /*
   * Immutable Compare baseline for the current editing session.
   * A fresh upload is the temporary baseline until the one-time crop stage
   * completes. Once cropping is applied, the cropped image becomes the
   * session's true Original and is never overwritten by downstream edits
   * such as Object Adjust, AI Enhance, Upscale, or Background Remove.
   */
  const [singleCompareOriginalFile, setSingleCompareOriginalFile] =
    useState<File | null>(null);

  const [dualCompareOriginalFiles, setDualCompareOriginalFiles] = useState<
    [File | null, File | null]
  >([null, null]);

  const [activeDualSlot, setActiveDualSlot] = useState<0 | 1>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadError, setUploadError] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  const [brightness, setBrightness] = useState(DEFAULT_FILTERS.brightness);

  const [contrast, setContrast] = useState(DEFAULT_FILTERS.contrast);

  const [saturation, setSaturation] = useState(DEFAULT_FILTERS.saturation);

  const [sharp, setSharp] = useState(DEFAULT_FILTERS.sharp);
  const [hue, setHue] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);

  const [zoom, setZoom] = useState(100);

  const [rotation, setRotation] = useState(0);

  const [flipX, setFlipX] = useState(false);

  const [generatedPhotos, setGeneratedPhotos] = useState<GeneratedPhoto[]>([]);

  const [saveNotice, setSaveNotice] = useState("");
  const [isSavingEdited, setIsSavingEdited] = useState(false);

  const [printStudioOpen, setPrintStudioOpen] = useState(false);
  const [printStudioImage, setPrintStudioImage] = useState<string | null>(null);

  const [scanOpen, setScanOpen] = useState(false);

  const [cropAvailable, setCropAvailable] = useState(false);

  const [objectMaskHistory, setObjectMaskHistory] = useState<
    Array<string | null>
  >([null]);

  const [objectMaskHistoryIndex, setObjectMaskHistoryIndex] = useState(0);

  const [objectMaskBusy, setObjectMaskBusy] = useState(false);

  const [objectApplyBusy, setObjectApplyBusy] = useState(false);

  const objectRequestId = useRef(0);

  const activePhoto =
    photoMode === "dual" ? dualPhotos[activeDualSlot] : singlePhoto;

  const liveAssetsRef = useRef<{
    singlePhoto: PhotoAsset | null;
    dualPhotos: [PhotoAsset | null, PhotoAsset | null];
  }>({
    singlePhoto: null,
    dualPhotos: [null, null],
  });

  useEffect(() => {
    liveAssetsRef.current = { singlePhoto, dualPhotos };
  }, [singlePhoto, dualPhotos]);

  const comparisonOriginalFile =
    photoMode === "dual"
      ? dualCompareOriginalFiles[activeDualSlot]
      : singleCompareOriginalFile;

  const objectMaskDataUrl = objectMaskHistory[objectMaskHistoryIndex] ?? null;

  /*
   * Warm the Object Adjust segmentation worker shortly after an image is
   * available. The model load happens off the main thread, so the editor
   * remains interactive while the first-use assets are cached.
   */
  useEffect(() => {
    // Drop masks belonging to the previous image as soon as the active photo
    // changes. The MediaPipe model itself stays warm in the worker so the next
    // Object Adjust action remains fast without retaining large Float32Array
    // results for old images.
    clearSegmenterImageCache();

    if (!activePhoto?.url) return;

    const timer = window.setTimeout(() => {
      void preloadSegmenter().catch(() => undefined);
    }, 250);

    /*
     * Background removal and Upscale are the two slow-start tools: they must
     * download a model and start a runtime before the first pixel is touched.
     * Do that quietly once a photo is on the canvas (staggered, so the page
     * stays responsive) so the button click only pays for the real work.
     */
    const bgTimer = window.setTimeout(() => {
      void preloadBackgroundRemoval();
    }, 1200);

    const upscaleTimer = window.setTimeout(() => {
      preloadUpscaler();
    }, 2400);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(bgTimer);
      window.clearTimeout(upscaleTimer);
    };
  }, [activePhoto?.url]);

  useEffect(() => {
    return () => {
      cancelCurrentAiOperation();
      disposeSegmenter();

      const { singlePhoto: liveSingle, dualPhotos: liveDual } =
        liveAssetsRef.current;

      revokeAsset(liveSingle);
      revokeAsset(liveDual[0]);
      revokeAsset(liveDual[1]);
    };
  }, []);

  const currentPreset = useMemo<SizePreset>(() => {
    if (photoMode === "passport" || photoMode === "dual") {
      return PASSPORT_PRESET;
    }

    if (photoMode === "visa") {
      return presetBelongsToMode(selectedPreset, "visa")
        ? (selectedPreset as SizePreset)
        : VISA_PRESETS[0];
    }

    if (photoMode === "rsizes") {
      return presetBelongsToMode(selectedPreset, "rsizes")
        ? (selectedPreset as SizePreset)
        : R_SIZE_PRESETS[0];
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
    setBrightness(DEFAULT_FILTERS.brightness);

    setContrast(DEFAULT_FILTERS.contrast);

    setSaturation(DEFAULT_FILTERS.saturation);

    setSharp(DEFAULT_FILTERS.sharp);
    setHue(0);
    setSepia(0);
    setGrayscale(0);

    setZoom(100);
    setRotation(0);
    setFlipX(false);
  }, []);

  const resetObjectValues = useCallback(() => {
    setObjectBrightness(100);
    setObjectContrast(100);
    setObjectSaturation(100);
    setObjectHue(0);
    setShadowStrength(100);
    setBrushSize(20);
    setObjectBrushMode("brush");
    setObjectPreview(false);
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

  const replacePhotoAtTarget = useCallback(
    (asset: PhotoAsset, targetMode: PhotoMode, targetSlot: 0 | 1) => {
      if (targetMode === "dual") {
        setDualPhotos((current) => {
          const next = [...current] as [PhotoAsset | null, PhotoAsset | null];
          revokeAsset(next[targetSlot]);
          next[targetSlot] = asset;
          return next;
        });
        return;
      }

      setSinglePhoto((current) => {
        revokeAsset(current);
        return asset;
      });
    },
    [],
  );

  const setSelectedBg = useCallback((value: string) => {
    setSelectedBgState(value);

    /*
     * Choosing any explicit background color
     * means the removed-background visual state
     * is no longer considered active.
     */
    setBackgroundRemoved(false);
  }, []);

  const setCustomBg = useCallback((value: string) => {
    setCustomBgState(value);
    setBackgroundRemoved(false);
  }, []);

  const resetObjectMaskHistory = useCallback((dataUrl: string | null) => {
    setObjectMaskHistory([dataUrl]);

    setObjectMaskHistoryIndex(0);
  }, []);

  const consumeCrop = useCallback(() => {
    setCropAvailable(false);
  }, []);

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

        if (photoMode === "dual") {
          setDualCompareOriginalFiles((current) => {
            const next = [...current] as [File | null, File | null];
            next[activeDualSlot] = file;
            return next;
          });
        } else {
          setSingleCompareOriginalFile(file);
        }

        resetTransforms();

        resetObjectValues();

        setBackgroundRemoved(false);

        setUploadError("");

        setObjectMaskHistory([null]);

        setObjectMaskHistoryIndex(0);

        /*
         * A newly uploaded image gets exactly
         * one crop opportunity.
         */
        setCropAvailable(true);
      } catch {
        setUploadError(
          "This image could not be read. Please choose another image.",
        );
      }
    },
    [
      activeDualSlot,
      createPhotoAsset,
      photoMode,
      replaceActivePhoto,
      resetTransforms,
      resetObjectValues,
    ],
  );

  const applyCroppedDataUrl = useCallback(
    async (dataUrl: string, name = "cropped-photo.png") => {
      const file = await dataUrlToFile(dataUrl, name);

      const asset = await createPhotoAsset(file);

      replaceActivePhoto(asset);

      /*
       * Cropping establishes the user-visible starting image for the editing
       * session. From this point onward Compare must treat the cropped result
       * as the immutable Original, not the pre-crop upload. This also keeps
       * the two Compare sides at the same dimensions/aspect ratio, preventing
       * later edits from leaking into the Original side.
       */
      if (photoMode === "dual") {
        setDualCompareOriginalFiles((current) => {
          const next = [...current] as [File | null, File | null];
          next[activeDualSlot] = file;
          return next;
        });
      } else {
        setSingleCompareOriginalFile(file);
      }

      setBackgroundRemoved(false);

      resetTransforms();

      resetObjectValues();

      setObjectMaskHistory([null]);

      setObjectMaskHistoryIndex(0);

      /*
       * Crop has now been consumed.
       * Changing presets or applying other tools
       * will never reopen the crop modal.
       */
      setCropAvailable(false);

      return asset.url;
    },
    [
      activeDualSlot,
      createPhotoAsset,
      photoMode,
      replaceActivePhoto,
      resetTransforms,
      resetObjectValues,
    ],
  );

  const applyCutoutFile = useCallback(
    async (file: File, originalFile?: File) => {
      const asset = await createPhotoAsset(file);
      replaceActivePhoto(asset);

      const compareFile = originalFile ?? file;
      if (photoMode === "dual") {
        setDualCompareOriginalFiles((current) => {
          const next = [...current] as [File | null, File | null];
          next[activeDualSlot] = compareFile;
          return next;
        });
      } else {
        setSingleCompareOriginalFile(compareFile);
      }

      // The applied PNG contains real alpha transparency. Keep that state so
      // the renderer does not paint a solid background behind the cutout.
      setBackgroundRemoved(true);
      resetTransforms();
      resetObjectValues();
      setObjectMaskHistory([null]);
      setObjectMaskHistoryIndex(0);
      setCropAvailable(false);
      setActiveAiTool(null);
      setAiNotice("Cutout applied. Choose a background color or download the transparent PNG.");

      return asset.url;
    },
    [activeDualSlot, createPhotoAsset, photoMode, replaceActivePhoto, resetTransforms, resetObjectValues],
  );

  /**
   * Replace the active photo with a retouched version (Remove / Clone / Red-eye /
   * Smooth / Blur / Pixelate). Unlike a cutout this keeps the current
   * transparent-background state, crop transforms and background colour: the
   * pixel dimensions are unchanged, so everything downstream (adjustments,
   * export, print, save) keeps working on the new pixels.
   */
  const applyRetouchedFile = useCallback(
    async (file: File, originalFile?: File) => {
      const asset = await createPhotoAsset(file);
      replaceActivePhoto(asset);

      // Keep the first original so Before/After always compares with the upload.
      if (originalFile) {
        if (photoMode === "dual") {
          setDualCompareOriginalFiles((current) => {
            const next = [...current] as [File | null, File | null];
            next[activeDualSlot] = next[activeDualSlot] ?? originalFile;
            return next;
          });
        } else {
          setSingleCompareOriginalFile((current) => current ?? originalFile);
        }
      }

      setActiveAiTool(null);
      return asset.url;
    },
    [activeDualSlot, createPhotoAsset, photoMode, replaceActivePhoto],
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

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  const isDraggingEnter = useCallback(() => setIsDragging(true), []);

  /*
   * Changing output size must never reset:
   * - crop
   * - object adjustments
   * - global image adjustments
   * - zoom
   * - rotation
   * - mirror
   */
  const selectMode = useCallback((mode: PhotoMode) => {
    setPhotoMode(mode);

    setFreeSizeOpen(mode === "freesize");

    if (mode === "visa") {
      setSelectedPresetState((current) =>
        presetBelongsToMode(current, "visa") ? current : VISA_PRESETS[0],
      );

      setSizeMenu("visa");
      return;
    }

    if (mode === "rsizes") {
      setSelectedPresetState((current) =>
        presetBelongsToMode(current, "rsizes") ? current : R_SIZE_PRESETS[0],
      );

      setSizeMenu("rsizes");
      return;
    }

    setSelectedPresetState(null);
    setSizeMenu(null);

    if (mode === "dual") {
      setActiveDualSlot(0);
    }
  }, []);

  const selectPreset = useCallback(
    (preset: SizePreset, source: "visa" | "rsizes") => {
      setPhotoMode(source);

      setSelectedPresetState(preset);

      setFreeSizeOpen(false);

      setSizeMenu(source);
    },
    [],
  );

  const removeActivePhoto = useCallback(() => {
    if (photoMode === "dual") {
      setDualPhotos((current) => {
        const next = [...current] as [PhotoAsset | null, PhotoAsset | null];

        revokeAsset(next[activeDualSlot]);

        next[activeDualSlot] = null;

        return next;
      });
      setDualCompareOriginalFiles((current) => {
        const next = [...current] as [File | null, File | null];
        next[activeDualSlot] = null;
        return next;
      });
    } else {
      setSinglePhoto((current) => {
        revokeAsset(current);
        return null;
      });
      setSingleCompareOriginalFile(null);
    }

    setBackgroundRemoved(false);

    setObjectMaskHistory([null]);

    setObjectMaskHistoryIndex(0);

    setCropAvailable(false);

    resetObjectValues();

    resetTransforms();
  }, [activeDualSlot, photoMode, resetObjectValues, resetTransforms]);

  const swapDualPhotos = useCallback(() => {
    setDualPhotos(([a, b]) => [b, a]);
    setDualCompareOriginalFiles(([a, b]) => [b, a]);
  }, []);

  const objectMaskRequest = useCallback(
    async (targetArg?: ObjectTab) => {
      const target = targetArg || objectTab;

      if (!activePhoto) {
        setAiNotice("Upload a photo first.");
        return;
      }

      const requestId = ++objectRequestId.current;

      setObjectMaskBusy(true);

      const label = `${target.charAt(0).toUpperCase()}${target.slice(1)}`;

      try {
        const image = await loadImage(activePhoto.url);

        // Runs fully in the browser with MediaPipe (model is cached after
        // the first download).
        const { maskDataUrl, coverage } = await detectTargetMask(
          image,
          activePhoto.url,
          target,
        );

        if (requestId !== objectRequestId.current) {
          return;
        }

        resetObjectMaskHistory(maskDataUrl);

        setObjectPreview(false);

        setAiNotice(
          coverage < MIN_SELECTION_COVERAGE
            ? `No ${target} area was detected. Use Brush to paint the area manually.`
            : `${label} selection ready. Use Brush or Erase to refine it.`,
        );
      } catch (error) {
        if (requestId !== objectRequestId.current) {
          return;
        }

        setAiNotice(
          error instanceof Error && error.message
            ? error.message
            : "Automatic selection failed.",
        );

        resetObjectMaskHistory(null);
      } finally {
        if (requestId === objectRequestId.current) {
          setObjectMaskBusy(false);
        }
      }
    },
    [activePhoto, objectTab, resetObjectMaskHistory],
  );

  const setObjectTab = useCallback(
    (value: ObjectTab) => {
      setObjectTabState(value);

      resetObjectValues();

      setAiNotice(
        `${value.charAt(0).toUpperCase()}${value.slice(1)} selection is being prepared…`,
      );
    },
    [resetObjectValues],
  );

  const commitObjectMask = useCallback(
    (dataUrl: string) => {
      setObjectMaskHistory((current) => {
        const base = current.slice(0, objectMaskHistoryIndex + 1);

        const latest = base[base.length - 1];

        if (latest === dataUrl) {
          return current;
        }

        return [...base, dataUrl].slice(-15);
      });

      setObjectMaskHistoryIndex((current) => Math.min(current + 1, 14));
    },
    [objectMaskHistoryIndex],
  );

  const undoObjectMask = useCallback(() => {
    setObjectMaskHistoryIndex((current) => Math.max(0, current - 1));
  }, []);

  const redoObjectMask = useCallback(() => {
    setObjectMaskHistoryIndex((current) =>
      Math.min(objectMaskHistory.length - 1, current + 1),
    );
  }, [objectMaskHistory.length]);

  const resetObjectMask = useCallback(async () => {
    await objectMaskRequest(objectTab);
  }, [objectMaskRequest, objectTab]);

  const resetObjectAdjust = useCallback(async () => {
    resetObjectValues();

    await resetObjectMask();
  }, [resetObjectMask, resetObjectValues]);

  const cancelObjectAdjust = useCallback(() => {
    objectRequestId.current += 1;

    setObjectMaskHistory([null]);

    setObjectMaskHistoryIndex(0);

    setObjectApplyBusy(false);

    setObjectMaskBusy(false);

    setObjectPreview(false);

    setActiveAiTool(null);

    setAiProcessing(null);

    setAiProgress(0);

    setAiNotice("");
  }, []);

  const applyObjectAdjust = useCallback(async () => {
    if (!activePhoto) {
      setAiNotice("Upload a photo first.");
      return;
    }

    if (!objectMaskDataUrl) {
      setAiNotice("Please wait for the selected mask to load.");
      return;
    }

    setObjectApplyBusy(true);

    try {
      const [image, maskImage] = await Promise.all([
        loadImage(activePhoto.url),
        loadImage(objectMaskDataUrl),
      ]);

      const size = fitSize(
        image.naturalWidth,
        image.naturalHeight,
        MAX_ADJUST_SIDE,
      );

      // fabric.js applies brightness / contrast / colour only inside the mask.
      const canvas = await renderObjectAdjust({
        source: image,
        mask: maskImage,
        width: size.width,
        height: size.height,
        params: {
          target: objectTab,
          brightness: objectBrightness,
          contrast: objectContrast,
          saturation: objectSaturation,
          hue: objectHue,
          shadowStrength,
        },
      });

      const blob = await canvasToBlob(canvas, "image/png");

      releaseCanvas(canvas);

      const resultFile = new File(
        [blob],
        `${activePhoto.file.name.replace(/\.[^/.]+$/, "")}-object-adjusted.png`,
        {
          type: "image/png",
        },
      );

      const resultAsset = await createPhotoAsset(resultFile);

      replaceActivePhoto(resultAsset);

      setObjectMaskHistory([null]);

      setObjectMaskHistoryIndex(0);

      setAiNotice("Object adjustment applied successfully.");

      setActiveAiTool(null);

      setObjectPreview(false);
    } catch (error) {
      setAiNotice(
        error instanceof Error && error.message
          ? error.message
          : "Object adjustment failed.",
      );
    } finally {
      setObjectApplyBusy(false);
    }
  }, [
    activePhoto,
    objectMaskDataUrl,
    objectTab,
    objectBrightness,
    objectContrast,
    objectSaturation,
    objectHue,
    shadowStrength,
    createPhotoAsset,
    replaceActivePhoto,
  ]);

  const handleRemoveBackground = useCallback(async () => {
    if (!activePhoto) {
      setAiNotice("Upload a photo first.");
      return;
    }

    setActiveAiTool("transparent");
    setIsRemovingBackground(true);

    const firstRunKey = "manual-editor-bg-removal-first-run-complete";
    const isFirstRun =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstRunKey) !== "1";

    setAiNotice(
      isFirstRun
        ? "First-time setup may take a little longer while the AI model loads."
        : "Removing background…",
    );

    try {
      // Use the exact client-side background-removal implementation used by
      // the dedicated Remove Background tool. The File avoids an unnecessary
      // re-fetch/re-encode of the current photo.
      const blob = await removeBackgroundFromImage(activePhoto.file);

      const resultFile = new File(
        [blob],
        `${activePhoto.file.name.replace(/\.[^/.]+$/, "")}-bg-removed.png`,
        {
          type: "image/png",
        },
      );

      const resultAsset = await createPhotoAsset(resultFile);

      replaceActivePhoto(resultAsset);
      setBackgroundRemoved(true);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(firstRunKey, "1");
      }

      setAiNotice("Background removed successfully.");
    } catch (error) {
      setAiNotice(
        error instanceof Error && error.message
          ? error.message
          : "Background removal failed.",
      );
    } finally {
      setIsRemovingBackground(false);
    }
  }, [
    activeDualSlot,
    activePhoto,
    createPhotoAsset,
    photoMode,
    replaceActivePhoto,
  ]);

  const cancelAiProcessing = useCallback(() => {
    if (!aiProcessing) return;

    cancelCurrentAiOperation();
    setAiNotice("AI processing cancelled.");
  }, [aiProcessing]);

  const runUpscale = useCallback(async () => {
    if (!activePhoto) {
      setAiNotice("Upload a photo first.");
      return;
    }

    if (aiProcessing) {
      return;
    }

    const sourceUrl = activePhoto.url;
    const sourceName = activePhoto.file.name;
    const targetMode = photoMode;
    const targetSlot = activeDualSlot;

    setActiveAiTool("upscale");
    setAiProcessing("upscale");
    setAiProgress(0);
    setAiNotice("Upscaling Image...");

    try {
      const image = await loadImage(sourceUrl);
      const blob = await upscaleImageWithEsrgan(image, setAiProgress, {
        onDevice: (device) => {
          if (device === "wasm") {
            setAiNotice(
              "This browser has no GPU acceleration for AI, so upscaling runs on the CPU and takes longer. Use the latest Chrome or Edge for a much faster result.",
            );
          }
        },
      });
      image.src = "";

      const resultFile = new File(
        [blob],
        `${sourceName.replace(/\.[^/.]+$/, "")}-upscaled.png`,
        {
          type: "image/png",
        },
      );

      const resultAsset = await createPhotoAsset(resultFile);

      replacePhotoAtTarget(resultAsset, targetMode, targetSlot);

      setObjectMaskHistory([null]);
      setObjectMaskHistoryIndex(0);
      setObjectPreview(false);
      setCropAvailable(false);
      setActiveAiTool("upscale");
      setAiProgress(1);
      setAiNotice("Upscale complete. The canvas has been updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setAiNotice(
        message === "AI operation cancelled."
          ? "AI processing cancelled."
          : message || "Upscaling failed.",
      );
    } finally {
      setAiProcessing(null);
      setAiProgress(0);
    }
  }, [
    activePhoto,
    activeDualSlot,
    aiProcessing,
    createPhotoAsset,
    photoMode,
    replacePhotoAtTarget,
  ]);

  const runFaceEnhance = useCallback(async () => {
    if (!activePhoto) {
      setAiNotice("Upload a photo first.");
      return;
    }

    if (aiProcessing) {
      return;
    }

    const sourceUrl = activePhoto.url;
    const sourceName = activePhoto.file.name;
    const targetMode = photoMode;
    const targetSlot = activeDualSlot;

    setActiveAiTool("face");
    setAiProcessing("face");
    setAiProgress(0);
    setAiNotice("Enhancing Face...");

    try {
      const image = await loadImage(sourceUrl);
      const result = await enhanceFacesWithTransformers(image, setAiProgress);

      const resultFile = new File(
        [result.blob],
        `${sourceName.replace(/\.[^/.]+$/, "")}-face-enhanced.png`,
        {
          type: "image/png",
        },
      );

      const resultAsset = await createPhotoAsset(resultFile);

      replacePhotoAtTarget(resultAsset, targetMode, targetSlot);

      setObjectMaskHistory([null]);
      setObjectMaskHistoryIndex(0);
      setObjectPreview(false);
      setCropAvailable(false);
      setActiveAiTool("face");
      setAiProgress(1);
      setAiNotice(
        `Face enhancement applied to ${result.faceCount} ${
          result.faceCount === 1 ? "face" : "faces"
        }. The canvas has been updated.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setAiNotice(
        message === "AI operation cancelled."
          ? "AI processing cancelled."
          : message || "Face enhancement failed.",
      );
    } finally {
      setAiProcessing(null);
      setAiProgress(0);
    }
  }, [
    activePhoto,
    activeDualSlot,
    aiProcessing,
    createPhotoAsset,
    photoMode,
    replacePhotoAtTarget,
  ]);

  const showUnsupportedAiMessage = useCallback(
    (tool: AiTool) => {
      setActiveAiTool(tool);

      if (tool === "transparent") {
        void handleRemoveBackground();
        return;
      }

      if (tool === "face") {
        void runFaceEnhance();
        return;
      }

      if (tool === "upscale") {
        void runUpscale();
        return;
      }

      if (tool === "object") {
        setObjectTabState("face");

        resetObjectValues();

        setObjectPreview(false);

        setObjectBrushMode("brush");

        setAiNotice("Face selection is being prepared…");

        return;
      }

      const names: Record<AiTool, string> = {
        face: "AI Face Enhance",
        object: "Object Adjust",
        transparent: "Transparent",
        upscale: "Upscale",
        cutout: "Cutout Editor",
        retouch: "Retouch",
        enhance: "Enhance & Restore",
      };

      setAiNotice(`${names[tool]} is not connected yet.`);
    },
    [handleRemoveBackground, resetObjectValues, runFaceEnhance, runUpscale],
  );

  const resetEditor = useCallback(() => {
    resetTransforms();

    setSelectedBgState("white");

    setCustomBgState("#ffffff");

    setBackgroundRemoved(false);

    setActiveAiTool(null);

    setAiNotice("");

    resetObjectValues();

    setObjectMaskHistory([null]);

    setObjectMaskHistoryIndex(0);
  }, [resetTransforms, resetObjectValues]);

  useEffect(() => {
    let mounted = true;

    void getClientSession().then((session) => {
      if (!mounted) return;

      if (!session.authenticated) {
        window.location.replace("/login?callbackUrl=%2Fmanual-editor");
        return;
      }

      const userId = session.user?.id || session.user?._id || null;
      if (!userId) {
        window.location.replace("/login?callbackUrl=%2Fmanual-editor");
        return;
      }

      setCurrentUserId(userId);
      try {
        window.localStorage.removeItem("manual-editor-history");
      } catch {
        // Ignore storage cleanup failures.
      }

      setIsAuthenticated(true);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};

    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadCloudHistory = useCallback(async () => {
    const loadLocalHistory = () => {
      try {
        const storageKey = getManualHistoryStorageKey(currentUserId);
        const fallback = JSON.parse(
          storageKey ? localStorage.getItem(storageKey) || "[]" : "[]",
        ) as unknown;

        setGeneratedPhotos(
          Array.isArray(fallback)
            ? fallback
                .filter((item): item is string => typeof item === "string")
                .slice(0, 8)
                .map((url) => ({ id: url, url }))
            : [],
        );
      } catch {
        setGeneratedPhotos([]);
      }
    };

    try {
      const response = await fetch("/api/ai-generations?source=manual-editor", {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
        },
        credentials: "include",
        cache: "no-store",
      });

      // Manual Editor is a free tool. Cloud history is a subscriber-only
      // feature, so for free / unsubscribed users (401/403) we quietly use
      // the local history instead of treating it as an error.
      if (response.status === 401 || response.status === 403) {
        loadLocalHistory();
        return;
      }

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to load saved generated photos.",
        );
      }

      const photos: GeneratedPhoto[] = Array.isArray(result.data)
        ? result.data
            .map((item: unknown) => {
              if (!item || typeof item !== "object") return null;

              const value = item as {
                id?: unknown;
                url?: unknown;
                publicId?: unknown;
                createdAt?: unknown;
                updatedAt?: unknown;
                size?: unknown;
                sizeType?: unknown;
                widthPx?: unknown;
                heightPx?: unknown;
                dpi?: unknown;
              };

              if (typeof value.url !== "string" || !value.url) return null;

              return {
                id: typeof value.id === "string" ? value.id : value.url,
                url: value.url,
                publicId:
                  typeof value.publicId === "string"
                    ? value.publicId
                    : undefined,
                createdAt:
                  typeof value.createdAt === "string"
                    ? value.createdAt
                    : undefined,
                updatedAt:
                  typeof value.updatedAt === "string"
                    ? value.updatedAt
                    : undefined,
                size: typeof value.size === "string" ? value.size : undefined,
                sizeType:
                  typeof value.sizeType === "string"
                    ? value.sizeType
                    : undefined,
                widthPx:
                  typeof value.widthPx === "number" ? value.widthPx : undefined,
                heightPx:
                  typeof value.heightPx === "number"
                    ? value.heightPx
                    : undefined,
                dpi: typeof value.dpi === "number" ? value.dpi : undefined,
              };
            })
            .filter((item: unknown): item is GeneratedPhoto => Boolean(item))
            .slice(0, 8)
        : [];

      setGeneratedPhotos(photos);

      const storageKey = getManualHistoryStorageKey(currentUserId);
      if (storageKey) {
        localStorage.setItem(
          storageKey,
          JSON.stringify(photos.map((item: GeneratedPhoto) => item.url)),
        );
      }
    } catch (error) {
      console.warn("Failed to load Manual Editor history from MongoDB:", error);

      loadLocalHistory();
    }
  }, [currentUserId, getAuthHeaders]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;
    void loadCloudHistory();
  }, [isAuthenticated, currentUserId, loadCloudHistory]);

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

  /*
   * One automatic segmentation path
   * handles:
   * - opening Object Adjust
   * - switching Face/Skin/Hair/Shadow
   * - replacing the active image
   */
  useEffect(() => {
    if (activeAiTool === "object" && activePhoto?.url) {
      setObjectMaskHistory([null]);

      setObjectMaskHistoryIndex(0);

      void objectMaskRequest(objectTab);
    }
  }, [activeAiTool, activePhoto?.url, objectTab, objectMaskRequest]);

  const filterString = useMemo(() => {
    return [
      `brightness(${100 + brightness}%)`,
      `contrast(${100 + contrast}%)`,
      `saturate(${100 + saturation}%)`,
      `hue-rotate(${hue}deg)`,
      `sepia(${sepia}%)`,
      `grayscale(${grayscale}%)`,
    ].join(" ");
  }, [brightness, contrast, saturation, hue, sepia, grayscale]);

  const drawAsset = async (
    ctx: CanvasRenderingContext2D,
    asset: PhotoAsset,
    targetW: number,
    targetH: number,
    offsetX: number,
  ) => {
    const img = await loadImage(asset.url);

    /*
     * Safari (before 18) silently ignores CanvasRenderingContext2D.filter, which
     * would export photos without brightness / contrast / hue / sepia / B&W.
     * In that case bake the same filter chain into a temporary copy of the
     * photo so the exported file matches the on-screen preview. Only the photo
     * is filtered, never the background colour behind it.
     */
    const nativeFilter = supportsCanvasFilter(ctx);
    const filterValues = { brightness, contrast, saturation, hue, sepia, grayscale };
    let source: CanvasImageSource = img;
    if (!nativeFilter && !isNeutralCssFilter(filterValues)) {
      const temp = document.createElement("canvas");
      temp.width = img.naturalWidth;
      temp.height = img.naturalHeight;
      const tempCtx = temp.getContext("2d", { willReadFrequently: true });
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0);
        const pixels = tempCtx.getImageData(0, 0, temp.width, temp.height);
        applyCssFilterPixels(pixels, filterValues);
        tempCtx.putImageData(pixels, 0, 0);
        source = temp;
      }
    }

    ctx.save();

    if (nativeFilter) {
      ctx.filter = filterString;
    }

    ctx.translate(offsetX + targetW / 2, targetH / 2);

    ctx.rotate((rotation * Math.PI) / 180);

    ctx.scale(flipX ? -1 : 1, 1);

    const normalizedRotation = ((rotation % 360) + 360) % 360;

    const rotatedWidth =
      normalizedRotation === 90 || normalizedRotation === 270
        ? img.naturalHeight
        : img.naturalWidth;

    const rotatedHeight =
      normalizedRotation === 90 || normalizedRotation === 270
        ? img.naturalWidth
        : img.naturalHeight;

    /*
     * Crop is independent from the output preset.
     *
     * The selected output size only controls
     * the destination canvas ratio. It does not
     * silently perform a second crop.
     */
    const scale =
      Math.min(targetW / rotatedWidth, targetH / rotatedHeight) * (zoom / 100);

    ctx.drawImage(
      source,
      (-img.naturalWidth * scale) / 2,
      (-img.naturalHeight * scale) / 2,
      img.naturalWidth * scale,
      img.naturalHeight * scale,
    );

    ctx.restore();
  };

  const renderCurrentCanvas = useCallback(async () => {
    if (!activePhoto) {
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!backgroundRemoved) {
      ctx.fillStyle = activeBackground;

      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (photoMode === "dual") {
      const left = dualPhotos[0];

      const right = dualPhotos[1];

      if (left) {
        await drawAsset(ctx, left, targetW, targetH, 0);
      }

      if (right) {
        await drawAsset(ctx, right, targetW, targetH, targetW);
      }
    } else {
      await drawAsset(ctx, activePhoto, targetW, targetH, 0);
    }

    /*
     * Global Image Adjustments are applied
     * after Object Adjust / Background Remove.
     */
    applyCanvasSharpness(ctx, sharp);

    if (photoMode === "dual") {
    } else {
    }

    return canvas;
  }, [
    activePhoto,
    currentPreset,
    photoMode,
    dualPhotos,
    activeBackground,
    backgroundRemoved,
    filterString,
    rotation,
    flipX,
    zoom,
    sharp,
  ]);

  const renderCurrentPrintImage = useCallback(async () => {
    if (!activePhoto) {
      return null;
    }

    const targetW = mmToPx(currentPreset.widthMm);
    const targetH = mmToPx(currentPreset.heightMm);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!backgroundRemoved) {
      ctx.fillStyle = activeBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await drawAsset(ctx, activePhoto, targetW, targetH, 0);
    applyCanvasSharpness(ctx, sharp);

    return canvas;
  }, [
    activeBackground,
    activePhoto,
    backgroundRemoved,
    currentPreset,
    drawAsset,
    sharp,
  ]);

  const downloadEdited = useCallback(async (
    format: "png" | "jpeg" | "webp" = "png",
    quality = 0.92,
  ) => {
    try {
      const canvas = await renderCurrentCanvas();

      if (!canvas || !activePhoto) {
        setSaveNotice("Upload a photo first.");
        window.setTimeout(() => setSaveNotice(""), 2200);
        return;
      }

      // JPEG cannot preserve transparency, so flatten transparent pixels over
      // white rather than allowing browser-dependent black transparent areas.
      if (format === "jpeg") {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.globalCompositeOperation = "destination-over";
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
      }

      const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => value ? resolve(value) : reject(new Error("The edited image could not be exported.")),
          mime,
          Math.max(0.4, Math.min(1, quality)),
        );
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const extension = format === "jpeg" ? "jpg" : format;
      link.download = fileName(activePhoto.file.name).replace(/\.png$/i, `.${extension}`);
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      const sizeLabel = blob.size >= 1024 * 1024
        ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(blob.size / 1024))} KB`;
      const transparencyNote = format === "png" && backgroundRemoved ? ", transparent" : format === "jpeg" ? ", flattened on white" : "";
      setSaveNotice(`Downloaded ${extension.toUpperCase()} · ${canvas.width}×${canvas.height}px · ${sizeLabel}${transparencyNote}`);
      window.setTimeout(() => setSaveNotice(""), 4500);
    } catch (error) {
      setSaveNotice(error instanceof Error ? error.message : "Could not export this image.");
      window.setTimeout(() => setSaveNotice(""), 2600);
    }
  }, [activePhoto, backgroundRemoved, renderCurrentCanvas]);

  const closePrintStudio = useCallback(() => {
    setPrintStudioOpen(false);
  }, []);

  /**
   * Open the shared Print Studio with any image source.
   * This is intentionally separate from printEdited so saved-history
   * images and the current editor image can use the exact same studio.
   */
  const openPrintStudioWithImage = useCallback((image: string) => {
    const source = typeof image === "string" ? image.trim() : "";

    if (!source) {
      setSaveNotice("No image is available for printing.");
      window.setTimeout(() => setSaveNotice(""), 1800);
      return;
    }

    setPrintStudioImage(source);
    setPrintStudioOpen(true);
  }, []);

  const printEdited = useCallback(async () => {
    const canvas = await renderCurrentPrintImage();

    if (!canvas) {
      setSaveNotice("Upload a photo first.");
      window.setTimeout(() => setSaveNotice(""), 1800);
      return;
    }

    openPrintStudioWithImage(canvas.toDataURL("image/png"));
  }, [openPrintStudioWithImage, renderCurrentPrintImage]);

  const saveEdited = useCallback(async () => {
    if (isSavingEdited) return;

    const canvas = await renderCurrentCanvas();

    if (!canvas) {
      setSaveNotice("Upload a photo first.");
      window.setTimeout(() => setSaveNotice(""), 1800);
      return;
    }

    setIsSavingEdited(true);
    setSaveNotice("Saving");

    try {
      const format = backgroundRemoved ? "image/png" : "image/jpeg";
      const quality = backgroundRemoved ? undefined : 0.92;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((value) => resolve(value), format, quality),
      );

      if (!blob || blob.size === 0) {
        throw new Error("The edited image could not be prepared.");
      }

      const baseName =
        activePhoto?.file.name?.replace(/\.[^/.]+$/, "") || "manual-editor";
      const filename = `${baseName}-edited.${backgroundRemoved ? "png" : "jpg"}`;
      const formData = new FormData();
      formData.append("file", blob, filename);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          ...getAuthHeaders(),
        },
        credentials: "include",
        cache: "no-store",
      });

      const uploadResult = await uploadResponse.json().catch(() => null);

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
        throw new Error("Cloudinary did not return an image URL.");
      }

      if (!cloudinaryPublicId) {
        throw new Error("Cloudinary did not return a public_id.");
      }

      const side =
        photoMode === "dual"
          ? activeDualSlot === 0
            ? "left"
            : "right"
          : "single";

      const metadata = {
        url: cloudinaryUrl,
        size: `${currentPreset.widthMm}×${currentPreset.heightMm} mm`,
        sizeType: currentPreset.label,
        widthPx: canvas.width,
        heightPx: canvas.height,
        dpi: DPI,
        bgColor: activeBackground,
        clothingStyle: "Manual Editor",
        clothingColor: "",
        editingGuides: [
          `brightness:${brightness}`,
          `contrast:${contrast}`,
          `saturation:${saturation}`,
          `sharpness:${sharp}`,
          `zoom:${zoom}`,
          `rotation:${rotation}`,
          `flipX:${flipX}`,
          `photoMode:${photoMode}`,
          `backgroundRemoved:${backgroundRemoved}`,
        ],
        side,
        publicId: cloudinaryPublicId,
        source: "manual-editor",
      };

      setSaveNotice("Saving");

      const databaseResponse = await fetch("/api/ai-generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(metadata),
      });

      const databaseResult = await databaseResponse.json().catch(() => null);

      if (!databaseResponse.ok || !databaseResult?.success) {
        // The Cloudinary delete route already exists in this project.
        // Attempt cleanup if MongoDB persistence fails so we do not leave
        // an orphaned asset behind.
        try {
          await fetch("/api/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            credentials: "include",
            body: JSON.stringify({ imageUrl: cloudinaryUrl }),
          });
        } catch (cleanupError) {
          console.error("Cloudinary rollback failed:", cleanupError);
        }

        throw new Error(
          databaseResult?.error || "Could not save the image details.",
        );
      }

      const savedItem = Array.isArray(databaseResult.data)
        ? databaseResult.data[0]
        : databaseResult.data;

      const savedPhoto: GeneratedPhoto = {
        id:
          savedItem && typeof savedItem.id === "string"
            ? savedItem.id
            : cloudinaryUrl,
        url:
          savedItem && typeof savedItem.url === "string"
            ? savedItem.url
            : cloudinaryUrl,
        publicId:
          savedItem && typeof savedItem.publicId === "string"
            ? savedItem.publicId
            : cloudinaryPublicId,
        createdAt:
          savedItem && typeof savedItem.createdAt === "string"
            ? savedItem.createdAt
            : new Date().toISOString(),
        updatedAt:
          savedItem && typeof savedItem.updatedAt === "string"
            ? savedItem.updatedAt
            : undefined,
        size: metadata.size,
        sizeType: metadata.sizeType,
        widthPx: metadata.widthPx,
        heightPx: metadata.heightPx,
        dpi: metadata.dpi,
      };

      setGeneratedPhotos((current) => {
        const next = [
          savedPhoto,
          ...current.filter(
            (item: GeneratedPhoto) =>
              item.id !== savedPhoto.id && item.url !== savedPhoto.url,
          ),
        ].slice(0, 8);

        const storageKey = getManualHistoryStorageKey(currentUserId);
        if (storageKey) {
          localStorage.setItem(
            storageKey,
            JSON.stringify(next.map((item: GeneratedPhoto) => item.url)),
          );
        }
        return next;
      });

      setSaveNotice("Saved");
      window.setTimeout(() => setSaveNotice(""), 2200);
    } catch (error) {
      console.error("Manual Editor save failed:", error);
      setSaveNotice(
        error instanceof Error
          ? error.message
          : "Could not save this image. Please try again.",
      );
      window.setTimeout(() => setSaveNotice(""), 2800);
    } finally {
      setIsSavingEdited(false);
    }
  }, [
    activeBackground,
    activeDualSlot,
    activePhoto,
    backgroundRemoved,
    brightness,
    contrast,
    currentUserId,
    flipX,
    getAuthHeaders,
    isSavingEdited,
    photoMode,
    currentPreset,
    renderCurrentCanvas,
    saturation,
    sharp,
    rotation,
    zoom,
  ]);

  const loadHistoryImage = useCallback(
    async (photo: GeneratedPhoto) => {
      try {
        const response = await fetch(photo.url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Could not download the saved photo.");
        }

        const blob = await response.blob();

        const file = new File([blob], "manual-editor-history.png", {
          type: blob.type || "image/png",
        });

        const asset = await createPhotoAsset(file);

        replaceActivePhoto(asset);

        if (photoMode === "dual") {
          setDualCompareOriginalFiles((current) => {
            const next = [...current] as [File | null, File | null];
            next[activeDualSlot] = file;
            return next;
          });
        } else {
          setSingleCompareOriginalFile(file);
        }

        setBackgroundRemoved(false);
        setObjectMaskHistory([null]);
        setObjectMaskHistoryIndex(0);
        setCropAvailable(false);
      } catch {
        setUploadError("Could not load this saved photo.");
      }
    },
    [activeDualSlot, createPhotoAsset, photoMode, replaceActivePhoto],
  );

  const downloadHistoryImage = useCallback(async (photo: GeneratedPhoto) => {
    if (!photo?.url) return;

    try {
      const response = await fetch(photo.url, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not prepare the saved photo.");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName(photo.url);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error("History image download failed:", error);
      setSaveNotice("Could not download this photo.");
      window.setTimeout(() => setSaveNotice(""), 2200);
    }
  }, []);

  const printHistoryImage = useCallback(async (photo: GeneratedPhoto) => {
    if (!photo?.url) return;

    const printWindow = window.open("", "_blank", "width=1000,height=1000");

    if (!printWindow) {
      setSaveNotice("Please allow pop-ups to print.");
      window.setTimeout(() => setSaveNotice(""), 2200);
      return;
    }

    const safeUrl = photo.url.replace(/"/g, "&quot;");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${t("Print Photo")}</title>
<style>
@page { size: auto; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; width: 100%; min-height: 100%; }
body { min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
img { display: block; width: auto; height: auto; max-width: 100vw; max-height: 100vh; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head>
<body>
<img id="print-image" src="${safeUrl}" alt="${t("Printable photo")}" />
<script>
const image = document.getElementById("print-image");
const triggerPrint = () => setTimeout(() => { window.focus(); window.print(); }, 120);
if (image.complete) triggerPrint(); else image.addEventListener("load", triggerPrint, { once: true });
</script>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();

    const closeAfterPrint = () => {
      window.setTimeout(() => {
        try {
          printWindow.close();
        } catch {
          // Ignore close errors.
        }
      }, 300);
    };

    printWindow.addEventListener("afterprint", closeAfterPrint, { once: true });
    window.setTimeout(closeAfterPrint, 5000);
  }, []);

  const deleteHistoryImage = useCallback(
    async (photo: GeneratedPhoto) => {
      if (!photo?.id) return;

      try {
        const response = await fetch(
          `/api/ai-generations?id=${encodeURIComponent(photo.id)}`,
          {
            method: "DELETE",
            headers: {
              ...getAuthHeaders(),
            },
            credentials: "include",
            cache: "no-store",
          },
        );

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Failed to delete this photo.");
        }

        setGeneratedPhotos((current) => {
          const next = current.filter(
            (item: GeneratedPhoto) =>
              item.id !== photo.id && item.url !== photo.url,
          );
          const storageKey = getManualHistoryStorageKey(currentUserId);
          if (storageKey) {
            localStorage.setItem(
              storageKey,
              JSON.stringify(next.map((item: GeneratedPhoto) => item.url)),
            );
          }
          return next;
        });

        setSaveNotice("Deleted");
        window.setTimeout(() => setSaveNotice(""), 1800);
      } catch (error) {
        console.error("History image delete failed:", error);
        setSaveNotice(
          error instanceof Error
            ? error.message
            : "Could not delete this photo.",
        );
        window.setTimeout(() => setSaveNotice(""), 2400);
        throw error;
      }
    },
    [currentUserId, getAuthHeaders],
  );

  /*
   * Public context object.
   *
   * IMPORTANT:
   * Both the canonical names and backward-compatible
   * background aliases are exposed here.
   */
  const value = {
    isAuthenticated,

    loading,

    photoMode,

    setPhotoMode,

    selectedPreset,

    setSelectedPreset: setSelectedPresetState,

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

    /*
     * Canonical property.
     */
    backgroundRemoved,

    /*
     * Backward-compatible alias.
     */
    isBackgroundRemoved: backgroundRemoved,

    /*
     * Public setter.
     *
     * This is the exact function that
     * older BackgroundPanel implementations
     * were trying to call.
     */
    setBackgroundRemoved,

    isRemovingBackground,

    handleRemoveBackground,

    activeAiTool,

    setActiveAiTool,

    aiNotice,

    setAiNotice,

    objectTab,

    setObjectTab,

    objectBrightness,

    objectContrast,

    objectSaturation,

    objectHue,

    shadowStrength,

    brushSize,

    setObjectBrightness,

    setObjectContrast,

    setObjectSaturation,

    setObjectHue,

    setShadowStrength,

    setBrushSize,

    objectPreview,

    setObjectPreview,

    objectBrushMode,

    setObjectBrushMode,

    objectMaskDataUrl,

    objectMaskBusy,

    objectApplyBusy,

    objectMaskRequest,

    commitObjectMask,

    undoObjectMask,

    redoObjectMask,

    resetObjectMask,

    applyObjectAdjust,

    cancelObjectAdjust,

    resetObjectAdjust,

    showUnsupportedAiMessage,

    aiProcessing,
    aiProgress,
    cancelAiProcessing,
    runUpscale,
    runFaceEnhance,

    singlePhoto,

    dualPhotos,

    activeDualSlot,

    activePhoto,

    comparisonOriginalFile,

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

    applyCutoutFile,

    applyRetouchedFile,

    cropAvailable,

    consumeCrop,

    openFilePicker,

    brightness,

    contrast,

    saturation,

    sharp,

    setBrightness,

    setContrast,

    setSaturation,

    setSharp,

    hue,

    sepia,

    grayscale,

    setHue,

    setSepia,

    setGrayscale,








    zoom,

    rotation,

    flipX,

    setZoom,

    setRotation,

    setFlipX,

    downloadEdited,

    printEdited,

    printStudioOpen,

    printStudioImage,

    closePrintStudio,

    openPrintStudioWithImage,

    saveEdited,

    isSavingEdited,

    saveNotice,

    generatedPhotos,

    loadHistoryImage,

    downloadHistoryImage,

    printHistoryImage,

    deleteHistoryImage,

    scanOpen,

    setScanOpen,
  } satisfies ManualEditorContextValue;

  return (
    <ManualEditorContext.Provider value={value}>
      {children}
    </ManualEditorContext.Provider>
  );
}

export function useManualEditor() {
  const context = useContext(ManualEditorContext);

  if (!context) {
    throw new Error("useManualEditor must be used inside ManualEditorProvider");
  }

  return context;
}
