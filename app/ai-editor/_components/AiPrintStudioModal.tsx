"use client";
import { useAiEditorText } from "./aiEditorI18n";
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, } from "react";
import { createPortal } from "react-dom";
import { AlignCenterHorizontal, AlignLeft, AlignRight, ArrowLeftRight, ChevronDown, Copy, Download, Frame, Grid3X3, Image as ImageIcon, LayoutGrid, Minus, Move, Plus, Printer, Redo2, RotateCw, Ruler, Trash2, Undo2, X, } from "lucide-react";
import jsPDF from "jspdf";

const EXPORT_DPI = 300;
const MAX_ITEMS = 80;
const MAX_HISTORY = 50;
const DEFAULT_GAP_MM = 3;
const DEFAULT_MARGIN_MM = 3;
const DEFAULT_IMAGE_BORDER_MM = 0.25;
const DEFAULT_CUT_MM = 0.2;
const ZOOM_MIN = 50;
const ZOOM_MAX = 400;
const ZOOM_PRESETS = [100, 150, 200, 300];
const ZOOM_STEP = 20;
const MIN_ITEM_MM = 5;
const CUT_COLOR = "#555555";
const BORDER_COLORS = ["#000000", "#FFFFFF", "#6B7280", "#DC2626", "#1D4ED8"];

const PAGE_SIZES = {
    A4: { label: "A4 — 210×297 mm", widthMm: 210, heightMm: 297 },
    A5: { label: "A5 — 148×210 mm", widthMm: 148, heightMm: 210 },
    Letter: { label: "Letter — 216×279 mm", widthMm: 216, heightMm: 279 },
    "3R": { label: "3R — 89×127 mm", widthMm: 89, heightMm: 127 },
    "4R": { label: "4R — 102×152 mm", widthMm: 102, heightMm: 152 },
    "5R": { label: "5R — 127×178 mm", widthMm: 127, heightMm: 178 },
    "6R": { label: "6R — 152×203 mm", widthMm: 152, heightMm: 203 },
    "8R": { label: "8R — 203×254 mm", widthMm: 203, heightMm: 254 },
} as const;
type PageSizeKey = keyof typeof PAGE_SIZES;
type Orientation = "portrait" | "landscape";
type Unit = "mm" | "cm" | "in";
type CutStyle = "dashed" | "solid" | "marks";
type HAlign = "left" | "center" | "right";
type SectionKey = "quick" | "custom" | "border" | "page";
type StudioItem = {
    id: string;
    label: string;
    widthMm: number;
    heightMm: number;
    xMm: number;
    yMm: number;
    rotation: number;
    /** The source image for this placed item; omitted items use the primary image. */
    image?: string;
};
type Preset = {
    id: string;
    label: string;
    widthMm: number;
    heightMm: number;
};
type Combo = {
    id: string;
    label: string;
    parts: [string, number][];
};
type Box = {
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
};

const UNIT_FACTOR: Record<Unit, number> = { mm: 1, cm: 10, in: 25.4 };

const PRESETS: Preset[] = [
    { id: "passport", label: "Passport", widthMm: 45, heightMm: 55 },
    { id: "epassport", label: "E-Passport", widthMm: 25, heightMm: 30 },
    { id: "visa", label: "Visa / Birth", widthMm: 35, heightMm: 45 },
    { id: "stamp", label: "Stamp", widthMm: 20, heightMm: 25 },
    { id: "2x2", label: "2×2 inch", widthMm: 50.8, heightMm: 50.8 },
    { id: "2R", label: "2R", widthMm: 63.5, heightMm: 88.9 },
    { id: "3R", label: "3R", widthMm: 88.9, heightMm: 127 },
    { id: "4R", label: "4R", widthMm: 101.6, heightMm: 152.4 },
    { id: "5R", label: "5R", widthMm: 127, heightMm: 177.8 },
    { id: "6R", label: "6R", widthMm: 152.4, heightMm: 203.2 },
    { id: "8R", label: "8R", widthMm: 203.2, heightMm: 254 },
    { id: "4B", label: "4B", widthMm: 101.6, heightMm: 152.4 },
    { id: "5B", label: "5B", widthMm: 127, heightMm: 177.8 },
    { id: "6B", label: "6B", widthMm: 152.4, heightMm: 203.2 },
    { id: "A4", label: "A4", widthMm: 210, heightMm: 297 },
];
const BD_QUICK_IDS = ["passport", "epassport", "visa", "stamp", "2x2"];
const COMBOS: Combo[] = [
    { id: "combo-4-4", label: "4 Passport + 4 Stamp", parts: [["passport", 4], ["stamp", 4]] },
    { id: "combo-6-8", label: "6 Passport + 8 Stamp", parts: [["passport", 6], ["stamp", 8]] },
    { id: "combo-8-8", label: "8 Passport + 8 Stamp", parts: [["passport", 8], ["stamp", 8]] },
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
function roundNice(value: number): number {
    return parseFloat(value.toFixed(3));
}
function bnDigitsToEn(value: string): string {
    return value
        .replace(/[\u09E6-\u09EF]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6))
        .replace(/\u066B|,/g, ".");
}
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Unable to load the photo for printing."));
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
/** Real on-page box of an item (rotation happens around the centre). */
function getItemBox(item: StudioItem): Box {
    const bounds = getRotatedBounds(item);
    const cx = item.xMm + item.widthMm / 2;
    const cy = item.yMm + item.heightMm / 2;
    return {
        xMm: cx - bounds.widthMm / 2,
        yMm: cy - bounds.heightMm / 2,
        widthMm: bounds.widthMm,
        heightMm: bounds.heightMm,
    };
}
function overlaps(a: Box, b: Box, gapMm: number): boolean {
    const eps = 0.001;
    return !(a.xMm + a.widthMm + gapMm <= b.xMm + eps ||
        b.xMm + b.widthMm + gapMm <= a.xMm + eps ||
        a.yMm + a.heightMm + gapMm <= b.yMm + eps ||
        b.yMm + b.heightMm + gapMm <= a.yMm + eps);
}
function uniqueSorted(values: number[]): number[] {
    return Array.from(new Set(values.map((value) => Math.round(value * 1000) / 1000))).sort((a, b) => a - b);
}
/**
 * Tight packing: candidate positions come from the page margin and from the
 * edges of the photos that are already placed, so photos sit snugly with
 * exactly the chosen gap between them.
 */
function findFreePosition(widthMm: number, heightMm: number, pageWidthMm: number, pageHeightMm: number, current: StudioItem[], gapMm: number, marginMm: number): {
    xMm: number;
    yMm: number;
} | null {
    const eps = 0.001;
    if (widthMm > pageWidthMm + eps || heightMm > pageHeightMm + eps) {
        return null;
    }
    const mx = Math.min(marginMm, Math.max(0, (pageWidthMm - widthMm) / 2));
    const my = Math.min(marginMm, Math.max(0, (pageHeightMm - heightMm) / 2));
    const boxes = current.map(getItemBox);
    const xs = uniqueSorted([
        mx,
        ...boxes.flatMap((box) => [box.xMm, box.xMm + box.widthMm + gapMm]),
    ]);
    const ys = uniqueSorted([
        my,
        ...boxes.flatMap((box) => [box.yMm, box.yMm + box.heightMm + gapMm]),
    ]);
    for (const y of ys) {
        if (y < my - eps || y + heightMm > pageHeightMm - my + eps)
            continue;
        for (const x of xs) {
            if (x < mx - eps || x + widthMm > pageWidthMm - mx + eps)
                continue;
            const candidate: Box = { xMm: x, yMm: y, widthMm, heightMm };
            if (!boxes.some((box) => overlaps(candidate, box, gapMm))) {
                return { xMm: x, yMm: y };
            }
        }
    }
    return null;
}
function packItems(list: StudioItem[], pageWidthMm: number, pageHeightMm: number, gapMm: number, marginMm: number, sortByArea = true): {
    placed: StudioItem[];
    failed: number;
} {
    const ordered = sortByArea
        ? [...list].sort((a, b) => b.widthMm * b.heightMm - a.widthMm * a.heightMm)
        : [...list];
    const placed: StudioItem[] = [];
    let failed = 0;
    for (const source of ordered) {
        const item = { ...source, rotation: 0 };
        const position = findFreePosition(item.widthMm, item.heightMm, pageWidthMm, pageHeightMm, placed, gapMm, marginMm);
        if (!position) {
            failed += 1;
            continue;
        }
        placed.push({ ...item, xMm: position.xMm, yMm: position.yMm });
    }
    return { placed, failed };
}
/**
 * Aligns every "row" of photos like text-align: photos that share a horizontal
 * band move together, so the gaps between them never change.
 */
function alignRows(list: StudioItem[], pageWidthMm: number, marginMm: number, mode: HAlign): StudioItem[] {
    if (!list.length)
        return list;
    const entries = list
        .map((item) => ({ item, box: getItemBox(item) }))
        .sort((a, b) => a.box.yMm - b.box.yMm);
    const clusters: { bottom: number; members: typeof entries }[] = [];
    for (const entry of entries) {
        const last = clusters[clusters.length - 1];
        if (last && entry.box.yMm < last.bottom - 0.001) {
            last.members.push(entry);
            last.bottom = Math.max(last.bottom, entry.box.yMm + entry.box.heightMm);
        }
        else {
            clusters.push({
                bottom: entry.box.yMm + entry.box.heightMm,
                members: [entry],
            });
        }
    }
    const shifts = new Map<string, number>();
    for (const cluster of clusters) {
        const minX = Math.min(...cluster.members.map((member) => member.box.xMm));
        const maxX = Math.max(...cluster.members.map((member) => member.box.xMm + member.box.widthMm));
        const width = maxX - minX;
        const wanted = mode === "left"
            ? marginMm
            : mode === "center"
                ? (pageWidthMm - width) / 2
                : pageWidthMm - marginMm - width;
        const target = clamp(wanted, 0, Math.max(0, pageWidthMm - width));
        cluster.members.forEach((member) => shifts.set(member.item.id, target - minX));
    }
    return list.map((item) => ({
        ...item,
        xMm: item.xMm + (shifts.get(item.id) ?? 0),
    }));
}
/** Pack photos with the exact gap/margin, then apply the horizontal alignment. */
function flowLayout(list: StudioItem[], pageWidthMm: number, pageHeightMm: number, gapMm: number, marginMm: number, mode: HAlign, sortByArea: boolean): {
    placed: StudioItem[];
    failed: number;
} {
    const { placed, failed } = packItems(list, pageWidthMm, pageHeightMm, gapMm, marginMm, sortByArea);
    return { placed: alignRows(placed, pageWidthMm, marginMm, mode), failed };
}
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
/** Exact-size print sheet: 1 image = 1 page, no scaling, no margins. */
function buildPrintHtml(src: string, widthMm: number, heightMm: number, title: string): string {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: ${widthMm}mm; height: ${heightMm}mm; background: #fff; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet { position: relative; width: ${widthMm}mm; height: ${heightMm}mm; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; }
.sheet img { position: absolute; left: 0; top: 0; display: block; width: ${widthMm}mm; height: ${heightMm}mm; }
</style>
</head>
<body>
<div class="sheet"><img id="sheet" src="${src}" alt="" /></div>
</body>
</html>`;
}
function fitItemsToPage(items: StudioItem[], widthMm: number, heightMm: number): StudioItem[] {
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
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number): void {
    const sw = image.naturalWidth || image.width;
    const sh = image.naturalHeight || image.height;
    if (!sw || !sh)
        return;
    const scale = Math.max(width / sw, height / sh);
    const cropW = width / scale;
    const cropH = height / scale;
    const cropX = Math.max(0, (sw - cropW) / 2);
    const cropY = Math.max(0, (sh - cropH) / 2);
    ctx.drawImage(image, cropX, cropY, cropW, cropH, x, y, width, height);
}
/** Corner crop marks (in mm) drawn just outside the photo, inside the gap. */
function cropMarkSegments(widthMm: number, heightMm: number, gapMm: number): [number, number, number, number][] {
    const offset = 0.3;
    const length = clamp((gapMm - offset * 2) / 2, 0.8, 3);
    const w = widthMm;
    const h = heightMm;
    return [
        [-offset - length, 0, -offset, 0],
        [0, -offset - length, 0, -offset],
        [w + offset, 0, w + offset + length, 0],
        [w, -offset - length, w, -offset],
        [-offset - length, h, -offset, h],
        [0, h + offset, 0, h + offset + length],
        [w + offset, h, w + offset + length, h],
        [w, h + offset, w, h + offset + length],
    ];
}
function formatInUnit(mm: number, unit: Unit): number {
    return roundNice(mm / UNIT_FACTOR[unit]);
}
function nameForPdf(pageSize: PageSizeKey): string {
    return `photo-print-${pageSize.toLowerCase()}.pdf`;
}

/* ───────────────────────────── small UI pieces ───────────────────────────── */

function Section({ title, icon, open, onToggle, children, }: {
    title: string;
    icon: ReactNode;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (<div className="border-b border-[#E3D6B8]">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F2E8D2]/60 cursor-pointer transition-colors">
        <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[#3B2F1E]/70">
          {icon}
          {title}
        </span>
        <ChevronDown size={14} className={`text-[#3B2F1E]/50 transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>);
}

function Toggle({ checked, onChange, label, hint, }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    hint?: string;
}) {
    return (<button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-left cursor-pointer transition-colors ${checked ? "border-[#DC2626]/40 bg-[#DC2626]/5" : "border-[#E3D6B8] bg-[#F2E8D2] hover:bg-[#E3D6B8]"}`}>
      <span className="min-w-0">
        <span className="block text-[12px] font-bold text-[#3B2F1E]">{label}</span>
        {hint && (<span className="block text-[10px] text-[#3B2F1E]/55 leading-snug mt-0.5">{hint}</span>)}
      </span>
      <span className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${checked ? "bg-[#DC2626]" : "bg-[#3B2F1E]/25"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`}/>
      </span>
    </button>);
}

