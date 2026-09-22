"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlignCenterHorizontal,
  AlignRight,
  Download,
  Grid3X3,
  Image as ImageIcon,
  Minus,
  Move,
  Plus,
  Printer,
  Redo2,
  RotateCw,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import { useManualEditor } from "./EditorProvider";

const EXPORT_DPI = 300;
const MAX_ITEMS = 80;
const DEFAULT_GAP_MM = 3;
const ZOOM_MIN = 50;
const ZOOM_MAX = 300;
const ZOOM_STEP = 20;
const MIN_ITEM_MM = 8;

const PAGE_SIZES = {
  A4: { label: "A4 — 210×297 mm", widthMm: 210, heightMm: 297 },
  "4R": { label: "4R — 102×152 mm", widthMm: 102, heightMm: 152 },
  "5R": { label: "5R — 127×178 mm", widthMm: 127, heightMm: 178 },
  "6R": { label: "6R — 152×203 mm", widthMm: 152, heightMm: 203 },
} as const;

type PageSizeKey = keyof typeof PAGE_SIZES;
type Orientation = "portrait" | "landscape";

type StudioItem = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  xMm: number;
  yMm: number;
  rotation: number;
};

type Preset = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
};

type CheckboxOption = {
  label: string;
  checked: boolean;
  setChecked: (value: boolean) => void;
};

