"use client";

import { T } from "@/components/i18n/I18nProvider";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import { getClientSession } from "@/lib/clientAuth";
import { notifyMyFilesSaved } from "@/app/_lib/myFilesNotice";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileImage,
  FileText,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Redo2,
  Save,
  SlidersHorizontal,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type MouseEvent, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { PRINT_MEDIA_TEMPLATES, type PrintMediaTemplate } from "./templateCatalog";

type Manifest = {
  id: string;
  title: string;
  category: string;
  aspectRatio: string;
  physicalWidth: number;
  physicalHeight: number;
  unit: string;
  physicalSizeLabel?: string;
  viewBox: string;
  editableObjects?: Array<Record<string, unknown>>;
  printSettings?: { bleedMm?: number; safeMarginMm?: number; [key: string]: unknown };
};

function getCanvasDimensions(value: Manifest | null) {
  if (!value) return { width: 210, height: 297 };
  const viewBoxValues = value.viewBox.trim().split(/[\s,]+/).map(Number);
  const width = Number.isFinite(viewBoxValues[2]) && viewBoxValues[2] > 0 ? viewBoxValues[2] : value.physicalWidth;
  const height = Number.isFinite(viewBoxValues[3]) && viewBoxValues[3] > 0 ? viewBoxValues[3] : value.physicalHeight;
  return { width, height };
}

function toMillimeters(value: number, unit: string | undefined): number {
  const normalizedUnit = (unit || "mm").toLowerCase();
  if (["mm", "millimeter", "millimeters"].includes(normalizedUnit)) return value;
  if (["cm", "centimeter", "centimeters"].includes(normalizedUnit)) return value * 10;
  if (["in", "inch", "inches"].includes(normalizedUnit)) return value * 25.4;
  if (["ft", "foot", "feet"].includes(normalizedUnit)) return value * 304.8;
  if (normalizedUnit === "px") return value * 25.4 / 96;
  return value;
}

function calculateFitZoom(value: Manifest | null): number {
  if (!value || typeof window === "undefined") return 100;
  const dimensions = getCanvasDimensions(value);
  const baseWidth = 760;
  const portraitHeightAtFull = baseWidth * (dimensions.height / dimensions.width);
  const isWideViewport = window.innerWidth >= 1280;
  const availableWidth = Math.max(320, Math.min(baseWidth, window.innerWidth - (isWideViewport ? 660 : 40)));
  const availableHeight = Math.max(420, window.innerHeight - 350);
  const widthScale = (availableWidth / baseWidth) * 100;
  const heightScale = (availableHeight / portraitHeightAtFull) * 100;
  return Math.max(35, Math.min(100, Math.floor(Math.min(widthScale, heightScale))));
}

type LayerInfo = {
  id: string;
  name: string;
  tag: string;
  text: string;
  fill: string;
  stroke: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  x: string;
  y: string;
  width: string;
  height: string;
  editable: boolean;
  objectType: string;
  cx: string;
  cy: string;
  radius: string;
  rx: string;
  opacity: string;
  strokeWidth: string;
};

const STORAGE_PREFIX = "sebalagbe-print-media-design-v1-";
const SVG_NS = "http://www.w3.org/2000/svg";
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const BENGALI_RE = /[\u0980-\u09FF]/;
const BENGALI_FONT_RE = /bengali|bangla|siliguri|baloo|tiro|nirmala|kalpurush|solaiman|lohit/i;
const BENGALI_FALLBACK_FONTS = '"Hind Siliguri", "Noto Sans Bengali", "Nirmala UI", sans-serif';

// Bangla keyboards (Avro, Bijoy, phonetic IME, mobile keyboards) can produce visually identical
// text from different Unicode sequences. Canonical NFC + removing stray control characters keeps
// conjuncts, vowel signs (ো, ৌ) and nukta letters (ড়, ঢ়, য়) shaping identically everywhere.
function cleanBanglaText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFEFF\u200E\u200F\u202A-\u202E]/g, "")
    .normalize("NFC");
}

function readTextValue(element: Element): string {
  const lines = Array.from(element.children).filter((child) => child.localName === "tspan" && child.getAttribute("data-line") === "true");
  if (lines.length > 0) return lines.map((line) => line.textContent || "").join("\n");
  return element.textContent || "";
}

function roundMm(value: number): number {
  return Math.round(value * 100) / 100;
}

const NON_RENDER_TAGS = new Set(["defs", "clippath", "mask", "pattern", "marker", "symbol", "lineargradient", "radialgradient", "filter", "style", "title", "desc", "metadata", "script", "stop"]);
const SHAPE_TAGS = new Set(["text", "rect", "circle", "ellipse", "path", "line", "polygon", "polyline", "image", "use"]);

function isInsideNonRender(element: Element, root: Element): boolean {
  let node: Element | null = element.parentElement;
  while (node && node !== root) {
    if (NON_RENDER_TAGS.has(node.localName.toLowerCase())) return true;
    node = node.parentElement;
  }
  return false;
}

// Every drawable element of every template becomes selectable/movable/recolourable,
// not just the ones the template author tagged as editable.
function makeAllEditable(markup: string): string {
  const doc = parseSvg(markup);
  const root = doc.documentElement;
  const all = Array.from(root.querySelectorAll("*"));
  const eligible = (element: Element) => {
    const tag = element.localName.toLowerCase();
    if (element.getAttribute("data-editable") === "false") return false;
    if (element.getAttribute("data-editable") !== "true" && !SHAPE_TAGS.has(tag)) return false;
    if (isInsideNonRender(element, root)) return false;
    if (element.getAttribute("data-print") === "false" || element.closest('[data-print="false"]')) return false;
    const id = element.getAttribute("id") || "";
    if (id === "safe-area-guide" || id === "print_guides" || element.closest("#safe-area-guide, #print_guides")) return false;
    return true;
  };
  const targets = all.filter(eligible);
  const claimed = new Set<string>();
  all.forEach((element) => {
    const id = element.getAttribute("id");
    if (id && !targets.includes(element)) claimed.add(id);
  });
  let counter = 0;
  let layerNo = 0;
  targets.forEach((element) => {
    const tag = element.localName.toLowerCase();
    let id = element.getAttribute("id") || "";
    if (!id || claimed.has(id)) {
      do {
        counter += 1;
        id = `pm-auto-${counter}`;
      } while (claimed.has(id) || all.some((other) => other.getAttribute("id") === id));
      element.setAttribute("id", id);
    }
    claimed.add(id);
    element.setAttribute("data-editable", "true");
    if (!element.getAttribute("data-layer-name")) {
      layerNo += 1;
      const label = tag === "text" ? (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24) : "";
      element.setAttribute("data-layer-name", label || `${tag.charAt(0).toUpperCase()}${tag.slice(1)} ${layerNo}`);
    }
  });
  return serializeSvg(doc);
}

function getMove(element: Element): { dx: number; dy: number } {
  return { dx: parseFloat(element.getAttribute("data-dx") || "0") || 0, dy: parseFloat(element.getAttribute("data-dy") || "0") || 0 };
}

// Moving = a translate() placed in front of the element's original transform, so it works
// for paths, groups, text, images and shapes alike.
function setMove(element: Element, dx: number, dy: number) {
  if (!element.hasAttribute("data-orig-transform")) element.setAttribute("data-orig-transform", element.getAttribute("transform") || "");
  const original = element.getAttribute("data-orig-transform") || "";
  const r = (n: number) => Math.round(n * 100) / 100;
  element.setAttribute("data-dx", String(r(dx)));
  element.setAttribute("data-dy", String(r(dy)));
  const next = r(dx) === 0 && r(dy) === 0 ? original : `translate(${r(dx)} ${r(dy)}) ${original}`.trim();
  if (next) element.setAttribute("transform", next);
  else element.removeAttribute("transform");
}

function getPaint(element: Element, name: string): string {
  return ((element as SVGElement).style?.getPropertyValue(name) || "").trim() || element.getAttribute(name) || "";
}

function setPaintOn(element: Element, name: string, value: string) {
  element.setAttribute(name, value);
  (element as SVGElement).style?.setProperty(name, value);
}