function Segmented<V extends string>({ value, options, onChange, }: {
    value: V;
    options: { value: V; label: string }[];
    onChange: (value: V) => void;
}) {
    return (<div className="grid gap-1 p-1 rounded-lg bg-[#E3D6B8]/60" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (<button key={option.value} type="button" onClick={() => onChange(option.value)} className={`h-7 rounded-md text-[11px] font-extrabold cursor-pointer transition-colors ${value === option.value ? "bg-white text-[#DC2626] shadow-sm" : "text-[#3B2F1E]/70 hover:text-[#3B2F1E]"}`}>
          {option.label}
        </button>))}
    </div>);
}

function RangeField({ label, valueLabel, value, min, max, step, onChange, }: {
    label: string;
    valueLabel: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}) {
    return (<div>
      <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-[#3B2F1E]/70">
        <span>{label}</span>
        <span className="text-[#3B2F1E] font-extrabold">{valueLabel}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-[#DC2626] cursor-pointer"/>
    </div>);
}

function ColorField({ value, onChange, }: {
    value: string;
    onChange: (value: string) => void;
}) {
    return (<div className="flex items-center gap-1.5 flex-wrap">
      {BORDER_COLORS.map((color) => (<button key={color} type="button" onClick={() => onChange(color)} aria-label={color} className={`w-6 h-6 rounded-full border cursor-pointer transition-transform hover:scale-110 ${value.toLowerCase() === color.toLowerCase() ? "ring-2 ring-[#DC2626] ring-offset-1 border-white" : "border-[#3B2F1E]/25"}`} style={{ backgroundColor: color }}/>))}
      <label className="relative w-6 h-6 rounded-full border border-[#3B2F1E]/25 overflow-hidden cursor-pointer" style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}>
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
      </label>
    </div>);
}

function NumberField({ value, onCommit, min, max, suffix, ariaLabel, }: {
    value: number;
    onCommit: (value: number) => void;
    min: number;
    max: number;
    suffix?: string;
    ariaLabel: string;
}) {
    const [draft, setDraft] = useState(String(roundNice(value)));
    const [focused, setFocused] = useState(false);
    useEffect(() => {
        if (!focused)
            setDraft(String(roundNice(value)));
    }, [value, focused]);
    const commit = () => {
        const parsed = parseFloat(bnDigitsToEn(draft));
        if (Number.isFinite(parsed)) {
            const next = clamp(parsed, min, max);
            onCommit(next);
            setDraft(String(roundNice(next)));
        }
        else {
            setDraft(String(roundNice(value)));
        }
    };
    return (<div className="relative">
      <input type="text" inputMode="decimal" aria-label={ariaLabel} value={draft} onFocus={(event) => {
            setFocused(true);
            event.currentTarget.select();
        }} onBlur={() => {
            setFocused(false);
            commit();
        }} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter")
                event.currentTarget.blur();
        }} className="h-8 w-full rounded-md border border-[#E3D6B8] bg-white px-2 pr-8 text-[12px] font-bold text-[#3B2F1E] outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/30"/>
      {suffix && (<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#3B2F1E]/45">
          {suffix}
        </span>)}
    </div>);
}

/** Compact native number field with browser spinner controls for preset dimensions. */
function PresetDimensionField({ value, ariaLabel, onCommit }: {
    value: number;
    ariaLabel: string;
    onCommit: (value: number) => void;
}) {
    const [draft, setDraft] = useState(String(roundNice(value)));
    const [focused, setFocused] = useState(false);
    useEffect(() => {
        if (!focused)
            setDraft(String(roundNice(value)));
    }, [value, focused]);
    const commit = () => {
        const parsed = Number(bnDigitsToEn(draft));
        if (Number.isFinite(parsed)) {
            const next = clamp(parsed, MIN_ITEM_MM, 600);
            onCommit(next);
            setDraft(String(roundNice(next)));
        }
        else {
            setDraft(String(roundNice(value)));
        }
    };
    return (<input
      type="number"
      inputMode="decimal"
      min={MIN_ITEM_MM}
      max={600}
      step={Number.isInteger(value) ? 1 : 0.1}
      aria-label={ariaLabel}
      title={`${ariaLabel} (mm)`}
      value={draft}
      onFocus={(event) => {
          setFocused(true);
          event.currentTarget.select();
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
          setFocused(false);
          commit();
      }}
      onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter")
              event.currentTarget.blur();
      }}
      className="h-7 min-w-0 w-full rounded-md border border-[#DCCDAE] bg-white px-1.5 text-[11px] font-bold text-[#3B2F1E] outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/25"
    />);
}

/** Vector overlay (in mm) shared by the live preview: image border + cutting guide. */
function ItemOverlay({ widthMm, heightMm, gapMm, imageBorder, imageBorderMm, imageBorderColor, cuttingBorder, cutStyle, cutMm, }: {
    widthMm: number;
    heightMm: number;
    gapMm: number;
    imageBorder: boolean;
    imageBorderMm: number;
    imageBorderColor: string;
    cuttingBorder: boolean;
    cutStyle: CutStyle;
    cutMm: number;
}) {
    if (!imageBorder && !cuttingBorder)
        return null;
    return (<svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${widthMm} ${heightMm}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      {imageBorder && (<rect x={imageBorderMm / 2} y={imageBorderMm / 2} width={Math.max(0, widthMm - imageBorderMm)} height={Math.max(0, heightMm - imageBorderMm)} fill="none" stroke={imageBorderColor} strokeWidth={imageBorderMm}/>)}
      {cuttingBorder && cutStyle !== "marks" && (<rect x={0} y={0} width={widthMm} height={heightMm} fill="none" stroke={CUT_COLOR} strokeWidth={cutMm} strokeDasharray={cutStyle === "dashed" ? "1.1 1.1" : undefined}/>)}
      {cuttingBorder && cutStyle === "marks" && cropMarkSegments(widthMm, heightMm, gapMm).map(([x1, y1, x2, y2], index) => (<line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={CUT_COLOR} strokeWidth={cutMm}/>))}
    </svg>);
}

export type AiPrintStudioProps = {
    open: boolean;
    image: string | null;
    preset?: { id?: string; label?: string; widthMm: number; heightMm: number } | null;
    onClose: () => void;
    /** Optional: print the single image on its own sheet (the old behaviour). */
    onPrintSingle?: () => void | Promise<void>;
    /** Distinct source photos to place together in the print studio. */
    images?: Array<{ image: string; preset?: { id?: string; label?: string; widthMm: number; heightMm: number } | null }>;
    /** Render inside the page layout (fills its parent) instead of a full-screen overlay. */
    inline?: boolean;
};