const PRESETS: Preset[] = [
  { id: "passport", label: "Passport", widthMm: 45, heightMm: 55 },
  { id: "stamp", label: "Stamp", widthMm: 20, heightMm: 25 },
  { id: "2R", label: "2R", widthMm: 63.5, heightMm: 88.9 },
  { id: "3R", label: "3R", widthMm: 88.9, heightMm: 127 },
  { id: "4R", label: "4R", widthMm: 101.6, heightMm: 152.4 },
  { id: "5R", label: "5R", widthMm: 127, heightMm: 177.8 },
  { id: "6R", label: "6R", widthMm: 152.4, heightMm: 203.2 },
  { id: "8R", label: "8R", widthMm: 203.2, heightMm: 254 },
  // The supplied reference does not specify physical B-size dimensions.
  // Keep these in one table so they can be changed without touching layout code.
  { id: "4B", label: "4B", widthMm: 101.6, heightMm: 152.4 },
  { id: "5B", label: "5B", widthMm: 127, heightMm: 177.8 },
  { id: "6B", label: "6B", widthMm: 152.4, heightMm: 203.2 },
  { id: "A4", label: "A4", widthMm: 210, heightMm: 297 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(value: number): number {
  return ((value % 360) + 360) % 360;
}

function uniqueId(): string {
  return `print-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    // Saved history images are Cloudinary URLs. Anonymous CORS is required
    // before drawing them into the export canvas for PDF/Print.
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Unable to load the photo for printing."));
    image.src = src;
  });
}

function getRotatedBounds(item: StudioItem): {
  widthMm: number;
  heightMm: number;
} {
  const radians = (normalizeAngle(item.rotation) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    widthMm: item.widthMm * cos + item.heightMm * sin,
    heightMm: item.widthMm * sin + item.heightMm * cos,
  };
}

function overlaps(
  a: { xMm: number; yMm: number; widthMm: number; heightMm: number },
  b: { xMm: number; yMm: number; widthMm: number; heightMm: number },
  gapMm: number,
): boolean {
  return !(
    a.xMm + a.widthMm + gapMm <= b.xMm ||
    b.xMm + b.widthMm + gapMm <= a.xMm ||
    a.yMm + a.heightMm + gapMm <= b.yMm ||
    b.yMm + b.heightMm + gapMm <= a.yMm
  );
}

function findFreePosition(
  widthMm: number,
  heightMm: number,
  pageWidthMm: number,
  pageHeightMm: number,
  current: StudioItem[],
  gapMm: number,
): { xMm: number; yMm: number } | null {
  if (widthMm > pageWidthMm || heightMm > pageHeightMm) {
    return null;
  }

  const step = Math.max(1, Math.min(5, gapMm || 1));
  const maxX = pageWidthMm - widthMm;
  const maxY = pageHeightMm - heightMm;

  for (let y = 0; y <= maxY + 0.001; y += step) {
    for (let x = 0; x <= maxX + 0.001; x += step) {
      const candidate = { xMm: x, yMm: y, widthMm, heightMm };
      const blocked = current.some((item) => {
        const bounds = getRotatedBounds(item);
        return overlaps(
          candidate,
          {
            xMm: item.xMm,
            yMm: item.yMm,
            widthMm: bounds.widthMm,
            heightMm: bounds.heightMm,
          },
          gapMm,
        );
      });

      if (!blocked) return { xMm: x, yMm: y };
    }
  }

  return null;
}

function fitItemsToPage(
  items: StudioItem[],
  widthMm: number,
  heightMm: number,
): StudioItem[] {
  return items.map((item) => {
    const safeWidth = Math.min(item.widthMm, widthMm);
    const safeHeight = Math.min(item.heightMm, heightMm);

    return {
      ...item,
      widthMm: safeWidth,
      heightMm: safeHeight,
      xMm: clamp(item.xMm, 0, Math.max(0, widthMm - safeWidth)),
      yMm: clamp(item.yMm, 0, Math.max(0, heightMm - safeHeight)),
    };
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const sw = image.naturalWidth || image.width;
  const sh = image.naturalHeight || image.height;
  if (!sw || !sh) return;

  const scale = Math.max(width / sw, height / sh);
  const cropW = width / scale;
  const cropH = height / scale;
  const cropX = Math.max(0, (sw - cropW) / 2);
  const cropY = Math.max(0, (sh - cropH) / 2);

  ctx.drawImage(image, cropX, cropY, cropW, cropH, x, y, width, height);
}

function nameForPdf(pageSize: PageSizeKey): string {
  return `photo-print-${pageSize.toLowerCase()}.pdf`;
}

export default function PrintStudioModal() {
  const { printStudioOpen, printStudioImage, currentPreset, closePrintStudio } =
    useManualEditor();

  const pageRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<{
    pointerId: number;
    id: string;
    mode: "drag" | "resize" | "rotate";
    startX: number;
    startY: number;
    startItem: StudioItem;
  } | null>(null);

  const [mounted, setMounted] = useState(false);
  const [pageSizeKey, setPageSizeKey] = useState<PageSizeKey>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [items, setItems] = useState<StudioItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gapMm, setGapMm] = useState(DEFAULT_GAP_MM);
  const [freeSize, setFreeSize] = useState(false);
  const [cuttingBorder, setCuttingBorder] = useState(false);
  const [imageBorder, setImageBorder] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fitScale, setFitScale] = useState(2.4);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<StudioItem[][]>([]);
  const [future, setFuture] = useState<StudioItem[][]>([]);
  const sourcePreset = useMemo(() => {
    if (currentPreset?.widthMm && currentPreset?.heightMm) {
      return {
        id: currentPreset.id,
        label: currentPreset.label,
        widthMm: currentPreset.widthMm,
        heightMm: currentPreset.heightMm,
      };
    }
    return (
      PRESETS.find((preset) => preset.id === "passport") ?? {
        id: "passport",
        label: "Passport",
        widthMm: 45,
        heightMm: 55,
      }
    );
  }, [currentPreset]);

  const pageWidthMm =
    orientation === "portrait"
      ? PAGE_SIZES[pageSizeKey].widthMm
      : PAGE_SIZES[pageSizeKey].heightMm;
  const pageHeightMm =
    orientation === "portrait"
      ? PAGE_SIZES[pageSizeKey].heightMm
      : PAGE_SIZES[pageSizeKey].widthMm;

  const visualScale = fitScale * (zoom / 100);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const commit = useCallback((next: StudioItem[], previous: StudioItem[]) => {
    setHistory((current) => [
      ...current.slice(-19),
      previous.map((item) => ({ ...item })),
    ]);
    setFuture([]);
    setItems(next);
  }, []);

  const createInitialLayout = useCallback(() => {
    if (!printStudioImage) {
      setItems([]);
      setSelectedId(null);
      return;
    }

    const placed = findFreePosition(
      sourcePreset.widthMm,
      sourcePreset.heightMm,
      PAGE_SIZES.A4.widthMm,
      PAGE_SIZES.A4.heightMm,
      [],
      DEFAULT_GAP_MM,
    );

    setItems(
      placed
        ? [
            {
              id: uniqueId(),
              label: sourcePreset.label || "Photo",
              widthMm: sourcePreset.widthMm,
              heightMm: sourcePreset.heightMm,
              xMm: placed.xMm,
              yMm: placed.yMm,
              rotation: 0,
            },
          ]
        : [],
    );
    setSelectedId(null);
    setHistory([]);
    setFuture([]);
    setPageSizeKey("A4");
    setOrientation("portrait");
    setGapMm(DEFAULT_GAP_MM);
    setFreeSize(false);
    setCuttingBorder(false);
    setImageBorder(false);
    setZoom(100);
  }, [printStudioImage, sourcePreset]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (printStudioOpen) {
      createInitialLayout();
    }
  }, [printStudioOpen, createInitialLayout]);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.length) return current;
      const previous = current[current.length - 1];
      if (!previous) return current;

      setFuture((currentFuture) =>
        [items.map((item) => ({ ...item })), ...currentFuture].slice(0, 20),
      );
      setItems(previous.map((item) => ({ ...item })));
      setSelectedId(previous[0]?.id ?? null);
      return current.slice(0, -1);
    });
  }, [items]);

  const redo = useCallback(() => {
    setFuture((current) => {
      if (!current.length) return current;
      const next = current[0];
      if (!next) return current;

      setHistory((currentHistory) =>
        [...currentHistory, items.map((item) => ({ ...item }))].slice(-20),
      );
      setItems(next.map((item) => ({ ...item })));
      setSelectedId(next[0]?.id ?? null);
      return current.slice(1);
    });
  }, [items]);

  useEffect(() => {
    if (!printStudioOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePrintStudio();

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [printStudioOpen, closePrintStudio, redo, undo]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const updateScale = () => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const widthScale = (rect.width - 70) / pageWidthMm;
      const heightScale = (rect.height - 70) / pageHeightMm;
      setFitScale(clamp(Math.min(widthScale, heightScale), 1.2, 4.5));
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(workspace);
    return () => observer.disconnect();
  }, [pageWidthMm, pageHeightMm]);

  const addPreset = useCallback(
    (preset: Preset, quantity = 1) => {
      if (!printStudioImage) return;

      let next = [...items];
      let added = 0;

      for (let index = 0; index < quantity; index += 1) {
        if (next.length >= MAX_ITEMS) break;

        const placement = findFreePosition(
          preset.widthMm,
          preset.heightMm,
          pageWidthMm,
          pageHeightMm,
          next,
          gapMm,
        );

        if (!placement) break;

        next.push({
          id: uniqueId(),
          label: preset.label,
          widthMm: preset.widthMm,
          heightMm: preset.heightMm,
          xMm: placement.xMm,
          yMm: placement.yMm,
          rotation: 0,
        });
        added += 1;
      }

      if (!added) {
        showToast("Page full - Page is full, can't add more images");
        return;
      }

      if (added < quantity) {
        showToast("Page full - Page is full, can't add more images");
      }

      commit(next, items);
      setSelectedId(next[next.length - 1]?.id ?? null);
    },
    [
      commit,
      gapMm,
      items,
      pageHeightMm,
      pageWidthMm,
      printStudioImage,
      showToast,
    ],
  );

  const removeItem = useCallback(
    (id: string) => {
      const next = items.filter((item) => item.id !== id);
      commit(next, items);
      setSelectedId((current) => (current === id ? null : current));
    },
    [commit, items],
  );

  const setPage = useCallback(
    (value: PageSizeKey) => {
      setPageSizeKey(value);
      const width =
        orientation === "portrait"
          ? PAGE_SIZES[value].widthMm
          : PAGE_SIZES[value].heightMm;
      const height =
        orientation === "portrait"
          ? PAGE_SIZES[value].heightMm
          : PAGE_SIZES[value].widthMm;
      const next = fitItemsToPage(items, width, height);
      commit(next, items);
    },
    [commit, items, orientation],
  );

  const setPageOrientation = useCallback(
    (value: Orientation) => {
      setOrientation(value);
      const width =
        value === "portrait"
          ? PAGE_SIZES[pageSizeKey].widthMm
          : PAGE_SIZES[pageSizeKey].heightMm;
      const height =
        value === "portrait"
          ? PAGE_SIZES[pageSizeKey].heightMm
          : PAGE_SIZES[pageSizeKey].widthMm;
      const next = fitItemsToPage(items, width, height);
      commit(next, items);
    },
    [commit, items, pageSizeKey],
  );

  const autoArrange = useCallback(() => {
    if (!items.length) return;

    const sorted = [...items].sort(
      (a, b) => b.widthMm * b.heightMm - a.widthMm * a.heightMm,
    );

    const arranged: StudioItem[] = [];
    let cursorX = gapMm;
    let cursorY = gapMm;
    let rowHeight = 0;

    for (const source of sorted) {
      const item = { ...source, rotation: 0 };

      if (item.widthMm > pageWidthMm || item.heightMm > pageHeightMm) continue;

      if (cursorX + item.widthMm + gapMm > pageWidthMm) {
        cursorX = gapMm;
        cursorY += rowHeight + gapMm;
        rowHeight = 0;
      }

      if (cursorY + item.heightMm + gapMm > pageHeightMm) continue;

      item.xMm = cursorX;
      item.yMm = cursorY;
      arranged.push(item);

      cursorX += item.widthMm + gapMm;
      rowHeight = Math.max(rowHeight, item.heightMm);
    }

    if (arranged.length !== items.length) {
      showToast("Page full - Page is full, can't add more images");
    }

    commit(arranged, items);
    setSelectedId(arranged[0]?.id ?? null);
  }, [commit, gapMm, items, pageHeightMm, pageWidthMm, showToast]);

  const centerAlign = useCallback(() => {
    const next = items.map((item) => ({
      ...item,
      xMm: clamp(
        (pageWidthMm - item.widthMm) / 2,
        0,
        Math.max(0, pageWidthMm - item.widthMm),
      ),
    }));
    commit(next, items);
  }, [commit, items, pageWidthMm]);

  const rightAlign = useCallback(() => {
    const next = items.map((item) => ({
      ...item,
      xMm: Math.max(0, pageWidthMm - item.widthMm),
    }));
    commit(next, items);
  }, [commit, items, pageWidthMm]);

  const beginInteraction = useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      id: string,
      mode: "drag" | "resize" | "rotate",
    ) => {
      if (event.button !== 0) return;

      const item = items.find((entry) => entry.id === id);
      if (!item) return;

      event.preventDefault();
      event.stopPropagation();
      setSelectedId(id);
      interactionRef.current = {
        pointerId: event.pointerId,
        id,
        mode,
        startX: event.clientX,
        startY: event.clientY,
        startItem: { ...item },
      };

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    },
    [items],
  );

  const moveInteraction = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const interaction = interactionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;

      const page = pageRef.current;
      if (!page) return;

      const rect = page.getBoundingClientRect();
      const pxPerMmX = rect.width / pageWidthMm;
      const pxPerMmY = rect.height / pageHeightMm;
      const dx =
        (event.clientX - interaction.startX) / Math.max(0.001, pxPerMmX);
      const dy =
        (event.clientY - interaction.startY) / Math.max(0.001, pxPerMmY);
      const start = interaction.startItem;

      if (interaction.mode === "drag") {
        const nextX = clamp(
          start.xMm + dx,
          0,
          Math.max(0, pageWidthMm - start.widthMm),
        );
        const nextY = clamp(
          start.yMm + dy,
          0,
          Math.max(0, pageHeightMm - start.heightMm),
        );

        setItems((current) =>
          current.map((item) =>
            item.id === interaction.id
              ? { ...item, xMm: nextX, yMm: nextY }
              : item,
          ),
        );
        return;
      }

      if (interaction.mode === "resize") {
        const nextWidth = clamp(
          start.widthMm + dx,
          MIN_ITEM_MM,
          Math.max(MIN_ITEM_MM, pageWidthMm - start.xMm),
        );
        const ratio = start.heightMm / Math.max(MIN_ITEM_MM, start.widthMm);
        const nextHeight = freeSize
          ? clamp(
              start.heightMm + dy,
              MIN_ITEM_MM,
              Math.max(MIN_ITEM_MM, pageHeightMm - start.yMm),
            )
          : clamp(
              nextWidth * ratio,
              MIN_ITEM_MM,
              Math.max(MIN_ITEM_MM, pageHeightMm - start.yMm),
            );

        setItems((current) =>
          current.map((item) =>
            item.id === interaction.id
              ? { ...item, widthMm: nextWidth, heightMm: nextHeight }
              : item,
          ),
        );
        return;
      }

      const centerX =
        rect.left +
        ((start.xMm + start.widthMm / 2) / pageWidthMm) * rect.width;
      const centerY =
        rect.top +
        ((start.yMm + start.heightMm / 2) / pageHeightMm) * rect.height;
      const radians = Math.atan2(
        event.clientY - centerY,
        event.clientX - centerX,
      );
      const angle = normalizeAngle((radians * 180) / Math.PI + 90);

      setItems((current) =>
        current.map((item) =>
          item.id === interaction.id ? { ...item, rotation: angle } : item,
        ),
      );
    },
    [freeSize, pageHeightMm, pageWidthMm],
  );

  const endInteraction = useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      if (event && event.pointerId !== interaction.pointerId) return;

      const currentSnapshot = items.map((item) => ({ ...item }));
      const current = currentSnapshot.find(
        (item) => item.id === interaction.id,
      );
      if (
        current &&
        JSON.stringify(current) !== JSON.stringify(interaction.startItem)
      ) {
        const previousSnapshot = currentSnapshot.map((item) =>
          item.id === interaction.id ? { ...interaction.startItem } : item,
        );
        setHistory((historyItems) => [
          ...historyItems.slice(-19),
          previousSnapshot,
        ]);
        setFuture([]);
      }

      interactionRef.current = null;
    },
    [items],
  );

  const rotateSelected = useCallback(() => {
    if (!selectedId) return;
    const next = items.map((item) =>
      item.id === selectedId
        ? { ...item, rotation: normalizeAngle(item.rotation + 90) }
        : item,
    );
    commit(next, items);
  }, [commit, items, selectedId]);

  const renderStudioCanvas = useCallback(async () => {
    if (!printStudioImage) {
      throw new Error("No photo is available for printing.");
    }

    const image = await loadImage(printStudioImage);
    const scale = EXPORT_DPI / 25.4;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(pageWidthMm * scale));
    canvas.height = Math.max(1, Math.round(pageHeightMm * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create print canvas.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    items.forEach((item, index) => {
      const width = item.widthMm * scale;
      const height = item.heightMm * scale;
      const x = item.xMm * scale;
      const y = item.yMm * scale;

      ctx.save();
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate((normalizeAngle(item.rotation) * Math.PI) / 180);
      drawCover(ctx, image, -width / 2, -height / 2, width, height);

      if (imageBorder) {
        ctx.strokeStyle = "#202020";
        ctx.lineWidth = Math.max(1, 0.25 * scale);
        ctx.strokeRect(-width / 2, -height / 2, width, height);
      }

      if (cuttingBorder) {
        ctx.strokeStyle = "#555555";
        ctx.lineWidth = Math.max(1, 0.18 * scale);
        ctx.setLineDash([1.1 * scale, 1.1 * scale]);
        ctx.strokeRect(-width / 2, -height / 2, width, height);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    return canvas;
  }, [
    cuttingBorder,
    imageBorder,
    items,
    pageHeightMm,
    pageWidthMm,
    printStudioImage,
  ]);

  const downloadPdf = useCallback(async () => {
    if (!items.length || isExporting) return;
    setIsExporting(true);

    try {
      const canvas = await renderStudioCanvas();
      const pdf = new jsPDF({
        orientation: pageWidthMm > pageHeightMm ? "landscape" : "portrait",
        unit: "mm",
        format: [pageWidthMm, pageHeightMm],
        compress: true,
      });
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.97),
        "JPEG",
        0,
        0,
        pageWidthMm,
        pageHeightMm,
      );
      pdf.save(nameForPdf(pageSizeKey));
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not create PDF.",
      );
    } finally {
      setIsExporting(false);
    }
  }, [
    isExporting,
    items.length,
    pageHeightMm,
    pageSizeKey,
    pageWidthMm,
    renderStudioCanvas,
    showToast,
  ]);

  const printLayout = useCallback(async () => {
    if (!items.length || isExporting) return;

    const printWindow = window.open("", "_blank", "width=1200,height=1000");
    if (!printWindow) {
      showToast("Please allow pop-ups to print.");
      return;
    }

    setIsExporting(true);

    try {
      const canvas = await renderStudioCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const safeUrl = dataUrl.replace(/"/g, "&quot;");
      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Print Photo Layout</title>
<style>
@page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: 0; }
html,body { margin:0; padding:0; width:100%; height:100%; background:#fff; }
body { display:flex; align-items:center; justify-content:center; overflow:hidden; }
img { display:block; width:${pageWidthMm}mm; height:${pageHeightMm}mm; max-width:100vw; max-height:100vh; object-fit:fill; }
</style>
</head>
<body>
<img id="print-layout" src="${safeUrl}" alt="Print layout" />
<script>
const image = document.getElementById("print-layout");
const run = () => setTimeout(() => { window.focus(); window.print(); }, 120);
if (image.complete) run(); else image.addEventListener("load", run, { once:true });
</script>
</body>
</html>`);
      printWindow.document.close();
      printWindow.focus();

      const close = () =>
        window.setTimeout(() => {
          try {
            printWindow.close();
          } catch {}
        }, 300);

      printWindow.addEventListener("afterprint", close, { once: true });
      window.setTimeout(close, 6000);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not open print preview.",
      );
    } finally {
      setIsExporting(false);
    }
  }, [
    isExporting,
    items.length,
    pageHeightMm,
    pageWidthMm,
    renderStudioCanvas,
    showToast,
  ]);

  if (!mounted || !printStudioOpen || !printStudioImage) return null;

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;

  const modal = (
    <div className="fixed inset-0 z-[10000] bg-[#dfe2e7] text-gray-900 flex flex-col font-sans overflow-hidden">
      <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-5 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <ImageIcon size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold truncate">
              Print This Image
            </h1>
            <p className="text-[9px] text-gray-400 truncate">
              Photo Layout & Print Studio
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={closePrintStudio}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
          aria-label="Close print studio"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="w-[280px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <img
                src={printStudioImage}
                alt="Current photo"
                className="w-12 h-14 object-cover rounded-md border border-gray-200 bg-gray-50"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-gray-800">
                  Quick Add
                </p>
                <p className="text-[8px] text-gray-400 mt-0.5 leading-relaxed">
                  Add multiple copies of the current photo in different sizes.
                </p>
              </div>
            </div>

            <p className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500 mb-1.5">
              Units
            </p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {Array.from({ length: 8 }, (_, index) => index + 1).map(
                (quantity) => (
                  <button
                    key={quantity}
                    type="button"
                    onClick={() => addPreset(sourcePreset, quantity)}
                    className="h-8 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-extrabold cursor-pointer"
                    title={`Add ${quantity} ${sourcePreset.label} photo${quantity === 1 ? "" : "s"}`}
                  >
                    {quantity}U
                  </button>
                ),
              )}
            </div>

            <div className="space-y-2">
              {(["passport", "stamp"] as const).map((id) => {
                const preset =
                  PRESETS.find((item) => item.id === id) ??
                  (id === "passport"
                    ? {
                        id: "passport",
                        label: "Passport",
                        widthMm: 45,
                        heightMm: 55,
                      }
                    : {
                        id: "stamp",
                        label: "Stamp",
                        widthMm: 20,
                        heightMm: 25,
                      });

                return (
                  <div
                    key={preset.id}
                    className="grid grid-cols-[1fr_repeat(3,32px)] gap-1.5 items-center"
                  >
                    <div>
                      <p className="text-[9px] font-bold text-gray-800">
                        {preset.label}
                      </p>
                      <p className="text-[8px] text-gray-400">
                        {preset.widthMm}×{preset.heightMm} mm
                      </p>
                    </div>
                    {[1, 4, 8].map((quantity) => (
                      <button
                        key={`${preset.id}-${quantity}`}
                        type="button"
                        onClick={() => addPreset(preset, quantity)}
                        className="h-7 rounded-md bg-gray-700 hover:bg-gray-800 text-white text-[8px] font-extrabold cursor-pointer"
                      >
                        {quantity}+
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            <p className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500 mt-4 mb-1.5">
              Photo Sizes
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESETS.filter((item) =>
                ["2R", "3R", "4R", "5R", "6R", "8R"].includes(item.id),
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => addPreset(preset)}
                  className="h-8 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-[8px] font-extrabold cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {PRESETS.filter((item) =>
                ["4B", "5B", "6B", "A4"].includes(item.id),
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => addPreset(preset)}
                  className="h-8 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-extrabold cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500 mb-1.5">
              Options
            </p>
            <div className="space-y-1.5">
              {(
                [
                  {
                    label: "Free Size",
                    checked: freeSize,
                    setChecked: setFreeSize,
                  },
                  {
                    label: "Cutting Border",
                    checked: cuttingBorder,
                    setChecked: setCuttingBorder,
                  },
                  {
                    label: "Image Border",
                    checked: imageBorder,
                    setChecked: setImageBorder,
                  },
                ] satisfies CheckboxOption[]
              ).map(({ label, checked, setChecked }) => (
                <label
                  key={label}
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <span className="text-[9px] font-semibold text-gray-700">
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => setChecked(event.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-1 text-[9px] font-bold text-gray-500">
                <span>Image Gap (mm): {gapMm}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={gapMm}
                onChange={(event) => setGapMm(Number(event.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-gray-400 mt-0.5">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500 mb-1.5">
              Page & Layout
            </p>

            <select
              value={pageSizeKey}
              onChange={(event) => setPage(event.target.value as PageSizeKey)}
              className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2 text-[9px] font-semibold cursor-pointer"
            >
              {Object.entries(PAGE_SIZES).map(([key, page]) => (
                <option key={key} value={key}>
                  {page.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setPageOrientation("portrait")}
                className={`h-8 rounded-md text-[9px] font-extrabold cursor-pointer ${orientation === "portrait" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setPageOrientation("landscape")}
                className={`h-8 rounded-md text-[9px] font-extrabold cursor-pointer ${orientation === "landscape" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Landscape
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={centerAlign}
                className="h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-[8px] font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <AlignCenterHorizontal size={11} />
                Center
              </button>
              <button
                type="button"
                onClick={rightAlign}
                className="h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-[8px] font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <AlignRight size={11} />
                Right
              </button>
              <button
                type="button"
                onClick={autoArrange}
                className="h-8 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <Grid3X3 size={11} />
                Auto
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <button
                type="button"
                onClick={undo}
                disabled={!history.length}
                className="h-8 rounded-md border border-gray-200 text-[8px] font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Undo2 size={11} />
                Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!future.length}
                className="h-8 rounded-md border border-gray-200 text-[8px] font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Redo2 size={11} />
                Redo
              </button>
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-gray-100">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 mb-2.5">
              <p className="text-[8px] uppercase font-bold text-gray-400">
                Total
              </p>
              <p className="text-[11px] font-extrabold text-gray-800 mt-0.5">
                {items.length} {items.length === 1 ? "photo" : "photos"}
              </p>
            </div>
            <div className="grid grid-cols-[42px_1fr] gap-2">
              <button
                type="button"
                onClick={() => commit([], items)}
                className="h-10 rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 flex items-center justify-center cursor-pointer"
                title="Remove all"
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={!items.length || isExporting}
                className="h-10 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[9px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Download size={13} />
                {isExporting ? "Preparing…" : "Download PDF"}
              </button>
            </div>
            <button
              type="button"
              onClick={printLayout}
              disabled={!items.length || isExporting}
              className="w-full mt-2 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Printer size={15} />
              Print
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#dfe2e7]">
          <div className="h-11 shrink-0 bg-white/80 border-b border-gray-200 px-4 flex items-center justify-between">
            <div className="text-[9px] font-bold text-gray-500">
              {items.length} items • {pageWidthMm.toFixed(1)}×
              {pageHeightMm.toFixed(1)} mm
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setZoom((value) =>
                    clamp(value - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX),
                  )
                }
                className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center cursor-pointer"
              >
                <Minus size={12} />
              </button>
              <span className="w-12 text-center text-[9px] font-extrabold text-gray-600">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoom((value) =>
                    clamp(value + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX),
                  )
                }
                className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center cursor-pointer"
              >
                <Plus size={12} />
              </button>
              {[100, 120, 300].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setZoom(value)}
                  className="w-8 h-7 rounded-md bg-white border border-gray-200 text-[8px] font-extrabold cursor-pointer"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={workspaceRef}
            className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-5 sm:p-6"
            onPointerDown={() => setSelectedId(null)}
          >
            <div
              ref={pageRef}
              className="relative shrink-0 bg-white border border-gray-200 shadow-[0_18px_48px_rgba(0,0,0,0.16)]"
              style={{
                width: `${pageWidthMm * visualScale}px`,
                height: `${pageHeightMm * visualScale}px`,
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {items.map((item) => {
                const selected = item.id === selectedId;
                const left = (item.xMm / pageWidthMm) * 100;
                const top = (item.yMm / pageHeightMm) * 100;
                const width = (item.widthMm / pageWidthMm) * 100;
                const height = (item.heightMm / pageHeightMm) * 100;

                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      transform: `rotate(${item.rotation}deg)`,
                      transformOrigin: "center center",
                      zIndex: selected ? 50 : 10,
                      touchAction: "none",
                    }}
                    onPointerDown={(event) =>
                      beginInteraction(event, item.id, "drag")
                    }
                    onPointerMove={moveInteraction}
                    onPointerUp={endInteraction}
                    onPointerCancel={endInteraction}
                  >
                    <div
                      className={`relative w-full h-full bg-white overflow-visible ${selected ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
                    >
                      <img
                        src={printStudioImage}
                        alt={item.label}
                        draggable={false}
                        className="block w-full h-full object-cover pointer-events-none select-none"
                      />
                      {imageBorder && (
                        <div className="absolute inset-0 border border-gray-900/80 pointer-events-none" />
                      )}
                      {cuttingBorder && (
                        <div className="absolute inset-0 border border-dashed border-gray-600/80 pointer-events-none" />
                      )}

                      {selected && (
                        <>
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeItem(item.id);
                            }}
                            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white border-2 border-white shadow-md flex items-center justify-center cursor-pointer"
                            title="Remove"
                          >
                            <X size={10} />
                          </button>

                          <button
                            type="button"
                            onPointerDown={(event) =>
                              beginInteraction(event, item.id, "rotate")
                            }
                            className="absolute left-1/2 -top-7 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 text-white border-2 border-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing"
                            title="Rotate"
                          >
                            <RotateCw size={10} />
                          </button>

                          <button
                            type="button"
                            onPointerDown={(event) =>
                              beginInteraction(event, item.id, "resize")
                            }
                            className="absolute -right-3 -bottom-3 w-6 h-6 rounded-full bg-blue-500 text-white border-2 border-white shadow-md flex items-center justify-center cursor-nwse-resize"
                            title="Resize"
                          >
                            <Move size={10} className="rotate-45" />
                          </button>

                          <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-1 rounded-md bg-slate-900/90 text-white px-1.5 py-1 text-[7px] font-bold whitespace-nowrap pointer-events-none">
                            {item.label} · {item.widthMm.toFixed(1)}×
                            {item.heightMm.toFixed(1)} mm
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {!items.length && (
                <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                      <Grid3X3 size={19} />
                    </div>
                    <p className="text-xs font-extrabold text-gray-400">
                      Your print page is empty
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      Use Quick Add to place photos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-9 shrink-0 bg-white/80 border-t border-gray-200 px-4 flex items-center justify-center gap-2 text-[8px] text-gray-500">
            <Move size={11} />
            Drag
            <span>•</span>
            <RotateCw size={10} />
            Rotate
            <span>•</span>
            <Move size={10} className="rotate-45" />
            Resize
            {selectedItem && (
              <>
                <span>•</span>
                <span>{selectedItem.label}</span>
              </>
            )}
          </div>
        </main>

        {toast && (
          <div className="fixed right-5 top-[74px] z-[10030] w-[300px] rounded-xl border border-amber-200 bg-white shadow-xl p-3">
            <p className="text-[10px] font-extrabold text-gray-900">
              Page Full
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5 leading-relaxed">
              {toast}
            </p>
          </div>
        )}
      </div>

      <footer className="h-8 shrink-0 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-[8px] text-gray-400">
        <span>Photo Layout & Print Studio</span>
        <button
          type="button"
          onClick={rotateSelected}
          disabled={!selectedId}
          className="flex items-center gap-1 hover:text-gray-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCw size={10} />
          Rotate selected 90°
        </button>
      </footer>
    </div>
  );

  return createPortal(modal, document.body);
}