function applyPaint(element: Element, name: string, value: string) {
  setPaintOn(element, name, value);
  if (name === "opacity") return;
  element.querySelectorAll("*").forEach((child) => {
    if (NON_RENDER_TAGS.has(child.localName.toLowerCase())) return;
    const current = getPaint(child, name);
    if (!current || current === "none") return;
    setPaintOn(child, name, value);
  });
}

function colorToHex(value: string): string | null {
  const v = (value || "").trim();
  if (!v || ["none", "transparent", "inherit", "currentcolor"].includes(v.toLowerCase()) || v.startsWith("url(")) return null;
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v.slice(1).split("").map((c) => c + c).join("")}`.toLowerCase();
  const toHex = (text: string) => {
    const m = text.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    return m ? `#${[m[1], m[2], m[3]].map((n) => Math.min(255, Number(n)).toString(16).padStart(2, "0")).join("")}` : null;
  };
  const direct = toHex(v);
  if (direct) return direct;
  if (typeof document === "undefined") return null;
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return null;
  context.fillStyle = "#010203";
  context.fillStyle = v;
  const out = String(context.fillStyle);
  if (out === "#010203") return null;
  return /^#[0-9a-f]{6}$/i.test(out) ? out : toHex(out);
}

// Number box that lets the person type freely (e.g. "-", "12.") and only commits valid numbers.
function NumberField({ value, onCommit, className }: { value: string; onCommit: (value: string) => void; className?: string }) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      className={className}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;
        setDraft(next);
        if (next.trim() !== "" && Number.isFinite(Number(next))) onCommit(next);
      }}
    />
  );
}

function parseSvg(markup: string): Document {
  if (typeof DOMParser === "undefined") throw new Error("SVG editing is only available in the browser.");
  const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
  if (doc.querySelector("parsererror") || doc.documentElement.localName !== "svg") {
    throw new Error("The template SVG could not be read.");
  }
  return doc;
}

function serializeSvg(doc: Document): string {
  return new XMLSerializer().serializeToString(doc.documentElement);
}

function findSvgElement(doc: Document, id: string): Element | null {
  return Array.from(doc.documentElement.querySelectorAll("[id]")).find((element) => element.getAttribute("id") === id) ?? null;
}

function sanitizeSvg(markup: string): string {
  const doc = parseSvg(markup);
  doc.querySelectorAll("script, foreignObject, iframe, object, embed").forEach((node) => node.remove());
  Array.from(doc.documentElement.querySelectorAll("*")).forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on")) element.removeAttribute(attribute.name);
      if ((name === "href" || name.endsWith(":href")) && value && !value.startsWith("data:image/") && !value.startsWith("#")) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return serializeSvg(doc);
}

function applyTypographyDefaults(markup: string): string {
  const doc = parseSvg(markup);
  const root = doc.documentElement;
  root.setAttribute("font-family", '\"Hind Siliguri\", \"Noto Sans Bengali\", \"Nirmala UI\", sans-serif');
  root.setAttribute("text-rendering", "optimizeLegibility");
  root.setAttribute("font-kerning", "normal");
  root.setAttribute("lang", "bn");
  root.setAttributeNS(XML_NS, "xml:lang", "bn");

  const legacyDefaults = new Set([
    "Noto Sans Bengali, Hind Siliguri, sans-serif",
    "Noto Sans Bengali,Hind Siliguri,sans-serif",
    "'Noto Sans Bengali','Hind Siliguri','Noto Sans',sans-serif",
  ]);

  doc.querySelectorAll("text").forEach((element) => {
    const currentFamily = element.getAttribute("font-family")?.trim() || "";
    if (currentFamily && !legacyDefaults.has(currentFamily)) return;

    const content = element.textContent || "";
    if (!content.trim()) return;
    const hasBengali = /[\u0980-\u09FF]/.test(content);
    const weight = element.getAttribute("font-weight") || "400";
    const isBold = Number(weight) >= 700 || ["bold", "bolder"].includes(weight.toLowerCase());

    const family = hasBengali
      ? isBold
        ? '\"Anek Bangla\", \"Hind Siliguri\", \"Noto Sans Bengali\", sans-serif'
        : '\"Hind Siliguri\", \"Noto Sans Bengali\", \"Nirmala UI\", sans-serif'
      : '\"Plus Jakarta Sans\", \"Inter\", Arial, sans-serif';
    element.setAttribute("font-family", family);
  });

  return serializeSvg(doc);
}

function readLayers(markup: string): LayerInfo[] {
  if (!markup || typeof DOMParser === "undefined") return [];
  try {
    const doc = parseSvg(markup);
    return Array.from(doc.documentElement.querySelectorAll('[data-editable="true"]')).map((element, index) => {
      const tag = element.localName.toLowerCase();
      return {
        id: element.getAttribute("id") || `layer-${index + 1}`,
        name: element.getAttribute("data-layer-name") || element.getAttribute("id") || `Layer ${index + 1}`,
        tag,
        text: tag === "text" || tag === "tspan" ? readTextValue(element) : "",
        fill: getPaint(element, "fill"),
        stroke: getPaint(element, "stroke"),
        fontSize: element.getAttribute("font-size") || "",
        fontFamily: element.getAttribute("font-family") || "",
        fontWeight: element.getAttribute("font-weight") || "",
        x: (() => {
          const native = element.getAttribute("x") || element.getAttribute("cx") || element.getAttribute("x1") || "";
          const { dx } = getMove(element);
          if (!native) return String(dx);
          return Number.isFinite(Number(native)) ? String(Math.round((Number(native) + dx) * 100) / 100) : native;
        })(),
        y: (() => {
          const native = element.getAttribute("y") || element.getAttribute("cy") || element.getAttribute("y1") || "";
          const { dy } = getMove(element);
          if (!native) return String(dy);
          return Number.isFinite(Number(native)) ? String(Math.round((Number(native) + dy) * 100) / 100) : native;
        })(),
        width: element.getAttribute("width") || "",
        height: element.getAttribute("height") || "",
        editable: element.getAttribute("data-editable") === "true",
        objectType: element.getAttribute("data-object-type") || "shape",
        cx: element.getAttribute("cx") || "",
        cy: element.getAttribute("cy") || "",
        radius: element.getAttribute("r") || "",
        rx: element.getAttribute("rx") || "",
        opacity: getPaint(element, "opacity") || "1",
        strokeWidth: getPaint(element, "stroke-width"),
      };
    });
  } catch {
    return [];
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "") || "print-media-design";
}

