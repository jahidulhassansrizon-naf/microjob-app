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
} from "./constants";
import type {
  AiTool,
  EditorFilters,
  ObjectTab,
  PhotoAsset,
  PhotoMode,
  SizePreset,
} from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mmToPx(mm: number) {
  return Math.round((mm / 25.4) * DPI);
}

function revokeAsset(asset: PhotoAsset | null) {
  if (asset?.url) URL.revokeObjectURL(asset.url);
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
  return `${name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-") || "manual-editor"}-edited.png`;
}

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
  setSizeMenu: (value: "visa" | "rsizes" | null) => void;
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

  const activePhoto =
    photoMode === "dual" ? dualPhotos[activeDualSlot] : singlePhoto;

  const currentPreset = useMemo<SizePreset>(() => {
    if (photoMode === "passport") return PASSPORT_PRESET;
    if (selectedPreset) return selectedPreset;
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
      const img = await loadImage(url);
      return { file, url, width: img.naturalWidth, height: img.naturalHeight };
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
      if (!file) return;
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
      const file = new File([blob], name, { type: blob.type || "image/png" });
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

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);
  const isDraggingEnter = useCallback(() => setIsDragging(true), []);

  const selectMode = useCallback(
    (mode: PhotoMode) => {
      setPhotoMode(mode);
      setSizeMenu(null);
      setFreeSizeOpen(mode === "freesize");
      if (mode !== "visa" && mode !== "rsizes") setSelectedPreset(null);
      resetTransforms();
    },
    [resetTransforms],
  );

  const selectPreset = useCallback(
    (preset: SizePreset, source: "visa" | "rsizes") => {
      setPhotoMode(source);
      setSelectedPreset(preset);
      setSizeMenu(null);
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
  }, [resetTransforms]);

  const filterString = useMemo(() => {
    return `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
  }, [brightness, contrast, saturation]);

  const drawAsset = async (
    ctx: CanvasRenderingContext2D,
    asset: PhotoAsset,
    targetW: number,
    targetH: number,
    offsetX: number,
  ) => {
    const img = await loadImage(asset.url);
    ctx.save();
    ctx.filter = filterString;
    ctx.translate(offsetX + targetW / 2, targetH / 2);
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
  };

  const renderCurrentCanvas = useCallback(async () => {
    if (!activePhoto) return null;
    const targetW = mmToPx(currentPreset.widthMm);
    const targetH = mmToPx(currentPreset.heightMm);
    const canvas = document.createElement("canvas");
    canvas.width = photoMode === "dual" ? targetW * 2 : targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = activeBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (photoMode === "dual") {
      const left = dualPhotos[0];
      const right = dualPhotos[1];
      if (left) await drawAsset(ctx, left, targetW, targetH, 0);
      if (right) await drawAsset(ctx, right, targetW, targetH, targetW);
    } else {
      await drawAsset(ctx, activePhoto, targetW, targetH, 0);
    }
    return canvas;
  }, [
    activePhoto,
    currentPreset,
    photoMode,
    dualPhotos,
    activeBackground,
    filterString,
    rotation,
    flipX,
    zoom,
  ]);

  const downloadEdited = useCallback(async () => {
    const canvas = await renderCurrentCanvas();
    if (!canvas || !activePhoto) return;
    const link = document.createElement("a");
    link.download = fileName(activePhoto.file.name);
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [activePhoto, renderCurrentCanvas]);

  const printEdited = useCallback(async () => {
    const canvas = await renderCurrentCanvas();
    if (!canvas) return;
    const imageUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=900,height=900");
    if (!printWindow) return;
    printWindow.document.write(
      `<!doctype html><html><head><title>Print Photo</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}img{max-width:100%;max-height:100vh;object-fit:contain}@media print{img{width:100%;height:auto}}</style></head><body><img src="${imageUrl}" /></body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }, [renderCurrentCanvas]);

  const saveEdited = useCallback(async () => {
    const canvas = await renderCurrentCanvas();
    if (!canvas) return;
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
    downloadEdited,
    printEdited,
    saveEdited,
    saveNotice,
    generatedPhotos,
    loadHistoryImage,
    scanOpen,
    setScanOpen,
  } satisfies ManualEditorContextValue;

  if (loading) {
    return (
      <ManualEditorContext.Provider value={value}>
        {children}
      </ManualEditorContext.Provider>
    );
  }

  return (
    <ManualEditorContext.Provider value={value}>
      {children}
    </ManualEditorContext.Provider>
  );
}

export function useManualEditor(): ManualEditorContextValue {
  const context = useContext(
    ManualEditorContext,
  ) as ManualEditorContextValue | null;
  if (!context) {
    throw new Error("useManualEditor must be used inside ManualEditorProvider");
  }
  return context;
}