export default function AiPrintStudioModal({ open, image, preset, onClose, onPrintSingle, images, inline = false }: AiPrintStudioProps) {
    const { t } = useAiEditorText();
    const printStudioOpen = open;
    const currentPreset = preset;
    const sourceImages = useMemo(() => images?.length ? images : image ? [{ image, preset: currentPreset }] : [], [images, image, currentPreset]);
    const printStudioImage = sourceImages[0]?.image ?? image;
    const closePrintStudio = onClose;
    const pageRef = useRef<HTMLDivElement | null>(null);
    const workspaceRef = useRef<HTMLDivElement | null>(null);
    const toastTimerRef = useRef<number | null>(null);
    const printCleanupRef = useRef<(() => void) | null>(null);
    const itemsRef = useRef<StudioItem[]>([]);
    const zoomRef = useRef(100);
    const panRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        scrollLeft: number;
        scrollTop: number;
        moved: boolean;
    } | null>(null);
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
    const [hAlign, setHAlign] = useState<HAlign>("left");
    const [autoLayout, setAutoLayout] = useState(true);
    const [isPanning, setIsPanning] = useState(false);
    const [items, setItems] = useState<StudioItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [gapMm, setGapMm] = useState(DEFAULT_GAP_MM);
    const [marginMm, setMarginMm] = useState(DEFAULT_MARGIN_MM);
    const [freeSize, setFreeSize] = useState(false);
    const [cuttingBorder, setCuttingBorder] = useState(false);
    const [cutStyle, setCutStyle] = useState<CutStyle>("dashed");
    const [cutMm, setCutMm] = useState(DEFAULT_CUT_MM);
    const [imageBorder, setImageBorder] = useState(false);
    const [imageBorderMm, setImageBorderMm] = useState(DEFAULT_IMAGE_BORDER_MM);
    const [imageBorderColor, setImageBorderColor] = useState("#000000");
    const [unit, setUnit] = useState<Unit>("mm");
    const [customWidthMm, setCustomWidthMm] = useState(35);
    const [customHeightMm, setCustomHeightMm] = useState(45);
    const [presetDimensions, setPresetDimensions] = useState<Record<string, { widthMm: number; heightMm: number }>>(
        () => Object.fromEntries(PRESETS.map((entry) => [entry.id, { widthMm: entry.widthMm, heightMm: entry.heightMm }]))
    );
    const [applyAllSizeId, setApplyAllSizeId] = useState("");
    const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
        quick: true,
        custom: true,
        border: true,
        page: true,
    });
    const [zoom, setZoom] = useState(100);
    const [fitScale, setFitScale] = useState(2.4);
    const [isExporting, setIsExporting] = useState(false);
    const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
    const [history, setHistory] = useState<StudioItem[][]>([]);
    const [future, setFuture] = useState<StudioItem[][]>([]);
    itemsRef.current = items;
    zoomRef.current = zoom;
    const isMultiPhotoSession = sourceImages.length > 1;
    const selectedItem = items.find((item) => item.id === selectedId) ?? null;

    const sourcePreset = useMemo<Preset>(() => {
        if (currentPreset?.widthMm && currentPreset?.heightMm) {
            const fit = Math.min(1, 190 / currentPreset.widthMm, 277 / currentPreset.heightMm);
            return {
                id: currentPreset.id ?? "custom",
                label: currentPreset.label ?? "Photo",
                widthMm: Math.round(currentPreset.widthMm * fit * 10) / 10,
                heightMm: Math.round(currentPreset.heightMm * fit * 10) / 10,
            };
        }
        return (PRESETS.find((entry) => entry.id === "passport") ?? {
            id: "passport",
            label: "Passport",
            widthMm: 45,
            heightMm: 55,
        });
    }, [currentPreset]);
    const activePhotoPreset: Preset = selectedItem
        ? {
            id: "selected-photo",
            label: selectedItem.label,
            widthMm: selectedItem.widthMm,
            heightMm: selectedItem.heightMm,
        }
        : sourcePreset;
    const hasActivePhotoForQuickAdd = !isMultiPhotoSession || !!selectedItem?.image;
    const selectedApplyAllPreset: Preset | null = applyAllSizeId === "custom"
        ? { id: "custom", label: "Custom", widthMm: customWidthMm, heightMm: customHeightMm }
        : (() => {
            const entry = PRESETS.find((candidate) => candidate.id === applyAllSizeId);
            return entry ? { ...entry, ...(presetDimensions[entry.id] ?? {}) } : null;
        })();
    const updatePresetDimension = useCallback((presetId: string, field: "widthMm" | "heightMm", value: number) => {
        const base = PRESETS.find((entry) => entry.id === presetId);
        if (!base || !Number.isFinite(value))
            return;
        setPresetDimensions((current) => ({
            ...current,
            [presetId]: {
                ...(current[presetId] ?? { widthMm: base.widthMm, heightMm: base.heightMm }),
                [field]: clamp(value, MIN_ITEM_MM, 600),
            },
        }));
    }, []);
    const pageWidthMm = orientation === "portrait"
        ? PAGE_SIZES[pageSizeKey].widthMm
        : PAGE_SIZES[pageSizeKey].heightMm;
    const pageHeightMm = orientation === "portrait"
        ? PAGE_SIZES[pageSizeKey].heightMm
        : PAGE_SIZES[pageSizeKey].widthMm;
    const visualScale = fitScale * (zoom / 100);

    const showToast = useCallback((message: string, title = "Notice") => {
        setToast({ title, message });
        if (toastTimerRef.current)
            window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
    }, []);
    const toggleSection = useCallback((key: SectionKey) => {
        setOpenSections((current) => ({ ...current, [key]: !current[key] }));
    }, []);
    const setZoomCentered = useCallback((next: number) => {
        const clamped = clamp(Math.round(next), ZOOM_MIN, ZOOM_MAX);
        const workspace = workspaceRef.current;
        if (!workspace) {
            setZoom(clamped);
            return;
        }
        const fracX = (workspace.scrollLeft + workspace.clientWidth / 2) / Math.max(1, workspace.scrollWidth);
        const fracY = (workspace.scrollTop + workspace.clientHeight / 2) / Math.max(1, workspace.scrollHeight);
        setZoom(clamped);
        window.requestAnimationFrame(() => {
            workspace.scrollLeft = fracX * workspace.scrollWidth - workspace.clientWidth / 2;
            workspace.scrollTop = fracY * workspace.scrollHeight - workspace.clientHeight / 2;
        });
    }, []);
    const commit = useCallback((next: StudioItem[], previous: StudioItem[]) => {
        setHistory((current) => [
            ...current.slice(-(MAX_HISTORY - 1)),
            previous.map((item) => ({ ...item })),
        ]);
        setFuture([]);
        setItems(next);
    }, []);
    const createInitialLayout = useCallback(() => {
        setPageSizeKey("A4");
        setOrientation("portrait");
        setHAlign("left");
        setAutoLayout(true);
        setGapMm(DEFAULT_GAP_MM);
        setMarginMm(DEFAULT_MARGIN_MM);
        setFreeSize(false);
        setCuttingBorder(false);
        setCutStyle("dashed");
        setCutMm(DEFAULT_CUT_MM);
        setImageBorder(false);
        setImageBorderMm(DEFAULT_IMAGE_BORDER_MM);
        setImageBorderColor("#000000");
        setUnit("mm");
        setCustomWidthMm(35);
        setCustomHeightMm(45);
        setApplyAllSizeId("");
        setZoom(100);
        setHistory([]);
        setFuture([]);
        setSelectedId(null);
        if (!printStudioImage) {
            setItems([]);
            return;
        }
        const nextItems: StudioItem[] = [];
        let skipped = 0;
        const sources = sourceImages.length ? sourceImages : [{ image: printStudioImage, preset: currentPreset }];
        for (const source of sources.slice(0, MAX_ITEMS)) {
            const requested = source.preset?.widthMm && source.preset?.heightMm ? source.preset : sourcePreset;
            const fit = Math.min(1, 190 / requested.widthMm, 277 / requested.heightMm);
            const widthMm = Math.round(requested.widthMm * fit * 10) / 10;
            const heightMm = Math.round(requested.heightMm * fit * 10) / 10;
            const placement = findFreePosition(widthMm, heightMm, PAGE_SIZES.A4.widthMm, PAGE_SIZES.A4.heightMm, nextItems, DEFAULT_GAP_MM, DEFAULT_MARGIN_MM);
            if (!placement) {
                skipped += 1;
                continue;
            }
            nextItems.push({
                id: uniqueId(),
                label: requested.label || "Photo",
                widthMm,
                heightMm,
                xMm: placement.xMm,
                yMm: placement.yMm,
                rotation: 0,
                image: source.image,
            });
        }
        setItems(nextItems);
        setSelectedId(sourceImages.length > 1 ? null : nextItems[0]?.id ?? null);
        if (skipped || sources.length > MAX_ITEMS) {
            showToast(`${skipped + Math.max(0, sources.length - MAX_ITEMS)} selected photo(s) did not fit on this page. Choose a larger page or remove unused items.`, "Page Full");
        }
    }, [currentPreset, printStudioImage, showToast, sourceImages, sourcePreset]);
    useEffect(() => setMounted(true), []);
    useEffect(() => {
        if (printStudioOpen) {
            createInitialLayout();
        }
        else {
            // Release references to base64 source images and undo snapshots as soon as
            // the studio closes; the gallery/history remains owned by the parent page.
            printCleanupRef.current?.();
            setItems([]);
            setHistory([]);
            setFuture([]);
            setSelectedId(null);
            setToast(null);
            itemsRef.current = [];
            panRef.current = null;
            interactionRef.current = null;
        }
    }, [printStudioOpen, createInitialLayout]);
    useEffect(() => {
        const cleanupOnExit = () => printCleanupRef.current?.();
        window.addEventListener("pagehide", cleanupOnExit);
        window.addEventListener("beforeunload", cleanupOnExit);
        return () => {
            window.removeEventListener("pagehide", cleanupOnExit);
            window.removeEventListener("beforeunload", cleanupOnExit);
            printCleanupRef.current?.();
            if (toastTimerRef.current !== null)
                window.clearTimeout(toastTimerRef.current);
        };
    }, []);

    const undo = useCallback(() => {
        const previous = history[history.length - 1];
        if (!previous)
            return;
        setFuture((currentFuture) => [items.map((item) => ({ ...item })), ...currentFuture].slice(0, MAX_HISTORY));
        setItems(previous.map((item) => ({ ...item })));
        setSelectedId(previous[0]?.id ?? null);
        setHistory((current) => current.slice(0, -1));
    }, [history, items]);
    const redo = useCallback(() => {
        const next = future[0];
        if (!next)
            return;
        setHistory((currentHistory) => [...currentHistory, items.map((item) => ({ ...item }))].slice(-MAX_HISTORY));
        setItems(next.map((item) => ({ ...item })));
        setSelectedId(next[0]?.id ?? null);
        setFuture((current) => current.slice(1));
    }, [future, items]);
    const removeItem = useCallback((id: string) => {
        const next = items.filter((item) => item.id !== id);
        commit(next, items);
        setSelectedId((current) => (current === id ? null : current));
    }, [commit, items]);
    const nudgeSelected = useCallback((dx: number, dy: number) => {
        if (!selectedId)
            return;
        const next = items.map((item) => item.id === selectedId
            ? {
                ...item,
                xMm: clamp(item.xMm + dx, 0, Math.max(0, pageWidthMm - item.widthMm)),
                yMm: clamp(item.yMm + dy, 0, Math.max(0, pageHeightMm - item.heightMm)),
            }
            : item);
        setAutoLayout(false);
        commit(next, items);
    }, [commit, items, pageHeightMm, pageWidthMm, selectedId]);

    useEffect(() => {
        if (!printStudioOpen)
            return;
        const previousOverflow = document.body.style.overflow;
        if (!inline)
            document.body.style.overflow = "hidden";
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const typing = !!target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.tagName === "SELECT" ||
                    target.isContentEditable);
            if (event.key === "Escape") {
                if (typing) {
                    target?.blur();
                    return;
                }
                closePrintStudio();
                return;
            }
            if (typing)
                return;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
                event.preventDefault();
                if (event.shiftKey)
                    redo();
                else
                    undo();
                return;
            }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
                event.preventDefault();
                redo();
                return;
            }
            if (!selectedId)
                return;
            if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault();
                removeItem(selectedId);
                return;
            }
            const step = event.shiftKey ? 5 : 0.5;
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                nudgeSelected(-step, 0);
            }
            else if (event.key === "ArrowRight") {
                event.preventDefault();
                nudgeSelected(step, 0);
            }
            else if (event.key === "ArrowUp") {
                event.preventDefault();
                nudgeSelected(0, -step);
            }
            else if (event.key === "ArrowDown") {
                event.preventDefault();
                nudgeSelected(0, step);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            if (!inline)
                document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [printStudioOpen, closePrintStudio, redo, undo, inline, selectedId, removeItem, nudgeSelected]);
    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace)
            return;
        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey)
                return;
            event.preventDefault();
            setZoomCentered(zoomRef.current - Math.sign(event.deltaY) * 10);
        };
        workspace.addEventListener("wheel", onWheel, { passive: false });
        return () => workspace.removeEventListener("wheel", onWheel);
    }, [printStudioOpen, printStudioImage, mounted, setZoomCentered]);
    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace)
            return;
        const updateScale = () => {
            const rect = workspace.getBoundingClientRect();
            if (!rect.width || !rect.height)
                return;
            const widthScale = (rect.width - 70) / pageWidthMm;
            const heightScale = (rect.height - 70) / pageHeightMm;
            setFitScale(clamp(Math.min(widthScale, heightScale), 1.2, 4.5));
        };
        updateScale();
        const observer = new ResizeObserver(updateScale);
        observer.observe(workspace);
        return () => observer.disconnect();
    }, [pageWidthMm, pageHeightMm, printStudioOpen, printStudioImage, mounted]);

    const reflow = useCallback((list: StudioItem[], mode: HAlign = hAlign, sortByArea = false) => flowLayout(list, pageWidthMm, pageHeightMm, gapMm, marginMm, mode, sortByArea), [gapMm, hAlign, marginMm, pageHeightMm, pageWidthMm]);
    const finalizeAuto = useCallback((list: StudioItem[]): StudioItem[] => {
        if (!autoLayout)
            return list;
        const flowed = reflow(list);
        return flowed.failed ? list : flowed.placed;
    }, [autoLayout, reflow]);
    const addPreset = useCallback((entry: Preset, quantity = 1, silent = false) => {
        const activeImage = selectedItem?.image ?? (isMultiPhotoSession ? null : printStudioImage);
        if (!activeImage) {
            showToast("প্রথমে পেজ থেকে একটি ছবি নির্বাচন করুন। সব ছবির সাইজ বদলাতে উপরের Apply to all অপশন ব্যবহার করুন।", "ছবি নির্বাচন করুন");
            return;
        }
        if (entry.widthMm > pageWidthMm + 0.001 || entry.heightMm > pageHeightMm + 0.001) {
            showToast("This size is larger than the selected page.", "Size too large");
            return;
        }
        const next = [...items];
        let added = 0;
        for (let index = 0; index < quantity; index += 1) {
            if (next.length >= MAX_ITEMS)
                break;
            const placement = findFreePosition(entry.widthMm, entry.heightMm, pageWidthMm, pageHeightMm, next, gapMm, marginMm);
            if (!placement)
                break;
            next.push({
                id: uniqueId(),
                label: entry.label,
                widthMm: entry.widthMm,
                heightMm: entry.heightMm,
                xMm: placement.xMm,
                yMm: placement.yMm,
                rotation: 0,
                image: activeImage,
            });
            added += 1;
        }
        if (!added) {
            showToast("Page is full, can't add more images.", "Page Full");
            return;
        }
        if (added < quantity && !silent) {
            showToast("Page is full, can't add more images.", "Page Full");
        }
        commit(finalizeAuto(next), items);
        setSelectedId(next[next.length - 1]?.id ?? null);
    }, [
        commit,
        finalizeAuto,
        gapMm,
        items,
        marginMm,
        pageHeightMm,
        pageWidthMm,
        printStudioImage,
        isMultiPhotoSession,
        selectedItem,
        showToast,
    ]);
    const addCombo = useCallback((combo: Combo) => {
        const activeImage = selectedItem?.image ?? (isMultiPhotoSession ? null : printStudioImage);
        if (!activeImage) {
            showToast("প্রথমে পেজ থেকে একটি ছবি নির্বাচন করুন।", "ছবি নির্বাচন করুন");
            return;
        }
        const next: StudioItem[] = [];
        let missing = 0;
        for (const [presetId, quantity] of combo.parts) {
            const baseEntry = PRESETS.find((candidate) => candidate.id === presetId);
            if (!baseEntry)
                continue;
            const entry = { ...baseEntry, ...(presetDimensions[presetId] ?? {}) };
            for (let index = 0; index < quantity; index += 1) {
                const placement = findFreePosition(entry.widthMm, entry.heightMm, pageWidthMm, pageHeightMm, next, gapMm, marginMm);
                if (!placement) {
                    missing += 1;
                    continue;
                }
                next.push({
                    id: uniqueId(),
                    label: entry.label,
                    widthMm: entry.widthMm,
                    heightMm: entry.heightMm,
                    xMm: placement.xMm,
                    yMm: placement.yMm,
                    rotation: 0,
                    image: activeImage,
                });
            }
        }
        setAutoLayout(true);
        commit(alignRows(next, pageWidthMm, marginMm, hAlign), items);
        setSelectedId(null);
        if (missing) {
            showToast(`${missing} photo(s) did not fit on this page. Try a bigger page size.`, "Page Full");
        }
    }, [commit, gapMm, hAlign, isMultiPhotoSession, items, marginMm, pageHeightMm, pageWidthMm, presetDimensions, printStudioImage, selectedItem, showToast]);
    const addCustom = useCallback((quantity: number, silent = false) => {
        addPreset({
            id: "custom",
            label: "Custom",
            widthMm: customWidthMm,
            heightMm: customHeightMm,
        }, quantity, silent);
    }, [addPreset, customHeightMm, customWidthMm]);
    const applySizeToAllPhotos = useCallback((entry: Preset) => {
        if (!items.length && !sourceImages.length)
            return;
        if (entry.widthMm < MIN_ITEM_MM || entry.heightMm < MIN_ITEM_MM || entry.widthMm > 600 || entry.heightMm > 600) {
            showToast("ছবির সাইজ ৫ mm থেকে ৬০০ mm-এর মধ্যে হতে হবে।", "Invalid size");
            return;
        }

        // Keep one placed item for every originally selected source photo. A source
        // that could not fit in the initial mixed-size layout is restored here.
        const remainingItems = [...items];
        const originalSourceItems: StudioItem[] = sourceImages.map((source) => {
            const matchIndex = remainingItems.findIndex((item) => item.image === source.image);
            if (matchIndex >= 0) {
                return remainingItems.splice(matchIndex, 1)[0];
            }
            return {
                id: uniqueId(),
                label: source.preset?.label ?? entry.label,
                widthMm: source.preset?.widthMm ?? entry.widthMm,
                heightMm: source.preset?.heightMm ?? entry.heightMm,
                xMm: marginMm,
                yMm: marginMm,
                rotation: 0,
                image: source.image,
            };
        });
        // Also resize any extra copies the user added after selecting the photos.
        const resized = [...originalSourceItems, ...remainingItems].map((item) => ({
            ...item,
            label: entry.label,
            widthMm: entry.widthMm,
            heightMm: entry.heightMm,
            rotation: 0,
        }));
        const layout = flowLayout(resized, pageWidthMm, pageHeightMm, gapMm, marginMm, hAlign, true);
        if (layout.failed) {
            showToast(`${entry.label} সাইজে সব ${resized.length}টি ছবি এই পেজে ফিট হবে না। ছোট সাইজ বা বড় পেজ নির্বাচন করুন। কোনো ছবি পরিবর্তন করা হয়নি।`, "সব ছবি ফিট হচ্ছে না");
            return;
        }
        setAutoLayout(true);
        commit(layout.placed, items);
        showToast(`সব ${resized.length}টি ছবিতে ${entry.label} (${roundNice(entry.widthMm)}×${roundNice(entry.heightMm)} mm) প্রয়োগ হয়েছে।`, "সব ছবির সাইজ আপডেট হয়েছে");
    }, [commit, gapMm, hAlign, items, marginMm, pageHeightMm, pageWidthMm, showToast, sourceImages]);
    const duplicateSelected = useCallback(() => {
        const source = items.find((item) => item.id === selectedId);
        if (!source)
            return;
        if (items.length >= MAX_ITEMS) {
            showToast("Page is full, can't add more images.", "Page Full");
            return;
        }
        const placement = findFreePosition(source.widthMm, source.heightMm, pageWidthMm, pageHeightMm, items, gapMm, marginMm);
        if (!placement) {
            showToast("Page is full, can't add more images.", "Page Full");
            return;
        }
        const copy: StudioItem = {
            ...source,
            id: uniqueId(),
            xMm: placement.xMm,
            yMm: placement.yMm,
            rotation: 0,
        };
        commit(finalizeAuto([...items, copy]), items);
        setSelectedId(copy.id);
    }, [commit, finalizeAuto, gapMm, items, marginMm, pageHeightMm, pageWidthMm, selectedId, showToast]);
    const updateSelectedSize = useCallback((field: "widthMm" | "heightMm", value: number) => {
        if (!selectedId)
            return;
        const resized = items.map((item) => {
            if (item.id !== selectedId)
                return item;
            const limit = field === "widthMm" ? pageWidthMm : pageHeightMm;
            const updated = { ...item, [field]: clamp(value, MIN_ITEM_MM, limit) };
            return {
                ...updated,
                xMm: clamp(updated.xMm, 0, Math.max(0, pageWidthMm - updated.widthMm)),
                yMm: clamp(updated.yMm, 0, Math.max(0, pageHeightMm - updated.heightMm)),
            };
        });
        if (autoLayout) {
            const flowed = reflow(resized);
            if (flowed.failed) {
                showToast("Not all photos fit at this size. Try a smaller size or a bigger page.", "Page Full");
                return;
            }
            commit(flowed.placed, items);
            return;
        }
        commit(resized, items);
    }, [autoLayout, commit, items, pageHeightMm, pageWidthMm, reflow, selectedId, showToast]);
    const applySizeToAll = useCallback(() => {
        const source = items.find((item) => item.id === selectedId);
        if (!source)
            return;
        const resized = items.map((item) => ({
            ...item,
            widthMm: source.widthMm,
            heightMm: source.heightMm,
        }));
        const { placed, failed } = reflow(resized, hAlign, true);
        if (failed) {
            showToast("Not all photos fit at this size. Try a smaller size or a bigger page.", "Page Full");
            return;
        }
        setAutoLayout(true);
        commit(placed, items);
    }, [commit, hAlign, items, reflow, selectedId, showToast]);
    const applyPageChange = useCallback((width: number, height: number) => {
        let next: StudioItem[];
        if (autoLayout) {
            const flowed = flowLayout(items, width, height, gapMm, marginMm, hAlign, false);
            if (flowed.failed) {
                next = fitItemsToPage(items, width, height);
                setAutoLayout(false);
                showToast("Some photos do not fit on this page. Press Auto or pick a bigger page.", "Page Full");
            }
            else {
                next = flowed.placed;
            }
        }
        else {
            next = fitItemsToPage(items, width, height);
        }
        commit(next, items);
    }, [autoLayout, commit, gapMm, hAlign, items, marginMm, showToast]);
    const setPage = useCallback((value: PageSizeKey) => {
        setPageSizeKey(value);
        const width = orientation === "portrait"
            ? PAGE_SIZES[value].widthMm
            : PAGE_SIZES[value].heightMm;
        const height = orientation === "portrait"
            ? PAGE_SIZES[value].heightMm
            : PAGE_SIZES[value].widthMm;
        applyPageChange(width, height);
    }, [applyPageChange, orientation]);
    const setPageOrientation = useCallback((value: Orientation) => {
        setOrientation(value);
        const width = value === "portrait"
            ? PAGE_SIZES[pageSizeKey].widthMm
            : PAGE_SIZES[pageSizeKey].heightMm;
        const height = value === "portrait"
            ? PAGE_SIZES[pageSizeKey].heightMm
            : PAGE_SIZES[pageSizeKey].widthMm;
        applyPageChange(width, height);
    }, [applyPageChange, pageSizeKey]);
    const autoArrange = useCallback(() => {
        if (!items.length)
            return;
        const { placed, failed } = reflow(items, hAlign, true);
        if (failed) {
            showToast("Not all photos fit with these settings. Reduce the gap or margin, or use a bigger page.", "Page Full");
            return;
        }
        setAutoLayout(true);
        commit(placed, items);
        setSelectedId(null);
    }, [commit, hAlign, items, reflow, showToast]);
    const applyAlign = useCallback((mode: HAlign) => {
        setHAlign(mode);
        if (!items.length)
            return;
        if (autoLayout) {
            const flowed = reflow(items, mode);
            if (flowed.failed) {
                showToast("Not all photos fit with these settings. Reduce the gap or margin, or use a bigger page.", "Page Full");
                return;
            }
            commit(flowed.placed, items);
            return;
        }
        commit(alignRows(items, pageWidthMm, marginMm, mode), items);
    }, [autoLayout, commit, items, marginMm, pageWidthMm, reflow, showToast]);
    // Changing the gap or margin re-flows an automatic layout live.
    const layoutKey = `${gapMm}|${marginMm}`;
    const lastLayoutKeyRef = useRef(layoutKey);
    useEffect(() => {
        if (lastLayoutKeyRef.current === layoutKey)
            return;
        lastLayoutKeyRef.current = layoutKey;
        if (!printStudioOpen || !autoLayout)
            return;
        const current = itemsRef.current;
        if (!current.length)
            return;
        const flowed = reflow(current);
        if (flowed.failed) {
            showToast("Not all photos fit with this gap or margin. The layout was kept as it is.", "Page Full");
            return;
        }
        setItems(flowed.placed);
    }, [layoutKey, printStudioOpen, autoLayout, reflow, showToast]);

    const beginInteraction = useCallback((event: React.PointerEvent<HTMLElement>, id: string, mode: "drag" | "resize" | "rotate") => {
        if (event.button !== 0)
            return;
        const item = items.find((entry) => entry.id === id);
        if (!item)
            return;
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
        }
        catch { }
    }, [items]);
    const moveInteraction = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const interaction = interactionRef.current;
        if (!interaction || interaction.pointerId !== event.pointerId)
            return;
        const page = pageRef.current;
        if (!page)
            return;
        const rect = page.getBoundingClientRect();
        const pxPerMmX = rect.width / pageWidthMm;
        const pxPerMmY = rect.height / pageHeightMm;
        const dx = (event.clientX - interaction.startX) / Math.max(0.001, pxPerMmX);
        const dy = (event.clientY - interaction.startY) / Math.max(0.001, pxPerMmY);
        const start = interaction.startItem;
        if (interaction.mode === "drag") {
            const nextX = clamp(start.xMm + dx, 0, Math.max(0, pageWidthMm - start.widthMm));
            const nextY = clamp(start.yMm + dy, 0, Math.max(0, pageHeightMm - start.heightMm));
            setItems((current) => current.map((item) => item.id === interaction.id
                ? { ...item, xMm: nextX, yMm: nextY }
                : item));
            return;
        }
        if (interaction.mode === "resize") {
            const nextWidth = clamp(start.widthMm + dx, MIN_ITEM_MM, Math.max(MIN_ITEM_MM, pageWidthMm - start.xMm));
            const ratio = start.heightMm / Math.max(MIN_ITEM_MM, start.widthMm);
            const nextHeight = freeSize
                ? clamp(start.heightMm + dy, MIN_ITEM_MM, Math.max(MIN_ITEM_MM, pageHeightMm - start.yMm))
                : clamp(nextWidth * ratio, MIN_ITEM_MM, Math.max(MIN_ITEM_MM, pageHeightMm - start.yMm));
            setItems((current) => current.map((item) => item.id === interaction.id
                ? { ...item, widthMm: nextWidth, heightMm: nextHeight }
                : item));
            return;
        }
        const centerX = rect.left +
            ((start.xMm + start.widthMm / 2) / pageWidthMm) * rect.width;
        const centerY = rect.top +
            ((start.yMm + start.heightMm / 2) / pageHeightMm) * rect.height;
        const radians = Math.atan2(event.clientY - centerY, event.clientX - centerX);
        const angle = normalizeAngle((radians * 180) / Math.PI + 90);
        setItems((current) => current.map((item) => item.id === interaction.id ? { ...item, rotation: angle } : item));
    }, [freeSize, pageHeightMm, pageWidthMm]);
    const endInteraction = useCallback((event?: React.PointerEvent<HTMLElement>) => {
        const interaction = interactionRef.current;
        if (!interaction)
            return;
        if (event && event.pointerId !== interaction.pointerId)
            return;
        const currentSnapshot = items.map((item) => ({ ...item }));
        const current = currentSnapshot.find((item) => item.id === interaction.id);
        if (current &&
            JSON.stringify(current) !== JSON.stringify(interaction.startItem)) {
            const previousSnapshot = currentSnapshot.map((item) => item.id === interaction.id ? { ...interaction.startItem } : item);
            setHistory((historyItems) => [
                ...historyItems.slice(-(MAX_HISTORY - 1)),
                previousSnapshot,
            ]);
            setFuture([]);
            setAutoLayout(false);
        }
        interactionRef.current = null;
    }, [items]);
    const rotateSelected = useCallback(() => {
        if (!selectedId)
            return;
        const next = items.map((item) => item.id === selectedId
            ? { ...item, rotation: normalizeAngle(item.rotation + 90) }
            : item);
        setAutoLayout(false);
        commit(next, items);
    }, [commit, items, selectedId]);

    const onWorkspacePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const workspace = workspaceRef.current;
        if (!workspace)
            return;
        if (event.pointerType === "touch") {
            setSelectedId(null);
            return;
        }
        if (event.button !== 0 && event.button !== 1)
            return;
        if (event.button === 1)
            event.preventDefault();
        panRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: workspace.scrollLeft,
            scrollTop: workspace.scrollTop,
            moved: false,
        };
        try {
            workspace.setPointerCapture(event.pointerId);
        }
        catch { }
    }, []);
    const onWorkspacePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const pan = panRef.current;
        const workspace = workspaceRef.current;
        if (!pan || !workspace || pan.pointerId !== event.pointerId)
            return;
        const dx = event.clientX - pan.startX;
        const dy = event.clientY - pan.startY;
        if (!pan.moved) {
            if (Math.hypot(dx, dy) < 4)
                return;
            pan.moved = true;
            setIsPanning(true);
        }
        workspace.scrollLeft = pan.scrollLeft - dx;
        workspace.scrollTop = pan.scrollTop - dy;
    }, []);
    const endWorkspacePan = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const pan = panRef.current;
        if (!pan || pan.pointerId !== event.pointerId)
            return;
        if (!pan.moved && event.type === "pointerup")
            setSelectedId(null);
        panRef.current = null;
        setIsPanning(false);
        try {
            workspaceRef.current?.releasePointerCapture(event.pointerId);
        }
        catch { }
    }, []);
    const renderStudioCanvas = useCallback(async () => {
        if (!printStudioImage) {
            throw new Error("No photo is available for printing.");
        }
        const imageCache = new Map<string, HTMLImageElement>();
        const getSourceImage = async (src: string) => {
            const cached = imageCache.get(src);
            if (cached) return cached;
            const loaded = await loadImage(src);
            imageCache.set(src, loaded);
            return loaded;
        };
        const scale = EXPORT_DPI / 25.4;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(pageWidthMm * scale));
        canvas.height = Math.max(1, Math.round(pageHeightMm * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not create print canvas.");
        try {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            const minLine = 1 / scale;
            for (const item of items) {
                const image = await getSourceImage(item.image ?? printStudioImage);
                const width = item.widthMm * scale;
                const height = item.heightMm * scale;
                const x = item.xMm * scale;
                const y = item.yMm * scale;
                ctx.save();
                ctx.translate(x + width / 2, y + height / 2);
                ctx.rotate((normalizeAngle(item.rotation) * Math.PI) / 180);
                drawCover(ctx, image, -width / 2, -height / 2, width, height);
                // Borders are drawn in millimetres so thickness is exact on paper.
                ctx.save();
                ctx.scale(scale, scale);
                ctx.translate(-item.widthMm / 2, -item.heightMm / 2);
                if (imageBorder) {
                    const thickness = Math.max(imageBorderMm, minLine);
                    ctx.setLineDash([]);
                    ctx.strokeStyle = imageBorderColor;
                    ctx.lineWidth = thickness;
                    ctx.strokeRect(thickness / 2, thickness / 2, Math.max(0, item.widthMm - thickness), Math.max(0, item.heightMm - thickness));
                }
                if (cuttingBorder) {
                    const thickness = Math.max(cutMm, minLine);
                    ctx.strokeStyle = CUT_COLOR;
                    ctx.lineWidth = thickness;
                    if (cutStyle === "marks") {
                        ctx.setLineDash([]);
                        cropMarkSegments(item.widthMm, item.heightMm, gapMm).forEach(([x1, y1, x2, y2]) => {
                            ctx.beginPath();
                            ctx.moveTo(x1, y1);
                            ctx.lineTo(x2, y2);
                            ctx.stroke();
                        });
                    }
                    else {
                        ctx.setLineDash(cutStyle === "dashed" ? [1.1, 1.1] : []);
                        ctx.strokeRect(0, 0, item.widthMm, item.heightMm);
                        ctx.setLineDash([]);
                    }
                }
                ctx.restore();
                ctx.restore();
            }
        }
        catch (error) {
            canvas.width = 0;
            canvas.height = 0;
            throw error;
        }
        finally {
            // Release decoded copies; the parent keeps the original source URLs.
            for (const cachedImage of imageCache.values()) {
                cachedImage.onload = null;
                cachedImage.onerror = null;
                cachedImage.src = "";
            }
            imageCache.clear();
        }
        return canvas;
    }, [
        cutMm,
        cutStyle,
        cuttingBorder,
        gapMm,
        imageBorder,
        imageBorderColor,
        imageBorderMm,
        items,
        pageHeightMm,
        pageWidthMm,
        printStudioImage,
    ]);
    const downloadPdf = useCallback(async () => {
        if (!items.length || isExporting)
            return;
        setIsExporting(true);
        let canvas: HTMLCanvasElement | null = null;
        try {
            canvas = await renderStudioCanvas();
            const imageData = canvas.toDataURL("image/jpeg", 0.97);
            const pdf = new jsPDF({
                orientation: pageWidthMm > pageHeightMm ? "landscape" : "portrait",
                unit: "mm",
                format: [pageWidthMm, pageHeightMm],
                compress: true,
            });
            pdf.addImage(imageData, "JPEG", 0, 0, pageWidthMm, pageHeightMm);
            pdf.save(nameForPdf(pageSizeKey));
        }
        catch (error) {
            showToast(error instanceof Error ? error.message : "Could not create PDF.", "Error");
        }
        finally {
            // Drop the high-resolution backing store promptly (A4 at 300 DPI is ~35 MB).
            if (canvas) {
                canvas.width = 0;
                canvas.height = 0;
                canvas = null;
            }
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
        if (!items.length || isExporting)
            return;
        setIsExporting(true);
        let objectUrl: string | null = null;
        let frame: HTMLIFrameElement | null = null;
        let fallbackTimer: number | null = null;
        let canvas: HTMLCanvasElement | null = null;
        let cleanedUp = false;
        const cleanup = () => {
            if (cleanedUp)
                return;
            cleanedUp = true;
            if (fallbackTimer !== null) {
                window.clearTimeout(fallbackTimer);
                fallbackTimer = null;
            }
            window.removeEventListener("pagehide", cleanup);
            window.removeEventListener("beforeunload", cleanup);
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
            if (frame) {
                frame.onload = null;
                frame.onerror = null;
                const printSheet = frame.contentDocument?.getElementById("sheet") as HTMLImageElement | null;
                if (printSheet)
                    printSheet.removeAttribute("src");
                frame.remove();
                frame = null;
            }
            if (printCleanupRef.current === cleanup)
                printCleanupRef.current = null;
        };
        try {
            canvas = await renderStudioCanvas();
            const blob = await new Promise<Blob | null>((resolve) => canvas!.toBlob(resolve, "image/png"));
            // The print iframe only needs the encoded blob; release the large canvas now.
            canvas.width = 0;
            canvas.height = 0;
            canvas = null;
            if (!blob)
                throw new Error("Could not prepare the print file.");
            objectUrl = URL.createObjectURL(blob);
            const iframe = document.createElement("iframe");
            frame = iframe;
            iframe.setAttribute("aria-hidden", "true");
            iframe.tabIndex = -1;
            iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${pageWidthMm}mm;height:${pageHeightMm}mm;border:0;opacity:0;pointer-events:none;`;
            await new Promise<void>((resolve, reject) => {
                iframe.onload = () => resolve();
                iframe.onerror = () => reject(new Error("Could not open print preview."));
                iframe.srcdoc = buildPrintHtml(objectUrl as string, pageWidthMm, pageHeightMm, t("Print Photo Layout"));
                document.body.appendChild(iframe);
            });
            const printWindow = iframe.contentWindow;
            const printDocument = iframe.contentDocument;
            if (!printWindow || !printDocument)
                throw new Error("Could not open print preview.");
            const sheet = printDocument.getElementById("sheet") as HTMLImageElement | null;
            if (sheet && !sheet.complete) {
                await new Promise<void>((resolve, reject) => {
                    sheet.onload = () => resolve();
                    sheet.onerror = () => reject(new Error("Could not load the print image."));
                });
            }
            if (sheet && typeof sheet.decode === "function") {
                try {
                    await sheet.decode();
                }
                catch {
                    if (!sheet.complete || sheet.naturalWidth === 0)
                        throw new Error("Could not decode the print image.");
                }
            }
            if (sheet && (!sheet.complete || sheet.naturalWidth <= 0 || sheet.naturalHeight <= 0))
                throw new Error("The print image could not be loaded at full resolution.");
            // Keep the iframe and its object URL alive until the native print dialog closes.
            printCleanupRef.current = cleanup;
            printWindow.addEventListener("afterprint", () => window.setTimeout(cleanup, 500), { once: true });
            window.addEventListener("pagehide", cleanup, { once: true });
            window.addEventListener("beforeunload", cleanup, { once: true });
            fallbackTimer = window.setTimeout(cleanup, 10 * 60 * 1000);
            printWindow.focus();
            printWindow.print();
        }
        catch (error) {
            cleanup();
            showToast(error instanceof Error && error.message
                ? error.message
                : "Printing failed. Please use Download PDF and print the PDF instead.", "Error");
        }
        finally {
            if (canvas) {
                canvas.width = 0;
                canvas.height = 0;
                canvas = null;
            }
            setIsExporting(false);
        }
    }, [
        isExporting,
        items.length,
        pageHeightMm,
        pageWidthMm,
        renderStudioCanvas,
        showToast,
        t,
    ]);

    if (!mounted || !printStudioOpen || !printStudioImage)
        return null;

    const usedArea = items.reduce((sum, item) => sum + item.widthMm * item.heightMm, 0);
    const pageUsage = Math.min(100, Math.round((usedArea / (pageWidthMm * pageHeightMm)) * 100));
    const sourceRatio = sourcePreset.widthMm / sourcePreset.heightMm;
    const customRatio = customWidthMm / customHeightMm;
    const customWillCrop = Math.abs(sourceRatio / customRatio - 1) > 0.03;
    const unitLabel = unit === "in" ? "inch" : unit;
    const bdPresets = BD_QUICK_IDS
        .map((id) => PRESETS.find((entry) => entry.id === id))
        .filter((entry): entry is Preset => !!entry)
        .map((entry) => ({ ...entry, ...(presetDimensions[entry.id] ?? {}) }));
    const marginGuidePx = marginMm * visualScale;
    const alignBtn = "h-8 rounded-md border text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-colors";
    const alignClass = (mode: HAlign) => `${alignBtn} ${hAlign === mode ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]" : "border-[#E3D6B8] bg-[#FBF6E8] hover:bg-[#F2E8D2] text-[#3B2F1E]"}`;

    const modal = (<div className={inline
            ? "relative w-full h-full min-h-[640px] rounded-2xl border border-[#E3D6B8] shadow-sm bg-[#F2E8D2] text-[#3B2F1E] flex flex-col ai-editor-font overflow-hidden"
            : "fixed inset-0 z-[10000] bg-[#F2E8D2] text-[#3B2F1E] flex flex-col ai-editor-font overflow-hidden"}>
      <header className="h-14 shrink-0 bg-[#FBF6E8] border-b border-[#E3D6B8] flex items-center justify-between px-4 sm:px-5 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#DC2626] text-white flex items-center justify-center shrink-0">
            <ImageIcon size={16}/>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold truncate text-[#3B2F1E]">{t("Print This Image")}</h1>
            <p className="text-[11px] text-[#3B2F1E]/60 truncate">{t("Photo Layout & Print Studio")}</p>
          </div>
        </div>
        <button type="button" onClick={closePrintStudio} className="w-8 h-8 rounded-lg border border-[#E3D6B8] bg-[#F2E8D2] hover:bg-[#E3D6B8] flex items-center justify-center cursor-pointer text-[#3B2F1E] transition-colors" aria-label={t("Close print studio")}>
          <X size={16}/>
        </button>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="w-[340px] shrink-0 bg-[#FBF6E8] border-r border-[#E3D6B8] flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* ───────── Quick Add ───────── */}
            <Section title={t("Quick Add")} icon={<LayoutGrid size={13}/>} open={openSections.quick} onToggle={() => toggleSection("quick")}>
              <div className="flex items-center gap-2 mb-3">
                {isMultiPhotoSession ? (
                  selectedItem?.image ? (
                    <img src={selectedItem.image} alt={t("Selected photo")} className="w-12 h-14 object-cover rounded-md border border-[#E3D6B8] bg-[#F2E8D2]"/>
                  ) : (
                    <div className="w-12 h-14 rounded-md border border-dashed border-[#CDBD9D] bg-[#F2E8D2] text-[#9A8664] flex items-center justify-center" aria-label="No photo selected">
                      <ImageIcon size={18}/>
                    </div>
                  )
                ) : (
                  <img src={printStudioImage} alt={t("Current photo")} className="w-12 h-14 object-cover rounded-md border border-[#E3D6B8] bg-[#F2E8D2]"/>
                )}
                <div className="min-w-0">
                  <p className="text-[12px] font-extrabold text-[#3B2F1E]">{isMultiPhotoSession ? `${sourceImages.length} selected photos` : t("Current photo")}</p>
                  <p className="text-[11px] text-[#3B2F1E]/60 mt-0.5 leading-relaxed">
                    {isMultiPhotoSession
                      ? selectedItem?.image
                        ? `নির্বাচিত ছবি: ${selectedItem.label} · ${roundNice(selectedItem.widthMm)}×${roundNice(selectedItem.heightMm)} mm`
                        : "প্রিভিউ দেখতে পেজের যেকোনো একটি ছবিতে ক্লিক করুন।"
                      : t("Add multiple copies of the current photo in different sizes.")}
                  </p>
                </div>
              </div>

              {isMultiPhotoSession && (
                <div className="mb-3 rounded-lg border border-[#DC2626]/20 bg-white/65 p-2.5">
                  <p className="text-[11px] font-extrabold text-[#3B2F1E]">সব নির্বাচিত ছবির সাইজ একসাথে পরিবর্তন করুন</p>
                  <select value={applyAllSizeId} onChange={(event) => setApplyAllSizeId(event.target.value)} className="mt-2 h-8 w-full min-w-0 rounded-md border border-[#E3D6B8] bg-[#FBF6E8] px-2 text-[11px] font-semibold text-[#3B2F1E] outline-none focus:border-[#DC2626]">
                    <option value="">ছবির সাইজ নির্বাচন করুন</option>
                    {PRESETS.map((entry) => {
                      const dimensions = presetDimensions[entry.id] ?? entry;
                      return <option key={entry.id} value={entry.id}>{t(entry.label)} — {roundNice(dimensions.widthMm)}×{roundNice(dimensions.heightMm)} mm</option>;
                    })}
                    <option value="custom">নিজের মতো মাপ (Custom)</option>
                  </select>

                  {applyAllSizeId === "custom" && (
                    <div className="mt-2.5 rounded-md border border-[#E3D6B8] bg-[#FBF6E8] p-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-extrabold text-[#3B2F1E]">নিজের পছন্দমতো ছবির মাপ দিন</p>
                        <div className="w-[126px] shrink-0">
                          <Segmented<Unit> value={unit} onChange={setUnit} options={[
                            { value: "mm", label: "mm" },
                            { value: "cm", label: "cm" },
                            { value: "in", label: "inch" },
                          ]}/>
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_30px_1fr] items-end gap-1.5">
                        <div className="min-w-0">
                          <p className="mb-1 text-[10px] font-bold text-[#3B2F1E]/65">Width</p>
                          <NumberField ariaLabel={t("Width")} value={formatInUnit(customWidthMm, unit)} min={MIN_ITEM_MM / UNIT_FACTOR[unit]} max={600 / UNIT_FACTOR[unit]} suffix={unitLabel} onCommit={(value) => setCustomWidthMm(clamp(value * UNIT_FACTOR[unit], MIN_ITEM_MM, 600))}/>
                        </div>
                        <button type="button" onClick={() => {
                          setCustomWidthMm(customHeightMm);
                          setCustomHeightMm(customWidthMm);
                        }} className="h-8 rounded-md border border-[#E3D6B8] bg-white hover:bg-[#F2E8D2] flex items-center justify-center cursor-pointer text-[#3B2F1E]" title={t("Swap width and height")} aria-label={t("Swap width and height")}>
                          <ArrowLeftRight size={13}/>
                        </button>
                        <div className="min-w-0">
                          <p className="mb-1 text-[10px] font-bold text-[#3B2F1E]/65">Height</p>
                          <NumberField ariaLabel={t("Height")} value={formatInUnit(customHeightMm, unit)} min={MIN_ITEM_MM / UNIT_FACTOR[unit]} max={600 / UNIT_FACTOR[unit]} suffix={unitLabel} onCommit={(value) => setCustomHeightMm(clamp(value * UNIT_FACTOR[unit], MIN_ITEM_MM, 600))}/>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-[#3B2F1E]/60">মাপ: {roundNice(customWidthMm)} × {roundNice(customHeightMm)} mm · সর্বনিম্ন ৫ mm, সর্বোচ্চ ৬০০ mm</p>
                    </div>
                  )}

                  <button type="button" disabled={!selectedApplyAllPreset || !items.length} onClick={() => selectedApplyAllPreset && applySizeToAllPhotos(selectedApplyAllPreset)} className="mt-2 h-9 w-full rounded-md bg-[#DC2626] px-2.5 text-[11px] font-extrabold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-40">
                    সব ছবিতে প্রয়োগ
                  </button>
                  <p className="mt-1.5 text-[10px] leading-snug text-[#3B2F1E]/60">Passport, E-Passport, Visa/Birth, 2×2 inch অথবা নিজের নির্ধারিত Custom সাইজ সব নির্বাচিত ছবিতে একসাথে প্রয়োগ করুন।</p>
                </div>
              )}

              {isMultiPhotoSession && !selectedItem?.image && (
                <p className="mb-2 rounded-md bg-[#F2E8D2] px-2 py-1.5 text-[10px] leading-snug text-[#7A6544]">একটি ছবির অতিরিক্ত কপি যোগ করতে আগে ক্যানভাসে সেই ছবিটি নির্বাচন করুন।</p>
              )}

              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3B2F1E]/60 mb-1.5">{t("Units")}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 8 }, (_, index) => index + 1).map((quantity) => (<button key={quantity} type="button" onClick={() => addPreset(activePhotoPreset, quantity)} disabled={!hasActivePhotoForQuickAdd} className="h-8 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-extrabold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title={`${t("Add")} ${quantity} × ${t(activePhotoPreset.label)}`}>
                    {quantity}U
                  </button>))}
              </div>
              <button type="button" onClick={() => addPreset(activePhotoPreset, MAX_ITEMS, true)} disabled={!hasActivePhotoForQuickAdd} className="w-full mt-1.5 h-8 rounded-md border border-[#DC2626]/40 bg-[#DC2626]/5 hover:bg-[#DC2626]/10 text-[#DC2626] text-[11px] font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                <Grid3X3 size={12}/>
                {t("Fill page")}
              </button>

              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3B2F1E]/60 mt-4 mb-1.5">{t("Bangladesh Sizes")}</p>
              <div className="space-y-2">
                {bdPresets.map((entry) => (<div key={entry.id} className="rounded-lg border border-[#E3D6B8] bg-white/45 p-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="min-w-0 truncate text-[11px] font-bold text-[#3B2F1E]">{t(entry.label)}</p>
                      <div className="grid shrink-0 grid-cols-3 gap-1">
                        {[1, 4, 8].map((quantity) => (<button key={`${entry.id}-${quantity}`} type="button" onClick={() => addPreset(entry, quantity)} disabled={!hasActivePhotoForQuickAdd} className="h-6 w-8 rounded-md bg-[#3B2F1E] text-[10px] font-extrabold text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40">
                            {quantity}+
                          </button>))}
                      </div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      <label className="flex min-w-0 items-center gap-1 text-[9px] font-bold text-[#3B2F1E]/65">
                        <span>W</span>
                        <PresetDimensionField value={entry.widthMm} ariaLabel={`${entry.label} width`} onCommit={(value) => updatePresetDimension(entry.id, "widthMm", value)}/>
                        <span>mm</span>
                      </label>
                      <label className="flex min-w-0 items-center gap-1 text-[9px] font-bold text-[#3B2F1E]/65">
                        <span>H</span>
                        <PresetDimensionField value={entry.heightMm} ariaLabel={`${entry.label} height`} onCommit={(value) => updatePresetDimension(entry.id, "heightMm", value)}/>
                        <span>mm</span>
                      </label>
                    </div>
                  </div>))}
              </div>

              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3B2F1E]/60 mt-4 mb-1">{t("Ready Sheets")}</p>
              <p className="text-[10px] text-[#3B2F1E]/55 mb-1.5 leading-snug">{t("Replaces the current layout. You can undo it.")}</p>
              <div className="space-y-1.5">
                {COMBOS.map((combo) => (<button key={combo.id} type="button" onClick={() => addCombo(combo)} disabled={!hasActivePhotoForQuickAdd} className="w-full h-8 rounded-md border border-[#E3D6B8] bg-[#F2E8D2] hover:bg-[#E3D6B8] text-[#3B2F1E] text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {t(combo.label)}
                  </button>))}
              </div>

              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3B2F1E]/60 mt-4 mb-1.5">{t("Photo Sizes")}</p>
              <div className="mt-1 space-y-2">
                {PRESETS.filter((item) => ["2R", "3R", "4R", "5R", "6R", "8R", "4B", "5B", "6B", "A4"].includes(item.id)).map((baseEntry) => {
                  const entry = { ...baseEntry, ...(presetDimensions[baseEntry.id] ?? {}) };
                  return <div key={entry.id} className="rounded-lg border border-[#E3D6B8] bg-white/45 p-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#3B2F1E]">{entry.label}</span>
                      <button type="button" onClick={() => addPreset(entry)} disabled={!hasActivePhotoForQuickAdd} className="h-6 min-w-10 rounded-md bg-[#DC2626] px-2 text-[10px] font-extrabold text-white transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-40">+ Add</button>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      <label className="flex min-w-0 items-center gap-1 text-[9px] font-bold text-[#3B2F1E]/65">
                        <span>W</span>
                        <PresetDimensionField value={entry.widthMm} ariaLabel={`${entry.label} width`} onCommit={(value) => updatePresetDimension(entry.id, "widthMm", value)}/>
                        <span>mm</span>
                      </label>
                      <label className="flex min-w-0 items-center gap-1 text-[9px] font-bold text-[#3B2F1E]/65">
                        <span>H</span>
                        <PresetDimensionField value={entry.heightMm} ariaLabel={`${entry.label} height`} onCommit={(value) => updatePresetDimension(entry.id, "heightMm", value)}/>
                        <span>mm</span>
                      </label>
                    </div>
                  </div>;
                })}
              </div>
            </Section>

            {/* ───────── Custom Size ───────── */}
            <Section title={t("Custom Size")} icon={<Ruler size={13}/>} open={openSections.custom} onToggle={() => toggleSection("custom")}>
              <Segmented<Unit> value={unit} onChange={setUnit} options={[
            { value: "mm", label: "mm" },
            { value: "cm", label: "cm" },
            { value: "in", label: "inch" },
        ]}/>
              <div className="grid grid-cols-[1fr_32px_1fr] gap-1.5 items-end mt-2.5">
                <div>
                  <p className="text-[10px] font-bold text-[#3B2F1E]/60 mb-1">{t("Width")}</p>
                  <NumberField ariaLabel={t("Width")} value={formatInUnit(customWidthMm, unit)} min={MIN_ITEM_MM / UNIT_FACTOR[unit]} max={600 / UNIT_FACTOR[unit]} suffix={unitLabel} onCommit={(value) => setCustomWidthMm(clamp(value * UNIT_FACTOR[unit], MIN_ITEM_MM, 600))}/>
                </div>
                <button type="button" onClick={() => {
            setCustomWidthMm(customHeightMm);
            setCustomHeightMm(customWidthMm);
        }} className="h-8 rounded-md border border-[#E3D6B8] bg-[#F2E8D2] hover:bg-[#E3D6B8] flex items-center justify-center cursor-pointer text-[#3B2F1E]" title={t("Swap width and height")}>
                  <ArrowLeftRight size={13}/>
                </button>
                <div>
                  <p className="text-[10px] font-bold text-[#3B2F1E]/60 mb-1">{t("Height")}</p>
                  <NumberField ariaLabel={t("Height")} value={formatInUnit(customHeightMm, unit)} min={MIN_ITEM_MM / UNIT_FACTOR[unit]} max={600 / UNIT_FACTOR[unit]} suffix={unitLabel} onCommit={(value) => setCustomHeightMm(clamp(value * UNIT_FACTOR[unit], MIN_ITEM_MM, 600))}/>
                </div>
              </div>
              <p className="text-[10px] text-[#3B2F1E]/55 mt-1.5">
                = {roundNice(customWidthMm)} × {roundNice(customHeightMm)} mm
              </p>
              {customWillCrop && (<p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mt-2 leading-snug">
                  {t("This ratio is different from your photo, so the photo will be center-cropped to fit.")}
                </p>)}
              <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                {[1, 4, 8].map((quantity) => (<button key={quantity} type="button" onClick={() => addCustom(quantity)} disabled={!hasActivePhotoForQuickAdd} className="h-8 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-extrabold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    +{quantity}
                  </button>))}
                <button type="button" onClick={() => addCustom(MAX_ITEMS, true)} disabled={!hasActivePhotoForQuickAdd} className="h-8 rounded-md border border-[#DC2626]/40 bg-[#DC2626]/5 hover:bg-[#DC2626]/10 text-[#DC2626] text-[11px] font-extrabold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {t("Fill")}
                </button>
              </div>

              <div className="mt-3">
                <Toggle checked={freeSize} onChange={setFreeSize} label={t("Free Size")} hint={t("Resize with the corner handle without keeping the ratio.")}/>
              </div>

              <div className="mt-3 rounded-lg border border-[#E3D6B8] bg-[#F2E8D2]/60 p-2.5">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3B2F1E]/60 mb-2">{t("Selected photo")}</p>
                {selectedItem ? (<>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <p className="text-[10px] font-bold text-[#3B2F1E]/60 mb-1">{t("Width")}</p>
                        <NumberField ariaLabel={t("Width")} value={formatInUnit(selectedItem.widthMm, unit)} min={MIN_ITEM_MM / UNIT_FACTOR[unit]} max={pageWidthMm / UNIT_FACTOR[unit]} suffix={unitLabel} onCommit={(value) => updateSelectedSize("widthMm", value * UNIT_FACTOR[unit])}/>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3B2F1E]/60 mb-1">{t("Height")}</p>
                        <NumberField ariaLabel={t("Height")} value={formatInUnit(selectedItem.heightMm, unit)} min={MIN_ITEM_MM / UNIT_FACTOR[unit]} max={pageHeightMm / UNIT_FACTOR[unit]} suffix={unitLabel} onCommit={(value) => updateSelectedSize("heightMm", value * UNIT_FACTOR[unit])}/>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button type="button" onClick={duplicateSelected} className="h-8 rounded-md border border-[#E3D6B8] bg-[#FBF6E8] hover:bg-white text-[#3B2F1E] text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1">
                        <Copy size={11}/>
                        {t("Duplicate")}
                      </button>
                      <button type="button" onClick={applySizeToAll} className="h-8 rounded-md border border-[#E3D6B8] bg-[#FBF6E8] hover:bg-white text-[#3B2F1E] text-[11px] font-bold cursor-pointer">
                        {t("Apply size to all")}
                      </button>
                    </div>
                  </>) : (<p className="text-[10px] text-[#3B2F1E]/55 leading-snug">
                    {t("Click a photo on the page to set its exact size.")}
                  </p>)}
              </div>
            </Section>

            {/* ───────── Borders & Cutting ───────── */}
            <Section title={t("Borders & Cutting")} icon={<Frame size={13}/>} open={openSections.border} onToggle={() => toggleSection("border")}>
              <Toggle checked={imageBorder} onChange={setImageBorder} label={t("Image Border")} hint={t("A border drawn inside the photo edge.")}/>
              {imageBorder && (<div className="mt-2.5 space-y-2.5 pl-1">
                  <RangeField label={t("Border thickness")} valueLabel={`${imageBorderMm.toFixed(2)} mm`} value={imageBorderMm} min={0.1} max={3} step={0.05} onChange={setImageBorderMm}/>
                  <div>
                    <p className="text-[11px] font-bold text-[#3B2F1E]/70 mb-1.5">{t("Border color")}</p>
                    <ColorField value={imageBorderColor} onChange={setImageBorderColor}/>
                  </div>
                </div>)}

              <div className="mt-3">
                <Toggle checked={cuttingBorder} onChange={setCuttingBorder} label={t("Cutting Border")} hint={t("Guide lines to help you cut the photos.")}/>
              </div>
              {cuttingBorder && (<div className="mt-2.5 space-y-2.5 pl-1">
                  <Segmented<CutStyle> value={cutStyle} onChange={setCutStyle} options={[
                { value: "dashed", label: t("Dashed") },
                { value: "solid", label: t("Solid") },
                { value: "marks", label: t("Corner marks") },
            ]}/>
                  <RangeField label={t("Line thickness")} valueLabel={`${cutMm.toFixed(2)} mm`} value={cutMm} min={0.1} max={1} step={0.05} onChange={setCutMm}/>
                  {cutStyle === "marks" && (<p className="text-[10px] text-[#3B2F1E]/55 leading-snug">
                      {t("Corner marks are drawn in the gap between photos. Keep the gap at 2 mm or more.")}
                    </p>)}
                </div>)}
            </Section>

            {/* ───────── Page & Layout ───────── */}
            <Section title={t("Page & Layout")} icon={<Printer size={13}/>} open={openSections.page} onToggle={() => toggleSection("page")}>
              <select value={pageSizeKey} onChange={(event) => setPage(event.target.value as PageSizeKey)} className="w-full h-8 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] px-2 text-[11px] font-semibold cursor-pointer">
                {Object.entries(PAGE_SIZES).map(([key, page]) => (<option key={key} value={key}>
                    {page.label}
                  </option>))}
              </select>

              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <button type="button" onClick={() => setPageOrientation("portrait")} className={`h-8 rounded-md text-[11px] font-extrabold cursor-pointer transition-colors ${orientation === "portrait" ? "bg-[#DC2626] text-white" : "bg-[#E3D6B8] text-[#3B2F1E] hover:bg-[#d8c9a4]"}`}>{t("Portrait")}</button>
                <button type="button" onClick={() => setPageOrientation("landscape")} className={`h-8 rounded-md text-[11px] font-extrabold cursor-pointer transition-colors ${orientation === "landscape" ? "bg-[#DC2626] text-white" : "bg-[#E3D6B8] text-[#3B2F1E] hover:bg-[#d8c9a4]"}`}>{t("Landscape")}</button>
              </div>

              <div className="mt-3 space-y-2.5">
                <RangeField label={t("Image Gap (mm):")} valueLabel={`${gapMm}`} value={gapMm} min={0} max={10} step={0.5} onChange={setGapMm}/>
                <RangeField label={t("Page margin (mm):")} valueLabel={`${marginMm}`} value={marginMm} min={0} max={15} step={0.5} onChange={setMarginMm}/>
                <p className="text-[10px] text-[#3B2F1E]/55 leading-snug -mt-1">
                  {t("Most home and shop printers cannot print right to the paper edge. A 3–5 mm margin is safe.")}
                </p>
                {!autoLayout && items.length > 0 && (<p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 leading-snug">
                    {t("You moved photos by hand. Press Auto to apply the new gap and margin.")}
                  </p>)}
              </div>

              <div className="grid grid-cols-4 gap-1.5 mt-3">
                <button type="button" onClick={() => applyAlign("left")} className={alignClass("left")} title={t("Align left")}>
                  <AlignLeft size={11}/>
                  {t("Left")}
                </button>
                <button type="button" onClick={() => applyAlign("center")} className={alignClass("center")} title={t("Align center")}>
                  <AlignCenterHorizontal size={11}/>
                  {t("Center")}
                </button>
                <button type="button" onClick={() => applyAlign("right")} className={alignClass("right")} title={t("Align right")}>
                  <AlignRight size={11}/>
                  {t("Right")}
                </button>
                <button type="button" onClick={autoArrange} className="h-8 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-colors" title={t("Arrange photos neatly")}>
                  <Grid3X3 size={11}/>
                  {t("Auto")}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <button type="button" onClick={undo} disabled={!history.length} className="h-8 rounded-md border border-[#E3D6B8] text-[#3B2F1E] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <Undo2 size={11}/>
                  {t("Undo")}
                </button>
                <button type="button" onClick={redo} disabled={!future.length} className="h-8 rounded-md border border-[#E3D6B8] text-[#3B2F1E] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <Redo2 size={11}/>
                  {t("Redo")}
                </button>
              </div>
            </Section>
          </div>

          {/* ───────── Always-visible action bar ───────── */}
          <div className="shrink-0 p-3 border-t border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_-6px_16px_rgba(59,47,30,0.06)]">
            <div className="rounded-lg border border-[#E3D6B8] bg-[#F2E8D2] px-3 py-2 mb-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase font-bold text-[#3B2F1E]/50">{t("Total")}</p>
                <p className="text-[11px] font-bold text-[#3B2F1E]/60">
                  {pageUsage}% {t("page used")}
                </p>
              </div>
              <p className="text-[13px] font-extrabold text-[#3B2F1E] mt-0.5">
                {items.length} {items.length === 1 ? t("photo") : t("photos")}
              </p>
              <div className="h-1 rounded-full bg-[#3B2F1E]/10 mt-1.5 overflow-hidden">
                <div className="h-full bg-[#10B981] transition-all" style={{ width: `${pageUsage}%` }}/>
              </div>
            </div>
            <div className="grid grid-cols-[42px_1fr] gap-2">
              <button type="button" onClick={() => commit([], items)} disabled={!items.length} className="h-10 rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40" title={t("Remove all")}>
                <Trash2 size={15}/>
              </button>
              <button type="button" onClick={downloadPdf} disabled={!items.length || isExporting} className="h-10 rounded-lg bg-[#E3D6B8] hover:bg-[#d8c9a4] text-[#3B2F1E] text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors">
                <Download size={13}/>
                {isExporting ? t("Preparing…") : t("Download PDF")}
              </button>
            </div>
            <button type="button" onClick={printLayout} disabled={!items.length || isExporting} className="w-full mt-2 h-11 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors">
              <Printer size={15}/>
              {t("Print")}
            </button>
            <p className="mt-2 text-[10px] leading-snug text-[#3B2F1E]/60">
              {t("Print tip: select the same paper size, set Margins to None, Scale to 100%, and turn off Headers and footers.")}{" "}
              <span className="font-bold text-[#3B2F1E]/80">
                {t("Paper size")}: {pageWidthMm} × {pageHeightMm} mm
              </span>
            </p>
            {onPrintSingle && (<button type="button" onClick={() => { void onPrintSingle(); }} disabled={isExporting} className="w-full mt-2 h-9 rounded-lg bg-[#E3D6B8] hover:bg-[#d8c9a4] text-[#3B2F1E] text-[13px] font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors">
                <ImageIcon size={13}/>
                {t("Print single photo")}
              </button>)}
          </div>
        </aside>

        <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#F2E8D2]">
          <div className="h-11 shrink-0 bg-white/80 border-b border-[#E3D6B8] px-4 flex items-center justify-between">
            <div className="text-[11px] font-bold text-[#3B2F1E]/70">
              {items.length} {t("items")} • {pageWidthMm.toFixed(1)}×{pageHeightMm.toFixed(1)} mm
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setZoomCentered(zoom - ZOOM_STEP)} className="w-7 h-7 rounded-md bg-[#FBF6E8] border border-[#E3D6B8] text-[#3B2F1E] flex items-center justify-center cursor-pointer hover:bg-[#F2E8D2]">
                <Minus size={12}/>
              </button>
              <span className="w-12 text-center text-[11px] font-extrabold text-[#3B2F1E]">{zoom}%</span>
              <button type="button" onClick={() => setZoomCentered(zoom + ZOOM_STEP)} className="w-7 h-7 rounded-md bg-[#FBF6E8] border border-[#E3D6B8] text-[#3B2F1E] flex items-center justify-center cursor-pointer hover:bg-[#F2E8D2]">
                <Plus size={12}/>
              </button>
              {ZOOM_PRESETS.map((value) => (<button key={value} type="button" onClick={() => setZoomCentered(value)} className="w-8 h-7 rounded-md bg-[#FBF6E8] border border-[#E3D6B8] text-[#3B2F1E] text-[11px] font-extrabold cursor-pointer hover:bg-[#F2E8D2]">
                  {value}
                </button>))}
            </div>
          </div>

          <div ref={workspaceRef} className={`relative flex-1 min-h-0 overflow-auto select-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`} onPointerDown={onWorkspacePointerDown} onPointerMove={onWorkspacePointerMove} onPointerUp={endWorkspacePan} onPointerCancel={endWorkspacePan}>
            <div className="flex min-h-full min-w-full w-max p-5 sm:p-6">
            <div ref={pageRef} className="relative m-auto shrink-0 bg-[#FBF6E8] border border-[#E3D6B8] shadow-[0_18px_48px_rgba(15,23,42,0.12)]" style={{
            width: `${pageWidthMm * visualScale}px`,
            height: `${pageHeightMm * visualScale}px`,
        }}>
              {marginMm > 0 && (<div className="absolute pointer-events-none border border-dashed border-[#DC2626]/25" style={{
                left: `${marginGuidePx}px`,
                top: `${marginGuidePx}px`,
                right: `${marginGuidePx}px`,
                bottom: `${marginGuidePx}px`,
            }}/>)}
              {items.map((item) => {
            const selected = item.id === selectedId;
            const left = (item.xMm / pageWidthMm) * 100;
            const top = (item.yMm / pageHeightMm) * 100;
            const width = (item.widthMm / pageWidthMm) * 100;
            const height = (item.heightMm / pageHeightMm) * 100;
            return (<div key={item.id} className="absolute cursor-move" style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    transform: `rotate(${item.rotation}deg)`,
                    transformOrigin: "center center",
                    zIndex: selected ? 50 : 10,
                    touchAction: "none",
                }} onPointerDown={(event) => beginInteraction(event, item.id, "drag")} onPointerMove={moveInteraction} onPointerUp={endInteraction} onPointerCancel={endInteraction}>
                    <div className={`relative w-full h-full bg-[#FBF6E8] overflow-visible ${selected ? "ring-2 ring-[#DC2626] ring-offset-1" : ""}`}>
                      <img src={item.image ?? printStudioImage} alt={t(item.label)} draggable={false} className="block w-full h-full object-cover pointer-events-none select-none"/>
                      <ItemOverlay widthMm={item.widthMm} heightMm={item.heightMm} gapMm={gapMm} imageBorder={imageBorder} imageBorderMm={imageBorderMm} imageBorderColor={imageBorderColor} cuttingBorder={cuttingBorder} cutStyle={cutStyle} cutMm={cutMm}/>

                      {selected && (<>
                          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => {
                        event.stopPropagation();
                        removeItem(item.id);
                    }} className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white border-2 border-white shadow-md flex items-center justify-center cursor-pointer" title={t("Remove")}>
                            <X size={10}/>
                          </button>

                          <button type="button" onPointerDown={(event) => beginInteraction(event, item.id, "rotate")} className="absolute left-1/2 -top-7 -translate-x-1/2 w-6 h-6 rounded-full bg-[#DC2626] text-white border-2 border-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing" title={t("Rotate")}>
                            <RotateCw size={10}/>
                          </button>

                          <button type="button" onPointerDown={(event) => beginInteraction(event, item.id, "resize")} className="absolute -right-3 -bottom-3 w-6 h-6 rounded-full bg-[#DC2626] text-white border-2 border-white shadow-md flex items-center justify-center cursor-nwse-resize" title={t("Resize")}>
                            <Move size={10} className="rotate-45"/>
                          </button>

                          <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-1 rounded-md bg-[#3B2F1E]/90 text-white px-1.5 py-1 text-[11px] font-bold whitespace-nowrap pointer-events-none">
                            {t(item.label)} · {item.widthMm.toFixed(1)}×{item.heightMm.toFixed(1)} mm
                          </div>
                        </>)}
                    </div>
                  </div>);
        })}

              {!items.length && (<div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#E3D6B8] flex items-center justify-center mx-auto mb-2 text-[#3B2F1E]/40">
                      <Grid3X3 size={19}/>
                    </div>
                    <p className="text-sm font-extrabold text-[#3B2F1E]/60">{t("Your print page is empty")}</p>
                    <p className="text-[11px] text-[#3B2F1E]/40 mt-1">{t("Use Quick Add to place photos.")}</p>
                  </div>
                </div>)}
            </div>
            </div>
          </div>

          <div className="h-9 shrink-0 bg-white/80 border-t border-[#E3D6B8] px-4 flex items-center justify-center gap-2 text-[11px] text-[#3B2F1E]/60">
            <Move size={11}/>
            {t("Drag")}
            <span>•</span>
            <RotateCw size={10}/>
            {t("Rotate")}
            <span>•</span>
            <Move size={10} className="rotate-45"/>
            {t("Resize")}
            <span>•</span>
            <span>{t("Drag empty space to move around · Ctrl+scroll to zoom · Arrow keys: nudge · Delete: remove")}</span>
            {selectedItem && (<>
                <span>•</span>
                <span>{t(selectedItem.label)}</span>
              </>)}
          </div>
        </main>

        {toast && (<div className="fixed right-5 top-[74px] z-[10030] w-[300px] rounded-xl border border-[#10B981]/30 bg-[#FBF6E8] shadow-xl p-3">
            <p className="text-[12px] font-extrabold text-[#3B2F1E]">{t(toast.title)}</p>
            <p className="text-[11px] text-[#3B2F1E]/70 mt-0.5 leading-relaxed">{t(toast.message)}</p>
          </div>)}
      </div>

      <footer className="h-8 shrink-0 bg-[#FBF6E8] border-t border-[#E3D6B8] px-4 flex items-center justify-between text-[11px] text-[#3B2F1E]/50">
        <span>{t("Photo Layout & Print Studio")}</span>
        <button type="button" onClick={rotateSelected} disabled={!selectedId} className="flex items-center gap-1 hover:text-[#3B2F1E] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          <RotateCw size={10}/>
          {t("Rotate selected 90°")}
        </button>
      </footer>
    </div>);
    return inline ? modal : createPortal(modal, document.body);
}