export default function PrintMediaEditor({ templateId }: { templateId: number }) {
  const router = useRouter();
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [template, setTemplate] = useState<PrintMediaTemplate | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [svgMarkup, setSvgMarkup] = useState("");
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  // The "My Files" entry of this design (set after the first cloud save / when opened from My Files),
  // so every next Save updates the same file instead of creating duplicates.
  const cloudFileIdRef = useRef("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showLayers, setShowLayers] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [textDraft, setTextDraft] = useState("");
  const composingRef = useRef(false);
  const printingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const nudgeRef = useRef<(dx: number, dy: number) => void>(() => {});
  const printDesignRef = useRef<() => Promise<void>>(async () => {});

  const templateFromCatalog = useMemo(
    () => PRINT_MEDIA_TEMPLATES.find((item) => item.id === templateId) ?? null,
    [templateId],
  );

  useEffect(() => {
    let mounted = true;
    void getClientSession().then((session) => {
      if (mounted && !session.authenticated) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/print-media/editor/${templateId}`)}`);
      }
    });
    return () => {
      mounted = false;
    };
  }, [router, templateId]);

  useEffect(() => {
    let active = true;
    async function loadTemplate() {
      setLoading(true);
      setError("");
      if (!templateFromCatalog) {
        setError("Template not found.");
        setLoading(false);
        return;
      }
      try {
        const [svgResponse, jsonResponse] = await Promise.all([
          fetch(templateFromCatalog.svgUrl),
          fetch(templateFromCatalog.jsonUrl),
        ]);
        if (!svgResponse.ok) throw new Error(`SVG file could not be loaded (${svgResponse.status}).`);
        if (!jsonResponse.ok) throw new Error(`Template information could not be loaded (${jsonResponse.status}).`);
        const [rawSvg, rawManifest] = await Promise.all([svgResponse.text(), jsonResponse.json() as Promise<Manifest>]);
        if (!active) return;
        const cleanSvg = makeAllEditable(applyTypographyDefaults(sanitizeSvg(rawSvg)));
        let initialSvg = cleanSvg;
        let loadedFromCloud = false;
        let loadNotice = "";
        cloudFileIdRef.current = "";

        // Opened from "My Files" (?file=user-file:...): continue the design that was saved there.
        const fileParam = new URLSearchParams(window.location.search).get("file") || "";
        if (fileParam) {
          try {
            const savedResponse = await fetch(`/api/my-files?id=${encodeURIComponent(fileParam)}`, {
              credentials: "include",
              cache: "no-store",
            });
            const savedResult = await savedResponse.json().catch(() => null);
            if (
              savedResponse.ok &&
              savedResult?.success &&
              typeof savedResult.data?.svgMarkup === "string" &&
              Number(savedResult.data.templateId) === templateId
            ) {
              initialSvg = makeAllEditable(applyTypographyDefaults(sanitizeSvg(savedResult.data.svgMarkup)));
              cloudFileIdRef.current = String(savedResult.data.id || fileParam);
              loadedFromCloud = true;
            } else {
              loadNotice = "সেভ করা ডিজাইনটি পাওয়া যায়নি (হয়তো মুছে গেছে)। টেমপ্লেটটি নতুন করে খোলা হয়েছে।";
            }
          } catch {
            loadNotice = "সেভ করা ডিজাইনটি লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।";
          }
          if (!active) return;
        }

        if (!loadedFromCloud) {
          try {
            const savedDesign = window.localStorage.getItem(`${STORAGE_PREFIX}${templateId}`);
            if (savedDesign) {
              const savedData = JSON.parse(savedDesign) as { svgMarkup?: string; cloudFileId?: string };
              if (savedData.svgMarkup) initialSvg = makeAllEditable(applyTypographyDefaults(sanitizeSvg(savedData.svgMarkup)));
              if (savedData.cloudFileId) cloudFileIdRef.current = savedData.cloudFileId;
            }
          } catch {
            // Continue with the original template if local storage is unavailable.
          }
        }
        setTemplate(templateFromCatalog);
        setManifest(rawManifest);
        setZoom(calculateFitZoom(rawManifest));
        setSvgMarkup(initialSvg);
        setHistory([initialSvg]);
        setHistoryIndex(0);
        setSaved(false);
        if (loadNotice) setError(loadNotice);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to open this template.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTemplate();
    return () => {
      active = false;
    };
  }, [templateFromCatalog, templateId]);

  useEffect(() => {
    const nextLayers = readLayers(svgMarkup);
    setLayers(nextLayers);
    if (selectedId) {
      setSelectedLayer(nextLayers.find((layer) => layer.id === selectedId) ?? null);
    } else {
      setSelectedLayer(null);
    }
  }, [svgMarkup, selectedId]);

  // Keep the text box in sync when another layer is selected or undo/redo changes the text,
  // but never overwrite what the person is typing/composing (that was dropping Bangla characters).
  useEffect(() => {
    if (composingRef.current) return;
    const next = selectedLayer?.text ?? "";
    setTextDraft((current) => (cleanBanglaText(current) === cleanBanglaText(next) ? current : next));
  }, [selectedLayer?.id, selectedLayer?.text]);

  useEffect(() => {
    const svg = svgContainerRef.current?.querySelector("svg");
    if (!svg) return;
    svg.querySelectorAll("[data-editor-selected='true']").forEach((element) => element.removeAttribute("data-editor-selected"));
    if (selectedId) {
      const selected = Array.from(svg.querySelectorAll("[id]")).find((element) => element.getAttribute("id") === selectedId);
      selected?.setAttribute("data-editor-selected", "true");
    }
  }, [selectedId, svgMarkup]);

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveDesign();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        // Browser Ctrl+P would print the whole editor UI (extra pages); use the exact-size print instead.
        event.preventDefault();
        void printDesignRef.current();
        return;
      }
      if (isTyping) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        const step = event.shiftKey ? 5 : 1;
        nudgeRef.current(event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0, event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))) {
        event.preventDefault();
        redo();
      } else if (event.key === "Escape") {
        setSelectedId("");
      }
    };
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [historyIndex, history, svgMarkup, template]);

  const commitSvg = (nextMarkup: string) => {
    setSvgMarkup(nextMarkup);
    const nextHistory = [...history.slice(0, historyIndex + 1), nextMarkup];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setSaved(false);
  };

  const updateSelected = (attribute: string, value: string) => {
    if (!selectedId || !svgMarkup) return;
    try {
      const doc = parseSvg(svgMarkup);
      const element = findSvgElement(doc, selectedId);
      if (!element) return;
      if (attribute === "textContent") {
        const text = cleanBanglaText(value);
        const lines = text.split("\n");
        while (element.firstChild) element.removeChild(element.firstChild);
        if (element.localName === "text") {
          // Keep spaces exactly as typed instead of letting SVG collapse them.
          element.setAttributeNS(XML_NS, "xml:space", "preserve");
          element.setAttribute("lang", BENGALI_RE.test(text) ? "bn" : "en");
          if (lines.length > 1) {
            const x = element.getAttribute("x") || "0";
            lines.forEach((line, index) => {
              const tspan = element.ownerDocument.createElementNS(SVG_NS, "tspan");
              tspan.setAttribute("data-line", "true");
              tspan.setAttribute("x", x);
              if (index > 0) tspan.setAttribute("dy", "1.3em");
              tspan.textContent = line;
              element.appendChild(tspan);
            });
          } else {
            element.textContent = text;
          }
          // Typing Bangla into an English-only font would show broken fallback glyphs.
          const family = element.getAttribute("font-family") || "";
          if (BENGALI_RE.test(text) && family && !BENGALI_FONT_RE.test(family)) {
            element.setAttribute("font-family", `${family}, ${BENGALI_FALLBACK_FONTS}`);
          }
        } else {
          element.textContent = text.replace(/\n/g, " ");
        }
      } else if (attribute === "fill" || attribute === "stroke" || attribute === "opacity" || attribute === "stroke-width") {
        applyPaint(element, attribute, value);
      } else {
        element.setAttribute(attribute, value);
      }
      commitSvg(serializeSvg(doc));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update this element.");
    }
  };

  const updateCoordinate = (axis: "x" | "y", value: string) => {
    if (!selectedId || !svgMarkup) return;
    try {
      const num = Number(value);
      if (value.trim() === "" || !Number.isFinite(num)) return;
      const doc = parseSvg(svgMarkup);
      const element = findSvgElement(doc, selectedId);
      if (!element) return;
      const candidates = axis === "x" ? ["x", "cx", "x1"] : ["y", "cy", "y1"];
      const attribute = candidates.find((name) => element.hasAttribute(name));
      const move = getMove(element);
      if (!attribute) {
        // Paths, polygons, groups… have no x/y, so the box moves them directly.
        if (axis === "x") setMove(element, num, move.dy);
        else setMove(element, move.dx, num);
      } else {
        element.setAttribute(attribute, String(num - (axis === "x" ? move.dx : move.dy)));
      }
      commitSvg(serializeSvg(doc));
    } catch {
      setError("Could not update the element position.");
    }
  };

  const moveSelectedBy = (deltaX: number, deltaY: number) => {
    if (!selectedId || !svgMarkup) return;
    try {
      const doc = parseSvg(svgMarkup);
      const element = findSvgElement(doc, selectedId);
      if (!element) return;
      const move = getMove(element);
      setMove(element, move.dx + deltaX, move.dy + deltaY);
      commitSvg(serializeSvg(doc));
    } catch {
      setError("Could not move the element.");
    }
  };
  nudgeRef.current = moveSelectedBy;

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target;
    const container = svgContainerRef.current;
    if (!(target instanceof Element) || !container) return;
    const editable = target.closest('[data-editable="true"]') as SVGGraphicsElement | null;
    if (!editable || !container.contains(editable)) return;
    const id = editable.getAttribute("id") || "";
    if (!id) return;
    setSelectedId(id);

    // The big page background is selectable (colour change) but is not dragged around.
    const svg = container.querySelector("svg");
    try {
      const box = editable.getBBox();
      const viewBox = svg?.viewBox.baseVal;
      if (viewBox && viewBox.width > 0 && box.width >= viewBox.width * 0.9 && box.height >= viewBox.height * 0.9) return;
    } catch {
      // getBBox can fail for hidden elements; dragging is simply skipped.
    }
    const parent = editable.parentNode as SVGGraphicsElement | null;
    const matrix = parent?.getScreenCTM?.();
    if (!matrix) return;
    // Older SVGMatrix has no transformPoint(), so apply the inverse matrix by hand.
    const inverse = matrix.inverse();
    const toLocal = (clientX: number, clientY: number) => ({
      x: inverse.a * clientX + inverse.c * clientY + inverse.e,
      y: inverse.b * clientX + inverse.d * clientY + inverse.f,
    });
    const start = toLocal(event.clientX, event.clientY);
    const base = getMove(editable);
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    let moved = false;
    let finalDx = base.dx;
    let finalDy = base.dy;

    const onMove = (moveEvent: PointerEvent) => {
      if (!moved && Math.hypot(moveEvent.clientX - startClientX, moveEvent.clientY - startClientY) < 3) return;
      moved = true;
      moveEvent.preventDefault();
      const point = toLocal(moveEvent.clientX, moveEvent.clientY);
      finalDx = base.dx + (point.x - start.x);
      finalDy = base.dy + (point.y - start.y);
      setMove(editable, finalDx, finalDy);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!moved) return;
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      try {
        const doc = parseSvg(svgMarkup);
        const element = findSvgElement(doc, id);
        if (!element) return;
        setMove(element, finalDx, finalDy);
        commitSvg(serializeSvg(doc));
      } catch {
        setError("Could not move the element.");
      }
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const handleSvgClick = (event: MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) return;
    const target = event.target;
    if (!(target instanceof Element)) {
      setSelectedId("");
      return;
    }
    const editable = target.closest('[data-editable="true"]');
    if (!editable || !svgContainerRef.current?.contains(editable)) {
      // Clicking an empty part of the artwork clears the current selection.
      setSelectedId("");
      return;
    }
    const id = editable.getAttribute("id");
    setSelectedId(id || "");
  };

  const handleEditorPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!selectedId) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    // Keep the selection while the user edits properties, chooses layers or presses toolbar actions.
    if (
      target.closest("[data-pm-keep-selection='true']") ||
      target.closest("button, input, textarea, select, label, [contenteditable='true']")
    ) return;
    // Canvas clicks are handled by handleSvgClick so clicking blank canvas deselects cleanly.
    if (svgContainerRef.current?.contains(target)) return;
    // Any other click outside the artwork releases the active object.
    setSelectedId("");
  };

  const addText = () => {
    if (!svgMarkup || !manifest) return;
    try {
      const doc = parseSvg(svgMarkup);
      const text = doc.createElementNS(SVG_NS, "text");
      const id = `user-text-${Date.now()}`;
      text.setAttribute("id", id);
      text.setAttribute("data-layer-name", "নতুন লেখা");
      text.setAttribute("data-editable", "true");
      const canvas = getCanvasDimensions(manifest);
      text.setAttribute("x", String(Math.round(canvas.width / 2)));
      text.setAttribute("y", String(Math.round(canvas.height / 2)));
      text.setAttribute("font-family", '"Hind Siliguri", "Noto Sans Bengali", "Nirmala UI", sans-serif');
      text.setAttribute("font-size", "32");
      text.setAttribute("font-weight", "600");
      text.setAttribute("fill", "#222222");
      text.setAttribute("text-anchor", "middle");
      text.textContent = "আপনার লেখা";
      doc.documentElement.appendChild(text);
      commitSvg(serializeSvg(doc));
      setSelectedId(id);
    } catch {
      setError("Could not add a text layer.");
    }
  };

  const addImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedId || !svgMarkup) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Please use an image smaller than 12 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      try {
        const doc = parseSvg(svgMarkup);
        const frame = findSvgElement(doc, selectedId);
        if (!frame || frame.getAttribute("data-object-type") !== "image") {
          setError("Select an image placeholder before uploading a photo or logo.");
          return;
        }

        const isCircle = frame.localName.toLowerCase() === "circle";
        let x = 0;
        let y = 0;
        let width = 0;
        let height = 0;
        let clipShape: Element;

        if (isCircle) {
          const cx = Number(frame.getAttribute("cx") || 0);
          const cy = Number(frame.getAttribute("cy") || 0);
          const radius = Number(frame.getAttribute("r") || 0);
          if (!radius) throw new Error("This circular placeholder has no usable dimensions.");
          x = cx - radius;
          y = cy - radius;
          width = radius * 2;
          height = radius * 2;
          clipShape = doc.createElementNS(SVG_NS, "circle");
          clipShape.setAttribute("cx", String(cx));
          clipShape.setAttribute("cy", String(cy));
          clipShape.setAttribute("r", String(radius));
        } else {
          x = Number(frame.getAttribute("x") || 0);
          y = Number(frame.getAttribute("y") || 0);
          width = Number(frame.getAttribute("width") || 0);
          height = Number(frame.getAttribute("height") || 0);
          if (!width || !height) throw new Error("This image placeholder has no usable dimensions.");
          clipShape = doc.createElementNS(SVG_NS, "rect");
          clipShape.setAttribute("x", String(x));
          clipShape.setAttribute("y", String(y));
          clipShape.setAttribute("width", String(width));
          clipShape.setAttribute("height", String(height));
          clipShape.setAttribute("rx", frame.getAttribute("rx") || "0");
        }

        const clipId = `uploaded-photo-clip-${Date.now()}`;
        let defs = doc.documentElement.querySelector("defs");
        if (!defs) {
          defs = doc.createElementNS(SVG_NS, "defs");
          doc.documentElement.insertBefore(defs, doc.documentElement.firstChild);
        }
        const clipPath = doc.createElementNS(SVG_NS, "clipPath");
        clipPath.setAttribute("id", clipId);
        clipPath.setAttribute("clipPathUnits", "userSpaceOnUse");
        clipPath.appendChild(clipShape);
        defs.appendChild(clipPath);

        const image = doc.createElementNS(SVG_NS, "image");
        image.setAttribute("id", `uploaded-image-${Date.now()}`);
        image.setAttribute("data-layer-name", `Uploaded image for ${frame.getAttribute("data-layer-name") || selectedId}`);
        image.setAttribute("data-editable", "true");
        image.setAttribute("data-object-type", "image");
        image.setAttribute("href", reader.result);
        image.setAttribute("x", String(x));
        image.setAttribute("y", String(y));
        image.setAttribute("width", String(width));
        image.setAttribute("height", String(height));
        image.setAttribute("preserveAspectRatio", "xMidYMid slice");
        image.setAttribute("clip-path", `url(#${clipId})`);
        frame.parentNode?.insertBefore(image, frame);
        frame.setAttribute("fill", "none");

        const hint = findSvgElement(doc, `${selectedId}_hint`);
        hint?.setAttribute("display", "none");
        if (selectedId === "qr_image_placeholder") {
          findSvgElement(doc, "qr_hint_text")?.setAttribute("display", "none");
        }

        commitSvg(serializeSvg(doc));
        setSelectedId(image.getAttribute("id") || "");
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Could not place this image.");
      }
    };
    reader.onerror = () => setError("The selected image could not be read.");
    reader.readAsDataURL(file);
  };
  const deleteSelected = () => {
    if (!selectedId || !svgMarkup) return;
    try {
      const doc = parseSvg(svgMarkup);
      const element = findSvgElement(doc, selectedId);
      if (!element || element.id === "background") return;
      element.remove();
      commitSvg(serializeSvg(doc));
      setSelectedId("");
    } catch {
      setError("Could not remove this layer.");
    }
  };

  const readBlobAsDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("preview read failed"));
      reader.readAsDataURL(blob);
    });

  // Saves the design to "My Files" (preview image on Cloudinary + the editable SVG in the database).
  const saveToMyFiles = async (markup: string, currentTemplate: PrintMediaTemplate) => {
    const previewBlob = await renderPngBlob(300 / 25.4, 1000);
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ image: await readBlobAsDataUrl(previewBlob) }),
    });
    const upload = await uploadResponse.json().catch(() => null);
    if (!uploadResponse.ok || !upload?.success || !upload?.url) {
      throw new Error(upload?.error || upload?.message || "preview upload failed");
    }
    const url = String(upload.url);
    const publicId = String(upload.publicId || "");
    const name = currentTemplate.title;

    let response: Response | null = null;
    if (cloudFileIdRef.current) {
      response = await fetch("/api/my-files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: cloudFileIdRef.current, name, url, publicId, svgMarkup: markup }),
      });
      if (response.status === 404) {
        // The earlier copy was deleted from My Files: save this one as a new file.
        cloudFileIdRef.current = "";
        response = null;
      }
    }
    if (!response) {
      response = await fetch("/api/my-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          category: "print-media",
          toolName: "Print Media",
          workspace: "creative",
          group: "image",
          url,
          publicId,
          templateId: currentTemplate.id,
          svgMarkup: markup,
        }),
      });
    }
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success || !result?.data?.id) {
      throw new Error(result?.error || result?.message || "save failed");
    }
    cloudFileIdRef.current = String(result.data.id);
  };

  const writeLocalSave = (markup: string, currentTemplate: PrintMediaTemplate) => {
    try {
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${currentTemplate.id}`,
        JSON.stringify({
          svgMarkup: markup,
          updatedAt: new Date().toISOString(),
          templateId: currentTemplate.id,
          cloudFileId: cloudFileIdRef.current || undefined,
        }),
      );
      return true;
    } catch {
      return false;
    }
  };

  const saveDesign = async () => {
    if (!svgMarkup || !template || !manifest || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    const markup = svgMarkup;
    // Always keep a copy in this browser first, so nothing is lost even if the cloud save fails.
    const localOk = writeLocalSave(markup, template);
    try {
      await saveToMyFiles(markup, template);
      writeLocalSave(markup, template); // remember the My Files entry for the next Save
      setSaved(true);
      notifyMyFilesSaved(1, "design");
    } catch (saveError) {
      console.error("Failed to save Print Media design to My Files:", saveError);
      const reason = saveError instanceof Error ? saveError.message : "";
      setSaved(false);
      setError(
        `${localOk ? "ডিজাইনটি এই ব্রাউজারে সেভ হয়েছে, কিন্তু" : "ডিজাইনটি"} ‘আমার ফাইল’-এ সেভ করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার Save চাপুন।${reason && !/failed|read failed/i.test(reason) ? ` (${reason})` : ""}`,
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setSvgMarkup(history[nextIndex]);
    setSaved(false);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setSvgMarkup(history[nextIndex]);
    setSaved(false);
  };

  const cleanSvgForExport = () => {
    const doc = parseSvg(svgMarkup);
    const guide = findSvgElement(doc, "safe-area-guide");
    guide?.remove();
    findSvgElement(doc, "print_guides")?.remove();
    doc.querySelectorAll('[data-print="false"]').forEach((node) => node.remove());
    doc.querySelectorAll("[data-editor-selected]").forEach((node) => node.removeAttribute("data-editor-selected"));
    doc.documentElement.setAttribute("xmlns", SVG_NS);
    return serializeSvg(doc);
  };

  // Renders the current design to a PNG. Used for the PNG download and for the My Files preview.
  const renderPngBlob = (targetPixelsPerMm: number, maxPixelEdge: number) =>
    new Promise<Blob>((resolve, reject) => {
      if (!manifest) {
        reject(new Error("Template is not ready."));
        return;
      }
      const url = URL.createObjectURL(new Blob([cleanSvgForExport()], { type: "image/svg+xml;charset=utf-8" }));
      const image = new Image();
      image.onload = () => {
        const dimensions = getCanvasDimensions(manifest);
        const scale = Math.min(targetPixelsPerMm, maxPixelEdge / Math.max(dimensions.width, dimensions.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(dimensions.width * scale));
        canvas.height = Math.max(1, Math.ceil(dimensions.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(url);
          reject(new Error("Your browser does not support PNG export."));
          return;
        }
        context.scale(scale, scale);
        context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("PNG export failed."));
        }, "image/png");
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("The SVG could not be rendered for PNG export."));
      };
      image.src = url;
    });

  const exportPng = async () => {
    if (!svgMarkup || !template || !manifest) return;
    try {
      const blob = await renderPngBlob(300 / 25.4, 12000);
      downloadBlob(blob, `${String(template.id).padStart(2, "0")}-${safeFilename(template.title)}.png`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "PNG export failed. Please try again.");
    }
  };

  const printDesign = async () => {
    if (!svgMarkup || !manifest || printingRef.current) return;
    printingRef.current = true;

    let frame: HTMLIFrameElement | null = null;
    let removeTimer = 0;
    try {
      document.querySelectorAll('iframe[data-pm-print-frame="true"]').forEach((node) => node.remove());

      // Round to 0.01mm so floating point noise (e.g. 304.79999mm) can never make the page one pixel too small.
      const physicalWidthMm = roundMm(toMillimeters(manifest.physicalWidth, manifest.unit));
      const physicalHeightMm = roundMm(toMillimeters(manifest.physicalHeight, manifest.unit));
      if (!Number.isFinite(physicalWidthMm) || !Number.isFinite(physicalHeightMm) || physicalWidthMm <= 0 || physicalHeightMm <= 0) {
        throw new Error("এই টেমপ্লেটের প্রিন্ট সাইজ সঠিক নয়। Template size settings পরীক্ষা করুন।");
      }

      const exportDoc = parseSvg(cleanSvgForExport());
      const exportRoot = exportDoc.documentElement;
      const canvasSize = getCanvasDimensions(manifest);
      exportRoot.setAttribute("xmlns", SVG_NS);
      if (!exportRoot.getAttribute("viewBox")) exportRoot.setAttribute("viewBox", `0 0 ${canvasSize.width} ${canvasSize.height}`);
      exportRoot.setAttribute("width", `${physicalWidthMm}mm`);
      exportRoot.setAttribute("height", `${physicalHeightMm}mm`);
      exportRoot.setAttribute("overflow", "hidden");
      exportRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");
      exportRoot.removeAttribute("style");
      exportRoot.querySelectorAll("[data-editor-selected]").forEach((element) => element.removeAttribute("data-editor-selected"));

      // Every font + the exact text that uses it. Google Fonts splits Bangla into unicode-range files,
      // so each used text must be loaded explicitly or the printout silently falls back to another font.
      const fontJobs = new Map<string, { family: string; weight: string; sample: string }>();
      exportRoot.querySelectorAll("text").forEach((element) => {
        const sample = (element.textContent || "").trim();
        if (!sample) return;
        const family = (element.closest("[font-family]")?.getAttribute("font-family") || exportRoot.getAttribute("font-family") || "sans-serif").replace(/&quot;/g, '"');
        const weight = element.closest("[font-weight]")?.getAttribute("font-weight") || "400";
        const key = `${weight}|${family}`;
        const existing = fontJobs.get(key);
        fontJobs.set(key, { family, weight, sample: `${existing?.sample ?? ""}${sample}`.slice(0, 2000) });
      });
      const imageSources = Array.from(exportRoot.querySelectorAll("image"))
        .map((element) => element.getAttribute("href") || element.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "")
        .filter((href) => href.startsWith("data:image/"));

      const printSvg = serializeSvg(exportDoc);

      frame = document.createElement("iframe");
      frame.setAttribute("title", "SebaLagbe print document");
      frame.setAttribute("aria-hidden", "true");
      frame.setAttribute("data-pm-print-frame", "true");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "1px";
      frame.style.height = "1px";
      frame.style.border = "0";
      frame.style.opacity = "0";
      frame.style.pointerEvents = "none";
      document.body.appendChild(frame);

      const printWindow = frame.contentWindow;
      const printDocument = printWindow?.document;
      if (!printWindow || !printDocument) throw new Error("Browser print window could not be prepared.");

      const fontCssUrl = "https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700;800&family=Baloo+Da+2:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Noto+Serif+Bengali:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tiro+Bangla&display=swap";
      const pageW = `${physicalWidthMm}mm`;
      const pageH = `${physicalHeightMm}mm`;
      // The sheet is a hair (0.3mm) shorter than the paper and the SVG is absolutely positioned inside it.
      // An exact-height box is what normally spills one pixel onto a second blank page after rounding.
      printDocument.open();
      printDocument.write(`<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${(template?.title || "Print Design").replace(/[&<>\"]/g, "")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link id="pm-print-fonts" rel="stylesheet" href="${fontCssUrl}" />
<style>
  @page { size: ${pageW} ${pageH}; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff; width: ${pageW}; overflow: hidden; }
  html { height: auto; }
  body { height: auto; }
  .pm-sheet { position: relative; display: block; width: ${pageW}; height: calc(${pageH} - 0.3mm); overflow: visible; break-inside: avoid; break-before: avoid; break-after: avoid; page-break-inside: avoid; page-break-before: avoid; page-break-after: avoid; }
  .pm-sheet > svg { position: absolute; left: 0; top: 0; display: block; width: ${pageW} !important; height: ${pageH} !important; max-width: none !important; max-height: none !important; overflow: hidden; background: #fff; }
  svg text, svg tspan { text-rendering: geometricPrecision; font-kerning: normal; font-variant-ligatures: normal; }
  @media screen { body { outline: 1px solid #ddd; } }
</style>
</head>
<body><div class="pm-sheet">${printSvg}</div></body>
</html>`);
      printDocument.close();

      const cleanup = () => {
        window.clearTimeout(removeTimer);
        window.setTimeout(() => frame?.remove(), 1200);
      };
      printWindow.addEventListener("afterprint", cleanup, { once: true });
      // Safety net: if the browser never fires afterprint, still remove the hidden frame.
      removeTimer = window.setTimeout(() => frame?.remove(), 10 * 60 * 1000);

      // Wait for the font stylesheet, the fonts actually used (with their real text) and embedded images.
      try {
        const fontLink = printDocument.getElementById("pm-print-fonts") as HTMLLinkElement | null;
        const stylesheetReady = new Promise<void>((resolve) => {
          if (!fontLink || fontLink.sheet) {
            resolve();
            return;
          }
          fontLink.addEventListener("load", () => resolve(), { once: true });
          fontLink.addEventListener("error", () => resolve(), { once: true });
        });
        const resourcesReady = (async () => {
          await stylesheetReady;
          await Promise.all(
            Array.from(fontJobs.values()).map((job) =>
              printDocument.fonts.load(`${job.weight} 32px ${job.family}`, job.sample).catch(() => []),
            ),
          );
          await printDocument.fonts.ready;
          await Promise.all(
            imageSources.map(async (source) => {
              try {
                const image = new (printWindow as Window & typeof globalThis).Image();
                image.src = source;
                await image.decode();
              } catch {
                // A broken image should not block printing the rest of the design.
              }
            }),
          );
        })();
        await Promise.race([resourcesReady, new Promise((resolve) => window.setTimeout(resolve, 9000))]);
        await new Promise<void>((resolve) => printWindow.requestAnimationFrame(() => printWindow.requestAnimationFrame(() => resolve())));
      } catch {
        // Font loading is best-effort; system fallback fonts remain available.
      }

      await new Promise((resolve) => window.setTimeout(resolve, 250));
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        cleanup();
        setError("প্রিন্ট ডায়ালগ চালু করা যায়নি। আবার Print / PDF চাপুন।");
      }
    } catch (printError) {
      window.clearTimeout(removeTimer);
      frame?.remove();
      setError(printError instanceof Error ? printError.message : "Print / PDF তৈরি করা যায়নি।");
    } finally {
      printingRef.current = false;
    }
  };
  printDesignRef.current = printDesign;

  const panelColor = (prop: "fill" | "stroke") => {
    const direct = colorToHex(selectedLayer ? selectedLayer[prop] : "");
    if (direct) return direct;
    try {
      const live = selectedId ? Array.from<Element>(svgContainerRef.current?.querySelectorAll("[id]") ?? []).find((element: Element) => element.getAttribute("id") === selectedId) : null;
      if (live) {
        const computed = colorToHex(window.getComputedStyle(live)[prop]);
        if (computed) return computed;
      }
    } catch {
      // fall through to the default colour
    }
    return "#000000";
  };

  const canvasDimensions = getCanvasDimensions(manifest);
  const pagePrintWidthMm = manifest ? roundMm(toMillimeters(manifest.physicalWidth, manifest.unit)) : 210;
  const pagePrintHeightMm = manifest ? roundMm(toMillimeters(manifest.physicalHeight, manifest.unit)) : 297;
  const canvasStyle = manifest
    ? { aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}` }
    : undefined;

  return (
    <div onPointerDownCapture={handleEditorPointerDown} className="min-h-screen flex flex-col bg-[#EDE3D0] text-[#332A1D] pm-editor-font">
      <DashboardNavbar />
      <style>{`
        @page { size: ${pagePrintWidthMm}mm ${pagePrintHeightMm}mm; margin: 0; }
        @import url('https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700;800&family=Baloo+Da+2:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Noto+Serif+Bengali:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tiro+Bangla&display=swap');
        .editor-action { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid #e2d4b9; background:#fffaf0; color:#5b4a31; border-radius:11px; padding:9px 12px; font-size:12px; font-weight:700; transition:all .15s ease; }
        .editor-action:hover:not(:disabled) { border-color:#dc2626; color:#dc2626; background:#fff; }
        .editor-action:disabled { opacity:.4; cursor:not-allowed; }
        .editor-action-primary { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid #dc2626; background:#dc2626; color:#fff; border-radius:11px; padding:9px 13px; font-size:12px; font-weight:800; transition:all .15s ease; }
        .editor-action-primary:hover { background:#b91c1c; }
        .editor-tool { display:inline-flex; align-items:center; justify-content:center; gap:6px; border:1px solid #e2d4b9; background:#fffaf0; color:#6a5332; border-radius:9px; padding:8px 5px; font-size:11px; font-weight:700; }
        .editor-tool:hover:not(:disabled) { border-color:#dc2626; color:#dc2626; }
        .editor-tool:disabled { opacity:.45; cursor:not-allowed; }
        .editor-zoom { width:28px; height:28px; border-radius:8px; border:1px solid #d7c7a7; background:#fffaf0; color:#6a5332; font-weight:800; }
        .pm-editor-font, .pm-editor-font *:not(svg):not(svg *) { font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", sans-serif; -webkit-font-smoothing: antialiased; }
        .pm-canvas svg { width: 100%; height: auto; max-height: 100%; display: block; }
        .pm-canvas svg text, .pm-canvas svg tspan { text-rendering: optimizeLegibility; font-kerning: normal; }
        .pm-canvas svg [data-editor-selected="true"]:not(#bg_page):not(#background):not([data-layer-name="Page Background"]) { filter: drop-shadow(0 0 1px rgba(220,38,38,.95)) drop-shadow(0 0 1px rgba(220,38,38,.65)); }
        .pm-canvas svg [data-editor-selected="true"]#bg_page, .pm-canvas svg [data-editor-selected="true"]#background { filter:none !important; }
        .pm-canvas svg [data-editable="true"] { cursor: move; touch-action: none; }
        .pm-canvas svg [data-editable="true"]:hover:not([data-editor-selected="true"]) { opacity: .92; }
        .pm-property-input { width: 100%; border: 1px solid #ded1b7; border-radius: 10px; background: #fffaf0; color: #332a1d; padding: 9px 10px; outline: none; font-size: 13px; }
        .pm-property-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,.1); }
        @media print {
          /* Fallback if the browser menu is used instead of the Print / PDF button: print only the artwork, on one page. */
          html, body { background:#fff !important; margin:0 !important; padding:0 !important; height:0 !important; min-height:0 !important; overflow:hidden !important; }
          body * { visibility:hidden !important; }
          #pm-print-area, #pm-print-area * { visibility:visible !important; }
          #pm-print-area { position:fixed !important; left:0 !important; top:0 !important; width:${pagePrintWidthMm}mm !important; height:${pagePrintHeightMm}mm !important; aspect-ratio:auto !important; margin:0 !important; padding:0 !important; border:0 !important; border-radius:0 !important; box-shadow:none !important; overflow:hidden !important; break-inside:avoid !important; }
          #pm-print-area svg { width:100% !important; height:100% !important; max-height:none !important; display:block !important; }
          #pm-print-area svg [data-editor-selected="true"] { filter:none !important; }
        }
      `}</style>

      <div data-pm-keep-selection="true" className="sticky top-16 z-40 px-3 sm:px-5 py-3 border-b border-[#D9C9A9] bg-[#F7F0E2]/95 backdrop-blur-md shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => router.push("/print-media")} className="w-10 h-10 rounded-xl border border-[#E2D4B9] bg-white text-[#5B4A31] hover:text-[#DC2626] hover:border-[#DC2626] flex items-center justify-center shrink-0" aria-label="Back to templates">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#A06A32]"><T>Print Media Editor</T></div>
            <h1 className="font-extrabold text-[16px] sm:text-[19px] text-[#332A1D] truncate">{template?.title ?? <T>Loading template...</T>}</h1>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button type="button" onClick={undo} disabled={historyIndex <= 0} className="editor-action" aria-label="Undo"><Undo2 size={16} /><span className="hidden sm:inline"><T>Undo</T></span></button>
          <button type="button" onClick={redo} disabled={historyIndex < 0 || historyIndex >= history.length - 1} className="editor-action" aria-label="Redo"><Redo2 size={16} /><span className="hidden sm:inline"><T>Redo</T></span></button>
          <button type="button" onClick={() => void saveDesign()} disabled={saving} className="editor-action-primary disabled:cursor-wait disabled:opacity-70">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}<T>Save</T></button>
          <button type="button" onClick={() => void exportPng()} className="editor-action"><FileImage size={16} /><span className="hidden sm:inline">PNG</span></button>
          <button type="button" onClick={() => void printDesign()} className="editor-action"><FileText size={16} /><span className="hidden sm:inline"><T>Print / PDF</T></span></button>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 lg:p-5">
        {error && (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button>
          </div>
        )}
        {saved && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
            <Check size={16} /> <T>ডিজাইন ‘আমার ফাইল’-এ সেভ হয়েছে। সেখান থেকে যেকোনো সময় খুলে বাকি কাজ করতে পারবেন।</T>
          </div>
        )}

        {loading ? (
          <div className="min-h-[55vh] flex items-center justify-center text-[#806E50] gap-3">
            <LoaderCircle size={22} className="animate-spin" />
            <span className="font-semibold"><T>Loading editable template...</T></span>
          </div>
        ) : error && !svgMarkup ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-3">
            <p className="font-bold text-lg">{error}</p>
            <button type="button" onClick={() => router.push("/print-media")} className="px-4 py-2 rounded-xl bg-[#DC2626] text-white font-bold"><T>Back to templates</T></button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[250px_minmax(0,1fr)_290px] gap-4 items-start">
            <aside className="bg-[#F8F1E4] border border-[#E2D4B9] rounded-2xl shadow-sm overflow-hidden">
              <button type="button" onClick={() => setShowLayers((value) => !value)} className="w-full flex items-center justify-between px-4 py-3 border-b border-[#E2D4B9] font-bold text-sm">
                <span className="flex items-center gap-2"><Layers3 size={16} className="text-[#DC2626]" /><T>Layers</T> <span className="text-xs text-[#907B58]">({layers.length})</span></span>
                <ChevronDown size={15} className={`transition-transform ${showLayers ? "rotate-180" : ""}`} />
              </button>
              {showLayers && (
                <div className="p-2 max-h-[46vh] xl:max-h-[62vh] overflow-y-auto space-y-1">
                  {layers.map((layer) => (
                    <button
                      type="button"
                      key={layer.id}
                      onClick={() => setSelectedId(layer.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] truncate transition ${selectedId === layer.id ? "bg-[#F7DDB8] text-[#C2410C] font-bold" : "text-[#5C4B32] hover:bg-[#EEE2CC]"}`}
                      title={layer.name}
                    >
                      <span className="inline-block w-5 text-[10px] uppercase opacity-50">{layer.tag.slice(0, 3)}</span>
                      {layer.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="p-3 border-t border-[#E2D4B9] grid grid-cols-2 gap-2">
                <button type="button" onClick={addText} className="editor-tool"><Type size={15} /><T>Add text</T></button>
                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={!selectedLayer || !selectedLayer.width || !selectedLayer.height} className="editor-tool"><ImagePlus size={15} /><T>Add image</T></button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={addImage} />
              </div>
              <p className="px-3 pb-3 text-[10px] leading-4 text-[#907B58]"><T>ক্যানভাসে কোনো অবজেক্টে ক্লিক করুন অথবা লেয়ার তালিকা থেকে নির্বাচন করুন।</T></p>
            </aside>

            <main className="min-w-0 space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="text-[12px] font-semibold text-[#806E50] truncate">
                  {manifest?.physicalSizeLabel || template?.printSize} · {manifest?.physicalWidth ?? canvasDimensions.width} × {manifest?.physicalHeight ?? canvasDimensions.height} {manifest?.unit || "mm"}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => setZoom((value) => Math.max(35, value - 10))} className="editor-zoom">−</button>
                  <span className="text-xs font-bold text-[#705D3D] w-10 text-center">{zoom}%</span>
                  <button type="button" onClick={() => setZoom((value) => Math.min(200, value + 10))} className="editor-zoom">+</button>
                  <button type="button" onClick={() => setZoom(calculateFitZoom(manifest))} className="text-xs font-semibold text-[#A04B2A] px-1"><T>Fit</T></button>
                </div>
              </div>
              <div className="bg-[#D9D0C1] border border-[#CFC2A9] rounded-2xl p-3 sm:p-5 lg:p-7 min-h-[55vh] flex items-center justify-center overflow-auto">
                <div
                  id="pm-print-area"
                  ref={svgContainerRef}
                  onClick={handleSvgClick}
                  onPointerDown={handleCanvasPointerDown}
                  className="pm-canvas bg-white shadow-[0_12px_40px_rgba(52,40,20,.18)] ring-1 ring-black/10"
                  style={{ ...canvasStyle, width: `${Math.round(760 * zoom / 100)}px`, flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              </div>
              <p className="text-[11px] text-[#8B7656] px-1"><T>ক্যানভাসের ফাঁকা জায়গা বা বাইরে ক্লিক করলে নির্বাচিত অবজেক্টের selection উঠে যাবে। Print / PDF আলাদা print page খুলে সঠিক মাপে প্রিন্ট করবে।</T></p>
            </main>

            <aside className="bg-[#F8F1E4] border border-[#E2D4B9] rounded-2xl shadow-sm overflow-hidden flex flex-col xl:sticky xl:top-[136px] xl:max-h-[calc(100vh-148px)]">
              <button type="button" onClick={() => setShowProperties((value) => !value)} className="w-full flex items-center justify-between px-4 py-3 border-b border-[#E2D4B9] font-bold text-sm">
                <span className="inline-flex items-center"><SlidersHorizontal size={16} className="mr-2 text-[#DC2626]" /><T>Properties</T></span>
                <ChevronDown size={15} className={`transition-transform ${showProperties ? "rotate-180" : ""}`} />
              </button>
              {showProperties && (
                <div className="p-4 space-y-4 min-h-0 overflow-y-auto flex-1">
                  {selectedLayer ? (
                    <>
                      <div>
                        <p className="text-[11px] font-bold text-[#9A835D] uppercase tracking-wide mb-1"><T>Selected layer</T></p>
                        <p className="text-sm font-bold text-[#3B2F1E] break-words">{selectedLayer.name}</p>
                        <p className="text-[10px] text-[#917C59] mt-1">{selectedLayer.objectType.toUpperCase()} · {selectedLayer.id}</p>
                      </div>
                      {selectedLayer.tag === "text" || selectedLayer.tag === "tspan" ? (
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-[#6F5B3C]"><T>Text content</T></span>
                          <textarea
                            value={textDraft}
                            lang="bn"
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="off"
                            onCompositionStart={() => { composingRef.current = true; }}
                            onCompositionEnd={(event) => {
                              composingRef.current = false;
                              const value = event.currentTarget.value;
                              setTextDraft(value);
                              updateSelected("textContent", value);
                            }}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                              const value = event.target.value;
                              setTextDraft(value);
                              // While an IME/Bangla keyboard is still composing, wait; commit when it finishes.
                              if (!composingRef.current) updateSelected("textContent", value);
                            }}
                            rows={3}
                            className="pm-property-input resize-y"
                            style={{ fontFamily: '"Hind Siliguri", "Noto Sans Bengali", "Nirmala UI", sans-serif', lineHeight: 1.5 }}
                          />
                        </label>
                      ) : null}
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-[#6F5B3C]">X</span>
                          <NumberField value={selectedLayer.x} onCommit={(value) => updateCoordinate("x", value)} className="pm-property-input" />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-[#6F5B3C]">Y</span>
                          <NumberField value={selectedLayer.y} onCommit={(value) => updateCoordinate("y", value)} className="pm-property-input" />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-[#6F5B3C]"><T>Fill color</T></span>
                          <input type="color" value={panelColor("fill")} onChange={(event: ChangeEvent<HTMLInputElement>) => updateSelected("fill", event.target.value)} className="w-full h-10 rounded-lg border border-[#DED1B7] bg-white p-1" />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-[#6F5B3C]"><T>Stroke color</T></span>
                          <input type="color" value={panelColor("stroke")} onChange={(event: ChangeEvent<HTMLInputElement>) => updateSelected("stroke", event.target.value)} className="w-full h-10 rounded-lg border border-[#DED1B7] bg-white p-1" />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => updateSelected("fill", "none")} className="flex-1 rounded-lg border border-[#DED1B7] bg-white py-1.5 text-[11px] font-bold text-[#6F5B3C] hover:border-[#DC2626] hover:text-[#DC2626]"><T>No fill</T></button>
                        <button type="button" onClick={() => updateSelected("stroke", "none")} className="flex-1 rounded-lg border border-[#DED1B7] bg-white py-1.5 text-[11px] font-bold text-[#6F5B3C] hover:border-[#DC2626] hover:text-[#DC2626]"><T>No stroke</T></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-[#6F5B3C]"><T>Opacity</T> · {Math.round((parseFloat(selectedLayer.opacity) || 0) * 100)}%</span>
                          <input type="range" min="0" max="100" step="5" value={Math.round((Number.isFinite(parseFloat(selectedLayer.opacity)) ? parseFloat(selectedLayer.opacity) : 1) * 100)} onChange={(event: ChangeEvent<HTMLInputElement>) => updateSelected("opacity", String(Number(event.target.value) / 100))} className="w-full accent-[#DC2626]" />
                        </label>
                        {selectedLayer.tag !== "text" && selectedLayer.tag !== "tspan" && selectedLayer.tag !== "image" ? (
                          <label className="block space-y-1.5">
                            <span className="text-xs font-bold text-[#6F5B3C]"><T>Stroke width</T></span>
                            <NumberField value={selectedLayer.strokeWidth || "0"} onCommit={(value) => updateSelected("stroke-width", value)} className="pm-property-input" />
                          </label>
                        ) : null}
                      </div>
                      {(selectedLayer.tag === "text" || selectedLayer.tag === "tspan") && (
                        <>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-bold text-[#6F5B3C]"><T>Font size</T></span>
                            <input type="number" min="6" max="300" value={selectedLayer.fontSize || "24"} onChange={(event: ChangeEvent<HTMLInputElement>) => updateSelected("font-size", event.target.value)} className="pm-property-input" />
                          </label>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-bold text-[#6F5B3C]"><T>Font family</T></span>
                            <select value={selectedLayer.fontFamily || '\"Hind Siliguri\", \"Noto Sans Bengali\", \"Nirmala UI\", sans-serif'} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateSelected("font-family", event.target.value)} className="pm-property-input">
                              <optgroup label="বাংলা ফন্ট">
                                <option value={'\"Hind Siliguri\", \"Noto Sans Bengali\", \"Nirmala UI\", sans-serif'}>Hind Siliguri — পরিষ্কার ও আধুনিক</option>
                                <option value={'\"Anek Bangla\", \"Hind Siliguri\", \"Noto Sans Bengali\", sans-serif'}>Anek Bangla — আধুনিক শিরোনাম</option>
                                <option value={'\"Noto Sans Bengali\", \"Hind Siliguri\", sans-serif'}>Noto Sans Bengali — স্ট্যান্ডার্ড</option>
                                <option value={'\"Baloo Da 2\", \"Hind Siliguri\", sans-serif'}>Baloo Da 2 — গোলাকার স্টাইল</option>
                                <option value={'\"Noto Serif Bengali\", \"Tiro Bangla\", serif'}>Noto Serif Bengali — ক্লাসিক</option>
                                <option value={'\"Tiro Bangla\", \"Noto Serif Bengali\", serif'}>Tiro Bangla — ঐতিহ্যবাহী</option>
                              </optgroup>
                              <optgroup label="English fonts">
                                <option value={'\"Plus Jakarta Sans\", \"Inter\", sans-serif'}>Plus Jakarta Sans</option>
                                <option value={'\"Inter\", Arial, sans-serif'}>Inter</option>
                                <option value="Arial, sans-serif">Arial</option>
                              </optgroup>
                            </select>
                          </label>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-bold text-[#6F5B3C]"><T>Font weight</T></span>
                            <select value={selectedLayer.fontWeight || "600"} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateSelected("font-weight", event.target.value)} className="pm-property-input">
                              <option value="400">Regular</option>
                              <option value="500">Medium</option>
                              <option value="600">Semi Bold</option>
                              <option value="700">Bold</option>
                              <option value="800">Extra Bold</option>
                            </select>
                          </label>
                        </>
                      )}
                      {(selectedLayer.width || selectedLayer.height) && (
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block space-y-1.5">
                            <span className="text-xs font-bold text-[#6F5B3C]"><T>Width</T></span>
                            <input type="number" min="1" value={selectedLayer.width} onChange={(event: ChangeEvent<HTMLInputElement>) => updateSelected("width", event.target.value)} className="pm-property-input" />
                          </label>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-bold text-[#6F5B3C]"><T>Height</T></span>
                            <input type="number" min="1" value={selectedLayer.height} onChange={(event: ChangeEvent<HTMLInputElement>) => updateSelected("height", event.target.value)} className="pm-property-input" />
                          </label>
                        </div>
                      )}
                      {selectedLayer.objectType === "image" && (
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#D9C7A5] bg-white py-2.5 text-xs font-bold text-[#785B32] hover:border-[#DC2626] hover:text-[#DC2626]">
                          <Upload size={15} /> <T>Place photo in this frame</T>
                        </button>
                      )}
                      <button type="button" onClick={deleteSelected} className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100">
                        <Trash2 size={15} /> <T>Delete selected layer</T>
                      </button>
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <Layers3 size={26} className="mx-auto text-[#B19B75] mb-2" />
                      <p className="text-sm font-bold text-[#5D4B31]"><T>Select an element</T></p>
                      <p className="text-xs leading-5 text-[#927D5B] mt-1"><T>ক্যানভাস অথবা Layers থেকে কোনো লেখা, শেপ বা ছবি নির্বাচন করুন।</T></p>
                    </div>
                  )}
                  <div className="border-t border-[#E2D4B9] pt-3 text-[10px] text-[#917C59] leading-4">
                    <T>এই সংস্করণে SVG Text, font, color, position, image replacement, undo/redo এবং PNG export সমর্থিত। Save এই ব্রাউজারের Local Storage-এ থাকে।</T>
                  </div>
                </div>
              )}
              <div className="border-t border-[#E2D4B9] bg-[#F8F1E4] p-3 grid grid-cols-2 gap-2 shrink-0">
                <button type="button" onClick={() => void saveDesign()} disabled={saving} className="editor-action-primary col-span-2 justify-center disabled:cursor-wait disabled:opacity-70">
                  {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} <T>Save design</T>{saved && !saving ? <Check size={15} /> : null}
                </button>
                <button type="button" onClick={undo} disabled={historyIndex <= 0} className="editor-action justify-center" aria-label="Undo"><Undo2 size={15} /><T>Undo</T></button>
                <button type="button" onClick={redo} disabled={historyIndex < 0 || historyIndex >= history.length - 1} className="editor-action justify-center" aria-label="Redo"><Redo2 size={15} /><T>Redo</T></button>
                <button type="button" onClick={() => void exportPng()} className="editor-action col-span-2 justify-center"><FileImage size={15} /> PNG</button>
                <button type="button" onClick={() => void printDesign()} className="editor-action col-span-2 justify-center"><FileText size={15} /><T>Print / PDF</T></button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

