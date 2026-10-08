"use client";
import { T, useSohozI18n, L } from "@/app/sohoj-tools/_i18n";
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
export default function EditPdf() {
    const { L } = useSohozI18n();
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
    return (<div className="w-full space-y-5 text-[#0F172A] font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/sohoj-tools" className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
          <ArrowLeft size={14}/>

          <span><T>{"Back to Tools"}</T></span>
        </Link>

        <span><T>{"/"}</T></span>

        <span><T>{"PDF Tools"}</T></span>

        <span><T>{"/"}</T></span>

        <span className="font-semibold text-[#0F172A]"><T>{"Edit PDF"}</T></span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#F8FAFC] text-[#2563EB] rounded-xl flex items-center justify-center shrink-0 border border-[#E2E8F0]">
            <Pencil size={24}/>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]"><T>{"Edit PDF"}</T></h1>

              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full"><T>{"Free\n              "}</T></span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-0.5"><T>{"Open any PDF in a full-screen editor \u2014 add or edit text, draw,\n              highlight, sign, stamp, insert images and rearrange pages.\n            "}</T></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Star size={16}/>
          </button>

          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Share2 size={16}/>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Upload Box */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-[#0F172A]"><T>{"Files ("}</T>{selectedFile ? 1 : 0}<T>{")\n              "}</T></h2>

              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] bg-[#F8FAFC] hover:bg-[#E2E8F0] px-2 py-0.5 rounded-md cursor-pointer transition-colors border border-[#E2E8F0]">
                <Plus size={12}/>

                <span><T>{"Add"}</T></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>
            </div>

            {!selectedFile ? (<label className="border border-dashed border-[#2563EB] bg-[#F8FAFC]/20 hover:bg-[#F8FAFC]/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[220px]">
                <div className="w-10 h-10 bg-[#E2E8F0]/80 text-[#2563EB] rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload size={20}/>
                </div>

                <span className="text-xs font-bold text-[#0F172A]"><T>{"Drop a PDF here or click to upload\n                "}</T></span>

                <span className="text-[10px] text-gray-400 font-medium mt-1"><T>{"1 PDF file, max 300 MB\n                "}</T></span>

                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden"/>
              </label>) : (<div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 bg-[#E2E8F0] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16}/>
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)}<T>{"MB\n                    "}</T></p>
                  </div>
                </div>

                <button onClick={handleReset} className="p-1 text-gray-400 hover:text-[#2563EB] rounded-lg transition-colors">
                  <X size={16}/>
                </button>
              </div>)}
          </div>
        </div>

        {/* Right Side: Preview Box */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0F172A]"><T>{"Preview"}</T></h2>

            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {selectedFile ? <T>{"Ready"}</T> : <T>{"Empty"}</T>}
            </span>
          </div>

          {/* Empty Preview Placeholder */}
          <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-20">
            <div className="w-10 h-10 bg-[#F8FAFC] text-[#2563EB] rounded-xl flex items-center justify-center mb-3 border border-[#E2E8F0]">
              <FileText size={20}/>
            </div>

            <p className="text-xs font-bold text-[#0F172A]">
              {selectedFile
        ? <T>{"Ready to open in the editor"}</T> : <T>{"Add files to get started"}</T>}
            </p>

            <p className="text-[11px] text-gray-400 mt-1">
              {selectedFile
        ? <T>{'Click "Open editor" below to add text, drawings and highlights.'}</T> : <T>{"Your result will appear here after you run the tool."}</T>}
            </p>
          </div>

          <div />
        </div>
      </div>

      {/* Error banner */}
      {error && (<div className="bg-red-50 border border-red-100 p-3 rounded-2xl flex items-center gap-2 text-xs text-red-700 font-medium">
          <AlertCircle size={15} className="text-red-500 shrink-0"/>

          <span>{error}</span>
        </div>)}

      {/* Bottom Action Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0"/>

          <span>
            {selectedFile
        ? <T>{`Ready to edit: ${selectedFile.name}`}</T> : <T>{"Add an input to get started"}</T>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-4 py-2 border border-gray-200 text-[#0F172A] text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"><T>{"Reset\n          "}</T></button>

          <button onClick={handleOpenEditor} disabled={!selectedFile} className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${selectedFile
            ? "bg-[#2563EB] text-white shadow-xs hover:bg-[#2563EB]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            <Pencil size={14}/>

            <span><T>{"Open editor"}</T></span>
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
        <Lock size={15} className="text-emerald-600 shrink-0"/>

        <span><T>{"Your files are processed in the browser \u2014 they are not uploaded to any\n          server.\n        "}</T></span>
      </div>

      {/* How to use Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#0F172A] hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[#2563EB] font-bold"><T>{"?"}</T></span>

            <span><T>{"How to use"}</T></span>
          </div>

          {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {showHowToUse && (<div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3"><T>{"Upload your PDF, click \"Open editor\" to open the interactive editor,\n            add text, shapes, or signatures, and save your edited document.\n          "}</T></div>)}
      </div>

      {/* Same Category Tools */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]"><T>{"Tools in the same category\n        "}</T></h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/sohoj-tools/compress-pdf" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><T>{"Compress PDF\n              "}</T></h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1"><T>{"Shrink embedded photos and scans inside a PDF \u2014 text stays\n                sharp.\n              "}</T></p>
            </div>
          </Link>

          <Link href="/sohoj-tools/merge-pdfs" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-[#E2E8F0] transition-all flex items-start gap-3 group">
            <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16}/>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"><T>{"Merge PDFs\n              "}</T></h4>

              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1"><T>{"Combine multiple PDF files into one document in your chosen\n                order.\n              "}</T></p>
            </div>
          </Link>
        </div>
      </div>

      {/* Full-screen Editor */}
      {isEditorOpen && (<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full h-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2 mr-2">
                <div className="w-8 h-8 bg-[#F8FAFC] text-[#2563EB] rounded-lg flex items-center justify-center">
                  <Pencil size={16}/>
                </div>

                <span className="text-xs font-bold text-[#0F172A] truncate max-w-[160px]">
                  {selectedFile?.name}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
                <button onClick={() => setTool("select")} title={L("Select / pan")} className={`p-2 rounded-lg transition-all ${tool === "select"
                ? "bg-white shadow-xs text-[#2563EB] border border-[#E2E8F0]"
                : "text-gray-400 hover:text-[#0F172A]"}`}>
                  <MousePointer2 size={16}/>
                </button>

                <button onClick={() => setTool("text")} title={L("Add text")} className={`p-2 rounded-lg transition-all ${tool === "text"
                ? "bg-white shadow-xs text-[#2563EB] border border-[#E2E8F0]"
                : "text-gray-400 hover:text-[#0F172A]"}`}>
                  <Type size={16}/>
                </button>

                <button onClick={() => setTool("draw")} title={L("Draw / sign")} className={`p-2 rounded-lg transition-all ${tool === "draw"
                ? "bg-white shadow-xs text-[#2563EB] border border-[#E2E8F0]"
                : "text-gray-400 hover:text-[#0F172A]"}`}>
                  <PenTool size={16}/>
                </button>

                <button onClick={() => setTool("highlight")} title={L("Highlight")} className={`p-2 rounded-lg transition-all ${tool === "highlight"
                ? "bg-white shadow-xs text-[#2563EB] border border-[#E2E8F0]"
                : "text-gray-400 hover:text-[#0F172A]"}`}>
                  <Highlighter size={16}/>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {PEN_COLORS.map((c) => (<button key={c} onClick={() => setPenColor(c)} title={c} className={`w-5 h-5 rounded-full border-2 transition-all ${penColor === c
                    ? "border-gray-700 scale-110"
                    : "border-white"}`} style={{
                    backgroundColor: c,
                }}/>))}
              </div>

              <button onClick={handleUndo} disabled={annotations.length === 0} title={L("Undo last action")} className={`p-2 rounded-lg transition-all ${annotations.length === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"}`}>
                <Undo2 size={16}/>
              </button>

              <div className="flex-1"/>

              {numPages > 0 && (<div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <button onClick={() => goToPage(-1)} disabled={currentPage <= 1} className={`p-1.5 rounded-lg ${currentPage <= 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50"}`}>
                    <ChevronLeft size={16}/>
                  </button>

                  <span><T>{"Page "}</T>{currentPage}<T>{"/ "}</T>{numPages}
                  </span>

                  <button onClick={() => goToPage(1)} disabled={currentPage >= numPages} className={`p-1.5 rounded-lg ${currentPage >= numPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50"}`}>
                    <ChevronRight size={16}/>
                  </button>
                </div>)}

              <button onClick={handleExport} disabled={!pdfDoc || isExporting} className={`ml-2 px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${!pdfDoc || isExporting
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#2563EB] text-white shadow-xs hover:bg-[#2563EB]"}`}>
                {isExporting ? (<Loader2 size={14} className="animate-spin"/>) : (<Download size={14}/>)}

                <span>{isExporting ? <T>{"Saving..."}</T> : <T>{"Save & Download"}</T>}</span>
              </button>

              <button onClick={() => setIsEditorOpen(false)} className="p-2 text-gray-400 hover:text-[#0F172A] rounded-lg transition-colors">
                <X size={18}/>
              </button>
            </div>

            {error && (<div className="mx-4 mt-3 bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium shrink-0">
                <AlertCircle size={14} className="text-red-500 shrink-0"/>

                <span>{error}</span>
              </div>)}

            {/* Canvas area */}
            <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-6">
              {isLoadingPdf ? (<div className="flex flex-col items-center justify-center gap-2 text-gray-400 mt-20">
                  <Loader2 size={28} className="animate-spin"/>

                  <span className="text-xs font-bold"><T>{"Loading PDF\u2026"}</T></span>
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
                    }} className="absolute px-1 text-[18px] leading-none bg-white/90 border border-[#2563EB] rounded outline-none" style={{
                        left: textInputPos.x,
                        top: textInputPos.y - 18,
                        color: penColor,
                    }}/>)}
                </div>)}
            </div>
          </div>
        </div>)}
    </div>);
}
