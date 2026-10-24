"use client";
import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Pencil, Star, Share2, Upload, FileText, ChevronDown, ChevronUp, Minimize2, Combine, ArrowLeft, X, Plus, Lock, Type, Highlighter, PenTool, MousePointer2, Undo2, Download, ChevronLeft, ChevronRight, Loader2, AlertCircle, } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
// Scale at which PDF pages are rendered to the on-screen canvas.
// Annotation coordinates are stored in this same pixel space and converted
// back to PDF points (using each page's actual size) at export time.
const RENDER_SCALE = 1.5;
type Tool = "select" | "text" | "draw" | "highlight";
interface TextAnnotation {
    id: string;
    type: "text";
    page: number;
    x: number;
    y: number;
    text: string;
    fontSize: number;
    color: string;
}
interface DrawAnnotation {
    id: string;
    type: "draw";
    page: number;
    points: {
        x: number;
        y: number;
    }[];
    color: string;
    lineWidth: number;
}
interface HighlightAnnotation {
    id: string;
    type: "highlight";
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}
type Annotation = TextAnnotation | DrawAnnotation | HighlightAnnotation;
const PEN_COLORS = ["#111827", "#dc2626", "#2563eb", "#16a34a"];
const HIGHLIGHT_COLOR = "#fde047";
function hexToRgbColor(hex: string) {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return rgb(r, g, b);
}
function generateId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `ann_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
type EditPdfTextProps = { children: React.ReactNode };

const EDIT_PDF_BN: Record<string, string> = {
  "back to tools": "টুলসমূহে ফিরে যান",
  "pdf tools": "PDF টুল",
  "edit pdf": "PDF সম্পাদনা",
  "free": "বিনামূল্যে",
  "open any pdf in a full-screen editor — add or edit text, draw, highlight, sign, stamp, insert images and rearrange pages.": "যেকোনো PDF পূর্ণ-পর্দার এডিটরে খুলুন—লেখা যোগ বা সম্পাদনা করুন, আঁকুন, হাইলাইট করুন, স্বাক্ষর ও স্ট্যাম্প যোগ করুন, ছবি যুক্ত করুন এবং পৃষ্ঠাগুলো সাজান।",
  "files (": "ফাইল (",
  ")": ")",
  "add": "যোগ করুন",
  "drop a pdf here or click to upload": "PDF ফাইল এখানে টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
  "1 pdf file, max 300 mb": "সর্বোচ্চ ৩০০ MB আকারের ১টি PDF ফাইল",
  "mb": "MB",
  "preview": "প্রিভিউ",
  "ready": "প্রস্তুত",
  "empty": "খালি",
  "ready to open in the editor": "এডিটরে খোলার জন্য প্রস্তুত",
  "add files to get started": "শুরু করতে ফাইল যোগ করুন",
  "click \"open editor\" below to add text, drawings and highlights.": "লেখা, আঁকা ও হাইলাইট যোগ করতে নিচের “এডিটর খুলুন” বোতামে ক্লিক করুন।",
  "your result will appear here after you run the tool.": "টুলটি চালানোর পর ফলাফল এখানে দেখা যাবে।",
  "add an input to get started": "শুরু করতে একটি ফাইল যোগ করুন",
  "reset": "রিসেট",
  "open editor": "এডিটর খুলুন",
  "your files are processed in the browser — they are not uploaded to any server.": "আপনার ফাইল ব্রাউজারেই প্রক্রিয়াকরণ করা হয়—কোনো সার্ভারে আপলোড করা হয় না।",
  "?": "?",
  "how to use": "ব্যবহারের নিয়ম",
  "upload your pdf, click \"open editor\" to open the interactive editor, add text, shapes, or signatures, and save your edited document.": "আপনার PDF আপলোড করুন। ইন্টার‌্যাক্টিভ এডিটর খুলতে “এডিটর খুলুন” ক্লিক করুন, লেখা, আকৃতি বা স্বাক্ষর যোগ করুন এবং সম্পাদিত নথিটি সংরক্ষণ করুন।",
  "tools in the same category": "একই বিভাগের টুল",
  "compress pdf": "PDF সংকুচিত করুন",
  "shrink embedded photos and scans inside a pdf — text stays sharp.": "PDF-এর ভেতরের ছবি ও স্ক্যানের আকার কমান—লেখা থাকবে স্পষ্ট।",
  "merge pdfs": "PDF ফাইল একত্র করুন",
  "combine multiple pdf files into one document in your chosen order.": "আপনার নির্ধারিত ক্রমে একাধিক PDF ফাইলকে একটি নথিতে একত্র করুন।",
  "page": "পৃষ্ঠা",
  "/": "/",
  "saving...": "সংরক্ষণ হচ্ছে…",
  "save & download": "সংরক্ষণ ও ডাউনলোড",
  "loading pdf…": "PDF লোড হচ্ছে…",
  "select / pan": "নির্বাচন / সরানো",
  "add text": "লেখা যোগ করুন",
  "draw / sign": "আঁকুন / স্বাক্ষর করুন",
  "highlight": "হাইলাইট করুন",
  "undo last action": "শেষ কাজটি পূর্বাবস্থায় ফেরান",
  "add to favorites": "পছন্দের তালিকায় যোগ করুন",
  "share this tool": "এই টুলটি শেয়ার করুন",
  "remove pdf": "PDF সরিয়ে ফেলুন",
  "close editor": "এডিটর বন্ধ করুন",
  "could not open this pdf. it may be corrupted or password protected.": "এই PDF খোলা যায়নি। ফাইলটি নষ্ট হতে পারে অথবা পাসওয়ার্ড দিয়ে সুরক্ষিত থাকতে পারে।",
  "something went wrong while rendering this page.": "এই পৃষ্ঠা দেখাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
  "something went wrong while saving your pdf. please try again.": "PDF সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
};

function normalizeEditPdfText(value: string): string {
  return value.replace(/\r\n/g, " ").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function translateEditPdfText(value: string, locale: string | undefined, baseL?: (value: string) => string): string {
  const raw = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn") || !/[A-Za-z]/.test(raw)) return raw;
  const leading = raw.match(/^\s*/)?.[0] ?? "";
  const trailing = raw.match(/\s*$/)?.[0] ?? "";
  const key = normalizeEditPdfText(raw);
  const exact = EDIT_PDF_BN[key];
  if (exact !== undefined) return `${leading}${exact}${trailing}`;

  let match = raw.trim().match(/^Ready to edit:\s*(.+)$/i);
  if (match) return `${leading}সম্পাদনার জন্য প্রস্তুত: ${match[1]}${trailing}`;
  match = raw.trim().match(/^Page\s+(\d+)$/i);
  if (match) return `${leading}পৃষ্ঠা ${match[1]}${trailing}`;
  match = raw.trim().match(/^Page\s+(\d+)\s*\/\s*(\d+)$/i);
  if (match) return `${leading}পৃষ্ঠা ${match[1]} / ${match[2]}${trailing}`;
  match = raw.trim().match(/^Could not open this PDF/i);
  if (match) return `${leading}এই PDF খোলা যায়নি। ফাইলটি নষ্ট হতে পারে অথবা পাসওয়ার্ড দিয়ে সুরক্ষিত থাকতে পারে।${trailing}`;
  match = raw.trim().match(/^Something went wrong while (rendering|saving)/i);
  if (match) return `${leading}${match[1].toLowerCase() === "rendering" ? "পৃষ্ঠা দেখাতে" : "PDF সংরক্ষণ করতে"} সমস্যা হয়েছে। আবার চেষ্টা করুন।${trailing}`;

  const fallback = baseL ? baseL(raw) : raw;
  if (fallback !== raw && /[\u0980-\u09FF]/.test(fallback)) return `${leading}${fallback}${trailing}`;
  return raw;
}

function EditPdfText({ children }: EditPdfTextProps) {
  const { locale, L } = useSohozI18n();
  if (typeof children !== "string") return <>{children}</>;
  return <>{translateEditPdfText(children, locale, L)}</>;
}

export default function EditPdf() {
    const { locale, L } = useSohozI18n();
    const EL = useCallback((value: string) => translateEditPdfText(value, locale, L), [locale, L]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showHowToUse, setShowHowToUse] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Editor state
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [tool, setTool] = useState<Tool>("select");
    const [penColor, setPenColor] = useState(PEN_COLORS[0]);
    const [annotations, setAnnotationsReact] = useState<Annotation[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // rendered PDF page
    const overlayRef = useRef<HTMLCanvasElement>(null);
    // committed annotations
    const previewRef = useRef<HTMLCanvasElement>(null);
    // live drag preview
    const pdfjsRef = useRef<any>(null);
    const annotationsRef = useRef<Annotation[]>([]);
    const pageDimsRef = useRef<Record<number, {
        width: number;
        height: number;
    }>>({});
    const isDrawingRef = useRef(false);
    const currentPathRef = useRef<{
        x: number;
        y: number;
    }[]>([]);
    const highlightStartRef = useRef<{
        x: number;
        y: number;
    } | null>(null);
    const lastLoadedFileRef = useRef<File | null>(null);
    const [textInputPos, setTextInputPos] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [textInputValue, setTextInputValue] = useState("");
    const textInputRef = useRef<HTMLInputElement>(null);
    const setAnnotations = useCallback((updater: (prev: Annotation[]) => Annotation[]) => {
        const next = updater(annotationsRef.current);
        annotationsRef.current = next;
        setAnnotationsReact(next);
    }, []);
    const redrawOverlay = useCallback((pageNum: number) => {
        const overlay = overlayRef.current;
        const ctx = overlay?.getContext("2d");
        if (!overlay || !ctx) {
            return;
        }
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        for (const ann of annotationsRef.current) {
            if (ann.page !== pageNum) {
                continue;
            }
            if (ann.type === "draw") {
                if (ann.points.length < 2) {
                    continue;
                }
                ctx.save();
                ctx.strokeStyle = ann.color;
                ctx.lineWidth = ann.lineWidth;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(ann.points[0].x, ann.points[0].y);
                for (let i = 1; i < ann.points.length; i++) {
                    ctx.lineTo(ann.points[i].x, ann.points[i].y);
                }
                ctx.stroke();
                ctx.restore();
            }
            else if (ann.type === "highlight") {
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = ann.color;
                ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
                ctx.restore();
            }
            else if (ann.type === "text") {
                ctx.save();
                ctx.fillStyle = ann.color;
                ctx.font = `${ann.fontSize}px sans-serif`;
                ctx.textBaseline = "alphabetic";
                ctx.fillText(ann.text, ann.x, ann.y);
                ctx.restore();
            }
        }
    }, []);
    // Load the pdf.js library once, on the client only, and point it at the
    // worker file via an asset URL so Next.js / Turbopack can bundle it
    // without trying to run it through SSR.
    const ensurePdfJs = useCallback(async () => {
        if (pdfjsRef.current) {
            return pdfjsRef.current;
        }
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        pdfjsRef.current = pdfjsLib;
        return pdfjsLib;
    }, []);
    useEffect(() => {
        ensurePdfJs().catch(() => {
            // Swallow here; a clearer error surfaces when the user opens the editor.
        });
    }, [ensurePdfJs]);
    const loadPdfIntoEditor = useCallback(async (file: File) => {
        setIsLoadingPdf(true);
        setError(null);
        try {
            const pdfjsLib = await ensurePdfJs();
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
            });
            const doc: PDFDocumentProxy = await loadingTask.promise;
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setCurrentPage(1);
            pageDimsRef.current = {};
            annotationsRef.current = [];
            setAnnotationsReact([]);
            lastLoadedFileRef.current = file;
        }
        catch (err) {
            console.error(err);
            setError("Could not open this PDF. It may be corrupted or password protected.");
        }
        finally {
            setIsLoadingPdf(false);
        }
    }, [ensurePdfJs]);
    // Render the current page onto the background canvas, size the overlay /
    // preview canvases to match, and redraw any annotations for that page.
    useEffect(() => {
        if (!pdfDoc || !isEditorOpen) {
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const page = await pdfDoc.getPage(currentPage);
                const viewport = page.getViewport({
                    scale: RENDER_SCALE,
                });
                const canvas = canvasRef.current;
                const overlay = overlayRef.current;
                const preview = previewRef.current;
                if (!canvas || !overlay || !preview) {
                    return;
                }
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                overlay.width = viewport.width;
                overlay.height = viewport.height;
                preview.width = viewport.width;
                preview.height = viewport.height;
                pageDimsRef.current[currentPage] = {
                    width: viewport.width,
                    height: viewport.height,
                };
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    return;
                }
                // FIX:
                // Current pdfjs-dist RenderParameters requires `canvas`.
                await page.render({
                    canvas,
                    canvasContext: ctx,
                    viewport,
                }).promise;
                if (cancelled) {
                    return;
                }
                redrawOverlay(currentPage);
            }
            catch (err) {
                if (!cancelled) {
                    console.error(err);
                    setError("Something went wrong while rendering this page.");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [pdfDoc, currentPage, isEditorOpen, redrawOverlay]);
    const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = previewRef.current;
        if (!canvas) {
            return {
                x: 0,
                y: 0,
            };
        }
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }, []);
    const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getPos(e);
        if (tool === "draw") {
            isDrawingRef.current = true;
            currentPathRef.current = [pos];
        }
        else if (tool === "highlight") {
            highlightStartRef.current = pos;
        }
        else if (tool === "text") {
            setTextInputValue("");
            setTextInputPos(pos);
            setTimeout(() => {
                textInputRef.current?.focus();
            }, 0);
        }
    }, [tool, getPos]);
    const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getPos(e);
        if (tool === "draw" && isDrawingRef.current) {
            const path = currentPathRef.current;
            const prev = path[path.length - 1];
            path.push(pos);
            const ctx = overlayRef.current?.getContext("2d");
            if (ctx && prev) {
                ctx.save();
                ctx.strokeStyle = penColor;
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                ctx.restore();
            }
        }
        else if (tool === "highlight" && highlightStartRef.current) {
            const start = highlightStartRef.current;
            const preview = previewRef.current;
            const ctx = preview?.getContext("2d");
            if (ctx && preview) {
                ctx.clearRect(0, 0, preview.width, preview.height);
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = HIGHLIGHT_COLOR;
                const x = Math.min(start.x, pos.x);
                const y = Math.min(start.y, pos.y);
                const w = Math.abs(pos.x - start.x);
                const h = Math.abs(pos.y - start.y);
                ctx.fillRect(x, y, w, h);
                ctx.restore();
            }
        }
    }, [tool, penColor, getPos]);
    const handlePointerUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getPos(e);
        if (tool === "draw" && isDrawingRef.current) {
            isDrawingRef.current = false;
            const points = currentPathRef.current;
            currentPathRef.current = [];
            if (points.length > 1) {
                setAnnotations((prev) => [
                    ...prev,
                    {
                        id: generateId(),
                        type: "draw",
                        page: currentPage,
                        points,
                        color: penColor,
                        lineWidth: 3,
                    },
                ]);
            }
        }
        else if (tool === "highlight" && highlightStartRef.current) {
            const start = highlightStartRef.current;
            highlightStartRef.current = null;
            const x = Math.min(start.x, pos.x);
            const y = Math.min(start.y, pos.y);
            const w = Math.abs(pos.x - start.x);
            const h = Math.abs(pos.y - start.y);
            const preview = previewRef.current;
            preview
                ?.getContext("2d")
                ?.clearRect(0, 0, preview.width, preview.height);
            if (w > 3 && h > 3) {
                const ctx = overlayRef.current?.getContext("2d");
                if (ctx) {
                    ctx.save();
                    ctx.globalAlpha = 0.35;
                    ctx.fillStyle = HIGHLIGHT_COLOR;
                    ctx.fillRect(x, y, w, h);
                    ctx.restore();
                }
                setAnnotations((prev) => [
                    ...prev,
                    {
                        id: generateId(),
                        type: "highlight",
                        page: currentPage,
                        x,
                        y,
                        width: w,
                        height: h,
                        color: HIGHLIGHT_COLOR,
                    },
                ]);
            }
        }
    }, [tool, penColor, currentPage, getPos, setAnnotations]);
    const commitTextAnnotation = useCallback(() => {
        if (textInputPos && textInputValue.trim()) {
            const fontSize = 18;
            const ctx = overlayRef.current?.getContext("2d");
            if (ctx) {
                ctx.save();
                ctx.fillStyle = penColor;
                ctx.font = `${fontSize}px sans-serif`;
                ctx.textBaseline = "alphabetic";
                ctx.fillText(textInputValue, textInputPos.x, textInputPos.y);
                ctx.restore();
            }
            setAnnotations((prev) => [
                ...prev,
                {
                    id: generateId(),
                    type: "text",
                    page: currentPage,
                    x: textInputPos.x,
                    y: textInputPos.y,
                    text: textInputValue,
                    fontSize,
                    color: penColor,
                },
            ]);
        }
        setTextInputPos(null);
        setTextInputValue("");
    }, [textInputPos, textInputValue, penColor, currentPage, setAnnotations]);
    const handleUndo = useCallback(() => {
        setAnnotations((prev) => prev.slice(0, -1));
        redrawOverlay(currentPage);
    }, [setAnnotations, redrawOverlay, currentPage]);
    const goToPage = useCallback((delta: number) => {
        setCurrentPage((p) => Math.min(Math.max(1, p + delta), numPages || 1));
    }, [numPages]);
    const handleExport = useCallback(async () => {
        if (!selectedFile) {
            return;
        }
        setIsExporting(true);
        setError(null);
        try {
            const existingBytes = await selectedFile.arrayBuffer();
            const pdfLibDoc = await PDFDocument.load(existingBytes);
            const pages = pdfLibDoc.getPages();
            const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);
            for (const ann of annotationsRef.current) {
                const page = pages[ann.page - 1];
                const dims = pageDimsRef.current[ann.page];
                if (!page || !dims) {
                    continue;
                }
                const { width: pdfWidth, height: pdfHeight } = page.getSize();
                const scaleX = pdfWidth / dims.width;
                const scaleY = pdfHeight / dims.height;
                if (ann.type === "text") {
                    page.drawText(ann.text, {
                        x: ann.x * scaleX,
                        y: pdfHeight - ann.y * scaleY,
                        size: ann.fontSize * scaleX,
                        font,
                        color: hexToRgbColor(ann.color),
                    });
                }
                else if (ann.type === "highlight") {
                    const rectX = ann.x * scaleX;
                    const rectWidth = ann.width * scaleX;
                    const rectHeight = ann.height * scaleY;
                    const rectYTop = pdfHeight - ann.y * scaleY;
                    page.drawRectangle({
                        x: rectX,
                        y: rectYTop - rectHeight,
                        width: rectWidth,
                        height: rectHeight,
                        color: hexToRgbColor(ann.color),
                        opacity: 0.35,
                    });
                }
                else if (ann.type === "draw") {
                    for (let i = 1; i < ann.points.length; i++) {
                        const p0 = ann.points[i - 1];
                        const p1 = ann.points[i];
                        page.drawLine({
                            start: {
                                x: p0.x * scaleX,
                                y: pdfHeight - p0.y * scaleY,
                            },
                            end: {
                                x: p1.x * scaleX,
                                y: pdfHeight - p1.y * scaleY,
                            },
                            thickness: Math.max(1, ann.lineWidth * scaleX),
                            color: hexToRgbColor(ann.color),
                        });
                    }
                }
            }
            const pdfBytes = await pdfLibDoc.save();
            // Keep the original functionality, but convert to a real
            // ArrayBuffer so newer TypeScript/lib.dom BlobPart typings
            // accept it safely.
            const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
            new Uint8Array(pdfBuffer).set(pdfBytes);
            const blob = new Blob([pdfBuffer], {
                type: "application/pdf",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = selectedFile.name.replace(/\.pdf$/i, "") + "-edited.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }
        catch (err) {
            console.error(err);
            setError("Something went wrong while saving your PDF. Please try again.");
        }
        finally {
            setIsExporting(false);
        }
    }, [selectedFile]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPdfDoc(null);
            setNumPages(0);
            setCurrentPage(1);
            annotationsRef.current = [];
            setAnnotationsReact([]);
            pageDimsRef.current = {};
            lastLoadedFileRef.current = null;
            setError(null);
        }
    };
    const handleReset = () => {
        setSelectedFile(null);
        setPdfDoc(null);
        setNumPages(0);
        setCurrentPage(1);
        annotationsRef.current = [];
        setAnnotationsReact([]);
        pageDimsRef.current = {};
        lastLoadedFileRef.current = null;
        setIsEditorOpen(false);
        setError(null);
    };
    const handleOpenEditor = async () => {
        if (!selectedFile) {
            return;
        }
        setIsEditorOpen(true);
        if (lastLoadedFileRef.current !== selectedFile) {
            await loadPdfIntoEditor(selectedFile);
        }
    };
    return (<div className="relative w-full">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE]" />
      <div className="sohoj-edit-pdf page-font relative w-full space-y-5 text-[#3B2F1E]">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-[#7A6A50]">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#3B2F1E] transition-colors">
          <ArrowLeft size={14}/>

          <span><EditPdfText>{"Back to Tools"}</EditPdfText></span>
        </Link>

        <span><EditPdfText>{"/"}</EditPdfText></span>

        <span><EditPdfText>{"PDF Tools"}</EditPdfText></span>

        <span><EditPdfText>{"/"}</EditPdfText></span>

        <span className="font-semibold text-[#3B2F1E]"><EditPdfText>{"Edit PDF"}</EditPdfText></span>
      </div>

      {/* Header Card */}
      <div className="bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#F6EEDB] text-[#DC2626] rounded-xl flex items-center justify-center shrink-0 border border-[#E3D6B8]">
            <Pencil size={24}/>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#3B2F1E]"><EditPdfText>{"Edit PDF"}</EditPdfText></h1>

              <span className="bg-[#F6EEDB] text-[#5A4A32] text-[12px] font-bold px-2 py-0.5 rounded-full border border-[#E3D6B8]"><EditPdfText>{"Free\n              "}</EditPdfText></span>
            </div>

            <p className="text-sm text-[#7A6A50] font-medium mt-0.5"><EditPdfText>{"Open any PDF in a full-screen editor \u2014 add or edit text, draw,\n              highlight, sign, stamp, insert images and rearrange pages.\n            "}</EditPdfText></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button aria-label={EL("Add to favorites")} title={EL("Add to favorites")} className="p-2 text-[#7A6A50] hover:text-[#B91C1C] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8]">
            <Star size={16}/>
          </button>

          <button aria-label={EL("Share this tool")} title={EL("Share this tool")} className="p-2 text-[#7A6A50] hover:text-[#B91C1C] bg-[#F6EEDB] hover:bg-[#EFE3C8] rounded-xl transition-all border border-[#E3D6B8]">
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Upload Box */}
        <div className="lg:col-span-4 bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#3B2F1E]"><EditPdfText>{"Files ("}</EditPdfText>{selectedFile ? 1 : 0}<EditPdfText>{")\n              "}</EditPdfText></h2>

              <label className="inline-flex items-center gap-1 text-[13px] font-bold text-[#DC2626] bg-[#F6EEDB] hover:bg-[#EFE3C8] px-2 py-0.5 rounded-md cursor-pointer transition-colors border border-[#E3D6B8]">
                <Plus size={12}/>

                <span><EditPdfText>{"Add"}</EditPdfText></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>
            </div>

            {!selectedFile ? (<label className="border border-dashed border-[#DC2626] bg-[#F6EEDB]/20 hover:bg-[#EFE3C8]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[220px]">
                <div className="w-10 h-10 bg-[#F3E9D2]/80 text-[#DC2626] rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload size={20}/>
                </div>

                <span className="text-sm font-bold text-[#3B2F1E]"><EditPdfText>{"Drop a PDF here or click to upload\n                "}</EditPdfText></span>

                <span className="text-[12px] text-[#7A6A50] font-medium mt-1"><EditPdfText>{"1 PDF file, max 300 MB\n                "}</EditPdfText></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>) : (<div className="bg-[#F6EEDB] border border-[#E3D6B8] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 bg-[#F3E9D2] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16}/>
                  </div>

                  <div className="truncate">
                    <p className="text-sm font-bold text-[#3B2F1E] truncate">
                      {selectedFile.name}
                    </p>

                    <p className="text-[12px] text-[#7A6A50]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)}<EditPdfText>{"MB\n                    "}</EditPdfText></p>
                  </div>
                </div>

                <button onClick={handleReset} aria-label={EL("Remove PDF")} title={EL("Remove PDF")} className="p-1 text-[#7A6A50] hover:text-[#B91C1C] rounded-lg transition-colors">
                  <X size={16}/>
                </button>
              </div>)}
          </div>
        </div>

        {/* Right Side: Preview Box */}
        <div className="lg:col-span-8 bg-[#FBF6E8] p-5 rounded-2xl border border-[#E3D6B8] shadow-xs flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#3B2F1E]"><EditPdfText>{"Preview"}</EditPdfText></h2>

            <span className="bg-[#F3E9D2] text-[#7A6A50] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
              {selectedFile ? <EditPdfText>{"Ready"}</EditPdfText> : <EditPdfText>{"Empty"}</EditPdfText>}
            </span>
          </div>

          {/* Empty Preview Placeholder */}
          <div className="bg-[#F6EEDB]/60 rounded-2xl border border-dashed border-[#E3D6B8] p-8 flex flex-col items-center justify-center my-auto text-center py-20">
            <div className="w-10 h-10 bg-[#F6EEDB] text-[#DC2626] rounded-xl flex items-center justify-center mb-3 border border-[#E3D6B8]">
              <FileText size={20}/>
            </div>

            <p className="text-sm font-bold text-[#3B2F1E]">
              {selectedFile
        ? <EditPdfText>{"Ready to open in the editor"}</EditPdfText> : <EditPdfText>{"Add files to get started"}</EditPdfText>}
            </p>

            <p className="text-[13px] text-[#7A6A50] mt-1">
              {selectedFile
        ? <EditPdfText>{'Click "Open editor" below to add text, drawings and highlights.'}</EditPdfText> : <EditPdfText>{"Your result will appear here after you run the tool."}</EditPdfText>}
            </p>
          </div>

          <div />
        </div>
      </div>

      {/* Error banner */}
      {error && (<div className="bg-red-50 border border-red-100 p-3 rounded-2xl flex items-center gap-2 text-sm text-red-700 font-medium">
          <AlertCircle size={15} className="text-red-500 shrink-0"/>

          <span>{EL(error)}</span>
        </div>)}

      {/* Bottom Action Controls Bar */}
      <div className="bg-[#FBF6E8] p-3.5 rounded-2xl border border-[#E3D6B8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#7A6A50]">
          <span className="w-2 h-2 rounded-full bg-[#B0A080] shrink-0"/>

          <span>
            {selectedFile
        ? <EditPdfText>{`Ready to edit: ${selectedFile.name}`}</EditPdfText> : <EditPdfText>{"Add an input to get started"}</EditPdfText>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-4 py-2 border border-[#E3D6B8] text-[#3B2F1E] text-sm font-bold rounded-xl hover:bg-[#EFE3C8] transition-all"><EditPdfText>{"Reset\n          "}</EditPdfText></button>

          <button onClick={handleOpenEditor} disabled={!selectedFile} className={`px-5 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all ${selectedFile
            ? "bg-[#D42020] text-white shadow-xs hover:bg-[#AE1717]"
            : "bg-[#F3E9D2] text-[#7A6A50] cursor-not-allowed"}`}>
            <Pencil size={14}/>

            <span><EditPdfText>{"Open editor"}</EditPdfText></span>
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2 text-sm text-emerald-800 font-medium">
        <Lock size={15} className="text-emerald-600 shrink-0"/>

        <span><EditPdfText>{"Your files are processed in the browser \u2014 they are not uploaded to any\n          server.\n        "}</EditPdfText></span>
      </div>

      {/* How to use Section */}
      <div className="bg-[#FBF6E8] rounded-2xl border border-[#E3D6B8] shadow-xs overflow-hidden">
        <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-bold text-[#3B2F1E] hover:bg-[#EFE3C8] transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[#DC2626] font-bold"><EditPdfText>{"?"}</EditPdfText></span>

            <span><EditPdfText>{"How to use"}</EditPdfText></span>
          </div>

          {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {showHowToUse && (<div className="px-5 pb-4 text-sm text-[#7A6A50] leading-relaxed border-t border-[#E3D6B8]/70 pt-3"><EditPdfText>{"Upload your PDF, click \"Open editor\" to open the interactive editor,\n            add text, shapes, or signatures, and save your edited document.\n          "}</EditPdfText></div>)}
      </div>

      {/* Same Category Tools */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-[#3B2F1E]"><EditPdfText>{"Tools in the same category\n        "}</EditPdfText></h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/compress-pdf" className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#E3D6B8] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16}/>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#B91C1C] transition-colors"><EditPdfText>{"Compress PDF\n              "}</EditPdfText></h4>

              <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-1"><EditPdfText>{"Shrink embedded photos and scans inside a PDF \u2014 text stays\n                sharp.\n              "}</EditPdfText></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/merge-pdfs" className="bg-[#FBF6E8] p-4 rounded-2xl border border-[#E3D6B8] shadow-xs hover:border-[#E3D6B8] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16}/>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#3B2F1E] group-hover:text-[#B91C1C] transition-colors"><EditPdfText>{"Merge PDFs\n              "}</EditPdfText></h4>

              <p className="text-[12px] text-[#7A6A50] mt-0.5 line-clamp-1"><EditPdfText>{"Combine multiple PDF files into one document in your chosen\n                order.\n              "}</EditPdfText></p>
            </div>
          </Link>
        </div>
      </div>

      {/* Full-screen Editor */}
      {isEditorOpen && (<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#F2E8D2] w-full h-full max-w-6xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-[#E3D6B8]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#E3D6B8] shrink-0">
              <div className="flex items-center gap-2 mr-2">
                <div className="w-8 h-8 bg-[#F6EEDB] text-[#DC2626] rounded-lg flex items-center justify-center">
                  <Pencil size={16}/>
                </div>

                <span className="text-sm font-bold text-[#3B2F1E] truncate max-w-[160px]">
                  {selectedFile?.name}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-[#F6EEDB] border border-[#E3D6B8] rounded-xl p-1">
                <button onClick={() => setTool("select")} title={EL("Select / pan")} className={`p-2 rounded-lg transition-all ${tool === "select"
                ? "bg-[#FBF6E8] shadow-xs text-[#DC2626] border border-[#E3D6B8]"
                : "text-[#7A6A50] hover:text-[#3B2F1E]"}`}>
                  <MousePointer2 size={16}/>
                </button>

                <button onClick={() => setTool("text")} title={EL("Add text")} className={`p-2 rounded-lg transition-all ${tool === "text"
                ? "bg-[#FBF6E8] shadow-xs text-[#DC2626] border border-[#E3D6B8]"
                : "text-[#7A6A50] hover:text-[#3B2F1E]"}`}>
                  <Type size={16}/>
                </button>

                <button onClick={() => setTool("draw")} title={EL("Draw / sign")} className={`p-2 rounded-lg transition-all ${tool === "draw"
                ? "bg-[#FBF6E8] shadow-xs text-[#DC2626] border border-[#E3D6B8]"
                : "text-[#7A6A50] hover:text-[#3B2F1E]"}`}>
                  <PenTool size={16}/>
                </button>

                <button onClick={() => setTool("highlight")} title={EL("Highlight")} className={`p-2 rounded-lg transition-all ${tool === "highlight"
                ? "bg-[#FBF6E8] shadow-xs text-[#DC2626] border border-[#E3D6B8]"
                : "text-[#7A6A50] hover:text-[#3B2F1E]"}`}>
                  <Highlighter size={16}/>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {PEN_COLORS.map((c) => (<button key={c} onClick={() => setPenColor(c)} title={c} className={`w-5 h-5 rounded-full border-2 transition-all ${penColor === c
                    ? "border-[#5A4A32] scale-110"
                    : "border-white"}`} style={{
                    backgroundColor: c,
                }}/>))}
              </div>

              <button onClick={handleUndo} disabled={annotations.length === 0} title={EL("Undo last action")} className={`p-2 rounded-lg transition-all ${annotations.length === 0
                ? "text-[#B0A080] cursor-not-allowed"
                : "text-[#7A6A50] hover:bg-[#EFE3C8]"}`}>
                <Undo2 size={16}/>
              </button>

              <div className="flex-1"/>

              {numPages > 0 && (<div className="flex items-center gap-2 text-sm font-bold text-[#5A4A32]">
                  <button onClick={() => goToPage(-1)} disabled={currentPage <= 1} className={`p-1.5 rounded-lg ${currentPage <= 1
                    ? "text-[#B0A080] cursor-not-allowed"
                    : "text-[#7A6A50] hover:bg-[#EFE3C8]"}`}>
                    <ChevronLeft size={16}/>
                  </button>

                  <span><EditPdfText>{"Page "}</EditPdfText>{currentPage}<EditPdfText>{"/ "}</EditPdfText>{numPages}
                  </span>

                  <button onClick={() => goToPage(1)} disabled={currentPage >= numPages} className={`p-1.5 rounded-lg ${currentPage >= numPages
                    ? "text-[#B0A080] cursor-not-allowed"
                    : "text-[#7A6A50] hover:bg-[#EFE3C8]"}`}>
                    <ChevronRight size={16}/>
                  </button>
                </div>)}

              <button onClick={handleExport} disabled={!pdfDoc || isExporting} className={`ml-2 px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all ${!pdfDoc || isExporting
                ? "bg-[#F3E9D2] text-[#7A6A50] cursor-not-allowed"
                : "bg-[#D42020] text-white shadow-xs hover:bg-[#AE1717]"}`}>
                {isExporting ? (<Loader2 size={14} className="animate-spin"/>) : (<Download size={14}/>)}

                <span>{isExporting ? <EditPdfText>{"Saving..."}</EditPdfText> : <EditPdfText>{"Save & Download"}</EditPdfText>}</span>
              </button>

              <button onClick={() => setIsEditorOpen(false)} aria-label={EL("Close editor")} title={EL("Close editor")} className="p-2 text-[#7A6A50] hover:text-[#3B2F1E] rounded-lg transition-colors">
                <X size={18}/>
              </button>
            </div>

            {error && (<div className="mx-4 mt-3 bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center gap-2 text-sm text-red-700 font-medium shrink-0">
                <AlertCircle size={14} className="text-red-500 shrink-0"/>

                <span>{EL(error)}</span>
              </div>)}

            {/* Canvas area */}
            <div className="scroll flex-1 overflow-auto bg-[#F3E9D2] flex items-start justify-center p-6">
              {isLoadingPdf ? (<div className="flex flex-col items-center justify-center gap-2 text-[#7A6A50] mt-20">
                  <Loader2 size={28} className="animate-spin"/>

                  <span className="text-sm font-bold"><EditPdfText>{"Loading PDF\u2026"}</EditPdfText></span>
                </div>) : (<div className="relative shadow-lg bg-white" style={{
                    lineHeight: 0,
                }}>
                  <canvas ref={canvasRef} className="block"/>

                  <canvas ref={overlayRef} className="absolute inset-0 block"/>

                  <canvas ref={previewRef} className="absolute inset-0 block" style={{
                    cursor: tool === "text"
                        ? "text"
                        : tool === "select"
                            ? "default"
                            : "crosshair",
                }} onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}/>

                  {textInputPos && (<input ref={textInputRef} value={textInputValue} onChange={(e) => setTextInputValue(e.target.value)} onBlur={commitTextAnnotation} onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            commitTextAnnotation();
                        }
                        else if (e.key === "Escape") {
                            setTextInputPos(null);
                            setTextInputValue("");
                        }
                    }} className="absolute px-1 text-[18px] leading-none bg-[#FBF6E8]/90 border border-[#DC2626] rounded outline-none pdf-annotation-input" style={{
                        left: textInputPos.x,
                        top: textInputPos.y - 18,
                        color: penColor,
                    }}/>)}
                </div>)}
            </div>
          </div>
        </div>)}
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .sohoj-edit-pdf.page-font,
        .sohoj-edit-pdf.page-font *:not(.font-mono):not(svg):not(svg *):not(.pdf-annotation-input) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .sohoj-edit-pdf h1,
        .sohoj-edit-pdf h2,
        .sohoj-edit-pdf h3,
        .sohoj-edit-pdf h4 {
          letter-spacing: -0.01em;
        }

        .sohoj-edit-pdf button,
        .sohoj-edit-pdf a,
        .sohoj-edit-pdf label {
          transition-property: color, background-color, border-color, box-shadow, transform;
          transition-duration: 180ms;
        }

        .sohoj-edit-pdf button:focus-visible,
        .sohoj-edit-pdf a:focus-visible,
        .sohoj-edit-pdf label:focus-within {
          outline: 2px solid #DC2626;
          outline-offset: 2px;
        }

        .sohoj-edit-pdf button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .sohoj-edit-pdf button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .sohoj-edit-pdf input:not([type="file"]):not(.pdf-annotation-input) {
          min-height: 42px;
          background-color: #FBF6E8;
          border-color: #E3D6B8;
          color: #3B2F1E;
          font-size: 15px;
        }

        .sohoj-edit-pdf input:not(.pdf-annotation-input)::placeholder {
          color: #B0A080;
        }

        .sohoj-edit-pdf .pdf-annotation-input {
          font-family: sans-serif;
          font-size: 18px;
          line-height: 1;
          min-height: 0;
        }

        .sohoj-edit-pdf .scroll {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }

        .sohoj-edit-pdf .scroll::-webkit-scrollbar {
          width: 12px;
        }

        .sohoj-edit-pdf .scroll::-webkit-scrollbar-track {
          background: rgba(148, 113, 67, 0.12);
          border-radius: 999px;
          margin: 10px 0;
        }

        .sohoj-edit-pdf .scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #F87171, #DC2626);
          border-radius: 999px;
          border: 3px solid #F2E8D2;
          min-height: 48px;
        }

        .sohoj-edit-pdf .scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #EF4444, #B91C1C);
        }
      `}</style>
    </div>);
}