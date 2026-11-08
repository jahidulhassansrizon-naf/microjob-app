"use client";
import { T } from "../i18n";
import type { PaperRenderRequest, PrintPageVariant } from "../types/question";
import type { QuestionManager } from "../hooks/useQuestionManager";
import { ArrowLeft, FileText, GripVertical, Hand, Maximize2, Move, RotateCcw, SquareDashedMousePointer, X, ZoomIn, ZoomOut, } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
/** Natural width of two A5 sheets side by side (2 x 520px + gap), used to scale the Joint preview to fit. */
const JOINT_NATURAL_WIDTH = 1050;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const clampZoom = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
const TEXT_SCALE_MIN = 50;
const TEXT_SCALE_MAX = 300;
const escapeAttr = (value: string) => value.replace(/["\\]/g, "\\$&");
const isTypingTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el || !el.tagName) {
        return false;
    }
    return (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable);
};
type PrintDuplexLayoutProps = {
    manager: QuestionManager;
    renderPaper: (request: PaperRenderRequest) => ReactNode;
    /** When true, the screen-only tool bars (region select, joint controls, drag hint) are rendered elsewhere. */
    hideTools?: boolean;
};
function copyInputValuesToClone(source: HTMLElement, clone: HTMLElement) {
    const sourceFields = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select");
    const targetFields = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select");
    sourceFields.forEach((sourceField, index) => {
        const targetField = targetFields[index];
        if (!targetField) {
            return;
        }
        if (sourceField instanceof HTMLInputElement) {
            if (targetField instanceof HTMLInputElement) {
                if (sourceField.type === "checkbox" || sourceField.type === "radio") {
                    targetField.checked = sourceField.checked;
                    if (sourceField.checked) {
                        targetField.setAttribute("checked", "checked");
                    }
                    else {
                        targetField.removeAttribute("checked");
                    }
                }
                targetField.value = sourceField.value;
                targetField.setAttribute("value", sourceField.value);
            }
        }
        else if (sourceField instanceof HTMLTextAreaElement &&
            targetField instanceof HTMLTextAreaElement) {
            targetField.value = sourceField.value;
            targetField.textContent = sourceField.value;
        }
        else if (sourceField instanceof HTMLSelectElement &&
            targetField instanceof HTMLSelectElement) {
            targetField.value = sourceField.value;
        }
        targetField.setAttribute("readonly", "readonly");
    });
}
function waitForImages(documentElement: Document): Promise<void> {
    const images = Array.from(documentElement.images);
    if (!images.length) {
        return Promise.resolve();
    }
    return Promise.all(images.map((image) => new Promise<void>((resolve) => {
        if (image.complete) {
            resolve();
            return;
        }
        let settled = false;
        const finish = () => {
            if (settled) {
                return;
            }
            settled = true;
            resolve();
        };
        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
        window.setTimeout(finish, 4000);
    }))).then(() => undefined);
}
function waitForStylesheets(documentElement: Document): Promise<void> {
    const links = Array.from(documentElement.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
    const pending = links.filter((link) => !link.sheet);
    if (!pending.length) {
        return Promise.resolve();
    }
    return Promise.all(pending.map((link) => new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
            if (settled) {
                return;
            }
            settled = true;
            resolve();
        };
        link.addEventListener("load", finish, { once: true });
        link.addEventListener("error", finish, { once: true });
        window.setTimeout(finish, 6000);
    }))).then(() => undefined);
}
export async function waitForPrintIframeReady(iframe: HTMLIFrameElement) {
    const printDocument = iframe.contentDocument;
    const printWindow = iframe.contentWindow;
    if (!printDocument || !printWindow) {
        throw new Error("Print frame is not available.");
    }
    // 1) The cloned <link> stylesheets must be applied before layout, otherwise
    //    the printout can come out unstyled.
    await waitForStylesheets(printDocument);
    // 2) Let the browser lay the content out once so it discovers which font
    //    faces are really needed, then wait for those fonts to finish loading.
    await new Promise<void>((resolve) => {
        printWindow.requestAnimationFrame(() => resolve());
    });
    try {
        if (printDocument.fonts?.ready) {
            await Promise.race([
                printDocument.fonts.ready,
                new Promise<void>((resolve) => window.setTimeout(resolve, 6000)),
            ]);
        }
    }
    catch {
        // Continue if the browser does not expose the iframe font promise.
    }
    await waitForImages(printDocument);
    await new Promise<void>((resolve) => {
        printWindow.requestAnimationFrame(() => {
            printWindow.requestAnimationFrame(() => resolve());
        });
    });
    printDocument
        .querySelectorAll("[data-math-rendered='true']")
        .forEach((node) => void (node as HTMLElement).offsetHeight);
    await new Promise<void>((resolve) => {
        printWindow.requestAnimationFrame(() => resolve());
    });
}
export async function printPaperInIsolatedIframe(sourceRoot: HTMLElement, variant: PrintPageVariant, cleanupRef: {
    current: HTMLIFrameElement | null;
}) {
    cleanupRef.current?.remove();
    cleanupRef.current = null;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
        position: "fixed",
        left: "-100000px",
        top: "0",
        width: "1px",
        height: "1px",
        border: "0",
        opacity: "0",
        pointerEvents: "none",
    });
    document.body.appendChild(iframe);
    cleanupRef.current = iframe;
    const printDocument = iframe.contentDocument;
    if (!printDocument) {
        iframe.remove();
        cleanupRef.current = null;
        throw new Error("Could not create print document.");
    }
    printDocument.open();
    printDocument.write("<!doctype html><html><head><meta charset='utf-8'><title>Question Paper</title></head><body></body></html>");
    printDocument.close();
    printDocument.title = document.title || "Question Paper";
    const head = printDocument.head;
    Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style')).forEach((styleNode) => head.appendChild(styleNode.cloneNode(true)));
    const printStyle = printDocument.createElement("style");
    printStyle.textContent = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color: #0F172A !important;
      font-family: "Noto Sans Bengali", "Noto Serif Bengali", "SolaimanLipi", Arial, sans-serif !important;
    }

    /*
     * A4/A5 papers flow across as many pages as needed. The page margin is
     * provided by @page (not by padding on the sheet) so that the 2nd, 3rd...
     * page keep the same margin and no question is ever clipped.
     */
    @page isolated-a4 {
      size: A4 portrait;
      margin: 10mm;
    }

    @page isolated-a5 {
      size: A5 portrait;
      margin: 8mm;
    }

    @page isolated-joint {
      size: A4 landscape;
      margin: 0;
    }

    body.print-frame-a4 {
      page: isolated-a4;
    }

    body.print-frame-a5 {
      page: isolated-a5;
    }

    body.print-frame-joint {
      page: isolated-joint;
    }

    .print-frame-root,
    .print-frame-root > * {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
    }

    .print-frame-a4 .print-frame-sheet {
      box-sizing: border-box !important;
      width: 190mm !important;
      min-width: 190mm !important;
      max-width: 190mm !important;
      height: auto !important;
      min-height: 276mm !important;
      padding: 0 !important;
      overflow: visible !important;
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    .print-frame-a5 .print-frame-sheet {
      box-sizing: border-box !important;
      width: 132mm !important;
      min-width: 132mm !important;
      max-width: 132mm !important;
      height: auto !important;
      min-height: 193mm !important;
      padding: 0 !important;
      overflow: visible !important;
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    .print-frame-a4 .print-frame-sheet .paper-sheet-content {
      height: auto !important;
      min-height: 276mm !important;
      max-height: none !important;
      overflow: visible !important;
    }

    .print-frame-a5 .print-frame-sheet .paper-sheet-content {
      height: auto !important;
      min-height: 193mm !important;
      max-height: none !important;
      overflow: visible !important;
    }

    /* Never clip the question area in A4/A5 print: let it flow to the next page. */
    .print-frame-a4 [data-paper-question-area],
    .print-frame-a5 [data-paper-question-area] {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }

    /* A section heading must never be left alone at the bottom of a page. */
    .paper-question-section-heading {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    /* Strip the on-screen preview frame (border/rounding/scroll box) from the print root. */
    .print-frame-root .paper-print-root {
      width: 100% !important;
      height: auto !important;
      max-height: none !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    /* On-screen zoom wrappers must never leak into the printout. */
    .print-frame-root .paper-zoom-outer,
    .print-frame-root .paper-zoom-inner {
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      transform: none !important;
    }

    .print-frame-root .paper-center-wrap,
    .print-frame-root [data-paper-fabric-wrapper] {
      display: block !important;
      width: 100% !important;
      margin: 0 !important;
    }

    .print-frame-joint .print-frame-root {
      width: 296mm !important;
      min-width: 296mm !important;
      display: block !important;
    }

    .print-frame-joint .print-frame-sheet-wrap {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      width: 296mm !important;
      min-width: 296mm !important;
      height: 209.5mm !important;
      min-height: 209.5mm !important;
      max-height: 209.5mm !important;
      margin: 0 !important;
      padding: 0 !important;
      gap: 0 !important;
      overflow: hidden !important;
      break-before: page !important;
      page-break-before: always !important;
      break-after: page !important;
      page-break-after: always !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* Thin centre line between the two A5 pages of the A4 landscape sheet. */
    .print-frame-joint .print-frame-sheet-wrap {
      position: relative !important;
    }

    .print-frame-joint .joint-center-divider {
      position: absolute !important;
      top: 0 !important;
      bottom: 0 !important;
      left: 148mm !important;
      width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-left: 1px solid #000000 !important;
      transform: translateX(-0.5px) !important;
      background: transparent !important;
      pointer-events: none !important;
      z-index: 5 !important;
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
    }

    .print-frame-joint .print-frame-sheet-wrap:first-child {
      break-before: auto !important;
      page-break-before: auto !important;
    }

    .print-frame-joint .print-frame-sheet-wrap:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }

    .print-frame-joint .print-frame-sheet {
      box-sizing: border-box !important;
      flex: 0 0 148mm !important;
      width: 148mm !important;
      min-width: 148mm !important;
      height: 209.5mm !important;
      min-height: 209.5mm !important;
      max-height: 209.5mm !important;
      padding: 8mm !important;
      overflow: hidden !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    [data-print-control="true"],
    .print-hide,
    .screen-only {
      display: none !important;
    }

    .paper-question-group {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    /*
     * Print must never carry screen/editor selection chrome into the
     * generated paper. The active Joint page uses a yellow border + ring,
     * while editing/dragging a question can add its own background/ring.
     * These states are screen-only concerns and must be neutral in print.
     */
    .print-frame-sheet {
      border-color: transparent !important;
      box-shadow: none !important;
      outline: none !important;
    }

    .print-frame-sheet .paper-question-row {
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
      outline: none !important;
    }

    .paper-question-row {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .paper-question-row > div {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .katex-math-inline {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .katex-math-display {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    input,
    textarea,
    select {
      color: #0F172A !important;
      background: transparent !important;
      appearance: none !important;
    }

    [data-paper-input] {
      border: 0 !important;
      outline: 0 !important;
    }

    img {
      max-width: 100% !important;
    }
  `;
    head.appendChild(printStyle);
    const frameClass = variant === "Joint"
        ? "print-frame-joint"
        : variant === "A5"
            ? "print-frame-a5"
            : "print-frame-a4";
    printDocument.body.className = frameClass;
    const root = printDocument.createElement("div");
    root.className = `print-frame-root ${frameClass}`;
    const clonedSource = sourceRoot.cloneNode(true) as HTMLElement;
    copyInputValuesToClone(sourceRoot, clonedSource);
    const originalSheets = Array.from(clonedSource.querySelectorAll<HTMLElement>(".paper-screen-sheet"));
    originalSheets.forEach((sheet) => {
        sheet.classList.add("print-frame-sheet");
        sheet.classList.remove("paper-screen-sheet");
    });
    if (variant === "Joint") {
        const jointSheets = Array.from(clonedSource.querySelectorAll<HTMLElement>(".print-frame-sheet"));
        clonedSource.replaceChildren();
        for (let index = 0; index < jointSheets.length; index += 2) {
            const spread = printDocument.createElement("div");
            const spreadIndex = Math.floor(index / 2);
            const duplexSide = spreadIndex % 2 === 0 ? "front" : "back";
            spread.className = "print-frame-sheet-wrap";
            spread.setAttribute("data-print-spread-index", String(spreadIndex + 1));
            spread.setAttribute("data-duplex-sheet", String(Math.floor(spreadIndex / 2) + 1));
            spread.setAttribute("data-duplex-side", duplexSide);
            spread.appendChild(jointSheets[index]);
            if (jointSheets[index + 1]) {
                spread.appendChild(jointSheets[index + 1]);
            }
            else {
                const blank = printDocument.createElement("div");
                blank.className = "print-frame-sheet";
                spread.appendChild(blank);
            }
            const centerDivider = printDocument.createElement("div");
            centerDivider.className = "joint-center-divider";
            centerDivider.setAttribute("aria-hidden", "true");
            spread.appendChild(centerDivider);
            clonedSource.appendChild(spread);
        }
    }
    root.appendChild(clonedSource);
    printDocument.body.appendChild(root);
    await waitForPrintIframeReady(iframe);
    let cleaned = false;
    const cleanup = () => {
        if (cleaned) {
            return;
        }
        cleaned = true;
        window.setTimeout(() => {
            if (cleanupRef.current === iframe) {
                cleanupRef.current = null;
            }
            iframe.remove();
        }, 150);
    };
    iframe.contentWindow?.addEventListener("afterprint", cleanup, { once: true });
    window.setTimeout(cleanup, 600000);
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
}
export default function PrintDuplexLayout({ manager, renderPaper, hideTools = false, }: PrintDuplexLayoutProps) {
    const { pageSize, selectedQuestions, jointLayoutMode, regionSelectMode, setRegionSelectMode, overflowJointPages, handleAutoBalanceJoint, addJointPage, removeLastJointPage, jointPageCount, jointRenderPageCount, jointQuestionsByPage, jointPageIndices, activeJointPage, setActiveJointPage, sectionGroups, } = manager;
    const visibleJointPageIndices = pageSize === "Joint"
        ? Array.from({
            length: jointRenderPageCount,
        }, (_, index) => index).filter((pageIndex) => (jointQuestionsByPage[pageIndex] || []).length > 0)
        : [];
    const totalSheets = pageSize === "Joint" ? Math.ceil(visibleJointPageIndices.length / 2) : 1;
    const { textScaleByTarget, setTextScale } = manager;
    /*
     * PREVIEW ZOOM + GRAB-TO-SCROLL
     * ---------------------------------------------------------------------
     * - Zoom: buttons, "Fit", or Ctrl/Cmd + mouse wheel (also trackpad pinch).
     *   Implemented as a CSS transform on a wrapper, so the paper itself, its
     *   pagination and its print output are never touched.
     * - Joint (2-in-1) is additionally auto-scaled to the column width so BOTH
     *   pages are always visible; the user zoom multiplies on top of that.
     * - Grab: toggle the hand tool (or hold Space) and drag to scroll the
     *   preview in any direction; dragging the empty background also works.
     */
    const isJointMode = pageSize === "Joint";
    const scrollBoxRef = useRef<HTMLDivElement | null>(null);
    const measureRef = useRef<HTMLDivElement | null>(null);
    const zoomInnerRef = useRef<HTMLDivElement | null>(null);
    const stageHoverRef = useRef(false);
    const panRef = useRef<{
        x: number;
        y: number;
        left: number;
        top: number;
        box: HTMLElement;
        scroller: HTMLElement;
    } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [handMode, setHandMode] = useState(false);
    const [spaceHeld, setSpaceHeld] = useState(false);
    const [panning, setPanning] = useState(false);
    const [zoomBox, setZoomBox] = useState({ avail: 0, natW: 0, natH: 0 });
    const handActive = handMode || spaceHeld;
    const baseScale = isJointMode
        ? Math.min(1, (zoomBox.avail || JOINT_NATURAL_WIDTH) / JOINT_NATURAL_WIDTH)
        : 1;
    const scale = baseScale * zoom;
    const naturalWidth = isJointMode ? JOINT_NATURAL_WIDTH : zoomBox.natW;
    const zoomOuterStyle = {
        width: naturalWidth ? naturalWidth * scale : undefined,
        height: zoomBox.natH ? zoomBox.natH * scale : undefined,
        margin: "0 auto",
    };
    const zoomTransform = Math.abs(scale - 1) > 0.001 ? `scale(${scale})` : undefined;
    useEffect(() => {
        const container = measureRef.current;
        const inner = zoomInnerRef.current;
        if (!container || !inner) {
            return;
        }
        const update = () => {
            const avail = container.clientWidth;
            if (avail <= 0) {
                return;
            }
            const natW = isJointMode ? JOINT_NATURAL_WIDTH : inner.offsetWidth;
            const natH = inner.offsetHeight;
            setZoomBox((current) => current.avail === avail && current.natW === natW && current.natH === natH
                ? current
                : { avail, natW, natH });
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(container);
        observer.observe(inner);
        return () => observer.disconnect();
    }, [isJointMode, selectedQuestions.length]);
    // Ctrl/Cmd + wheel (and trackpad pinch) zooms the preview.
    useEffect(() => {
        const box = scrollBoxRef.current;
        if (!box) {
            return;
        }
        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) {
                return;
            }
            event.preventDefault();
            setZoom((current) => clampZoom(current * (event.deltaY < 0 ? 1.08 : 1 / 1.08)));
        };
        box.addEventListener("wheel", onWheel, { passive: false });
        return () => box.removeEventListener("wheel", onWheel);
    }, []);
    // Hold Space (while the pointer is over the preview) to grab-scroll.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.code !== "Space" || isTypingTarget(event.target) || !stageHoverRef.current) {
                return;
            }
            event.preventDefault();
            setSpaceHeld(true);
        };
        const onKeyUp = (event: KeyboardEvent) => {
            if (event.code === "Space") {
                setSpaceHeld(false);
            }
        };
        const onBlur = () => setSpaceHeld(false);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("blur", onBlur);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("blur", onBlur);
        };
    }, []);
    const beginPan = (event: ReactPointerEvent<HTMLElement>) => {
        if (event.button !== 0 && event.button !== 1) {
            return;
        }
        const box = scrollBoxRef.current;
        if (!box) {
            return;
        }
        const column = box.closest<HTMLElement>(".question-paper-column");
        const scroller = column && column.scrollHeight > column.clientHeight + 1
            ? column
            : ((document.scrollingElement as HTMLElement | null) ?? document.documentElement);
        panRef.current = {
            x: event.clientX,
            y: event.clientY,
            left: box.scrollLeft,
            top: scroller.scrollTop,
            box,
            scroller,
        };
        setPanning(true);
        event.preventDefault();
    };
    useEffect(() => {
        if (!panning) {
            return;
        }
        const previousCursor = document.body.style.cursor;
        const previousSelect = document.body.style.userSelect;
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
        const onMove = (event: PointerEvent) => {
            const state = panRef.current;
            if (!state) {
                return;
            }
            state.box.scrollLeft = state.left - (event.clientX - state.x);
            state.scroller.scrollTop = state.top - (event.clientY - state.y);
        };
        const onUp = () => {
            panRef.current = null;
            setPanning(false);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        return () => {
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousSelect;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
    }, [panning]);
    const handleBackgroundPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (handActive || regionSelectMode) {
            return;
        }
        const target = event.target as HTMLElement;
        if (target.closest(".paper-screen-sheet, button, input, select, textarea, [contenteditable='true'], .screen-only")) {
            return;
        }
        beginPan(event);
    };
    const fitZoom = () => {
        if (isJointMode || !zoomBox.natW) {
            setZoom(1);
            return;
        }
        setZoom(clampZoom(zoomBox.avail / zoomBox.natW));
    };
    /*
     * CLICK-A-TEXT-TO-RESIZE
     * ---------------------------------------------------------------------
     * Clicking any text on the paper (question, option, stimulus, part,
     * header fields, ...) selects it and shows a small size pill with
     * A- / slider / A+ / reset. The size is stored per text target in
     * manager.textScaleByTarget and applied through a <style> element, so
     * pagination (offscreen measure copy), screen and print all agree.
     */
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const pillRef = useRef<HTMLDivElement | null>(null);
    const [pillPos, setPillPos] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const handleStageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (regionSelectMode || handActive) {
            return;
        }
        const target = event.target as HTMLElement;
        const el = target.closest?.("[data-region-edit-target]") as HTMLElement | null;
        const id = el?.getAttribute("data-region-edit-target") ?? null;
        if (!el || !id || id.endsWith("-block") || id.endsWith(":block") || id === "paper:header") {
            setSelectedText(null);
            return;
        }
        setSelectedText(id);
    };
    useEffect(() => {
        if (!selectedText) {
            return;
        }
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest("[data-text-size-pill]") || scrollBoxRef.current?.contains(target as Node)) {
                return;
            }
            setSelectedText(null);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedText(null);
            }
        };
        window.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [selectedText]);
    useEffect(() => {
        if (!selectedText) {
            setPillPos(null);
            return;
        }
        let frame = 0;
        const update = () => {
            const box = scrollBoxRef.current;
            const el = box?.querySelector<HTMLElement>(`[data-region-edit-target="${escapeAttr(selectedText)}"]`);
            if (!el) {
                setPillPos(null);
                return;
            }
            const rect = el.getBoundingClientRect();
            const pill = pillRef.current;
            const width = pill?.offsetWidth ?? 300;
            const height = pill?.offsetHeight ?? 44;
            let top = rect.bottom + 8;
            if (top + height > window.innerHeight - 8) {
                top = Math.max(8, rect.top - height - 8);
            }
            const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8));
            setPillPos((current) => current && current.top === top && current.left === left
                ? current
                : { top, left });
        };
        const schedule = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", schedule, true);
        window.addEventListener("resize", schedule);
        const observer = new MutationObserver(schedule);
        if (scrollBoxRef.current) {
            observer.observe(scrollBoxRef.current, { childList: true, subtree: true, characterData: true });
        }
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("scroll", schedule, true);
            window.removeEventListener("resize", schedule);
            observer.disconnect();
        };
    }, [selectedText, scale, textScaleByTarget]);
    // The per-text sizes live in <head> so the print iframe (which copies head styles) gets them too.
    useEffect(() => {
        let styleEl = document.getElementById("paper-text-scales") as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "paper-text-scales";
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = Object.entries(textScaleByTarget)
            .map(([id, pct]) => {
            const factor = pct / 100;
            const base = `[data-region-edit-target="${escapeAttr(id)}"]{zoom:${factor};}`;
            // Header inputs are w-full: shrink their box so the zoomed input still fits its row.
            const input = `input[data-region-edit-target="${escapeAttr(id)}"]{width:calc(100% / ${factor}) !important;}`;
            return base + input;
        })
            .join("\n");
    }, [textScaleByTarget]);
    const selectedPct = selectedText ? Math.round(textScaleByTarget[selectedText] ?? 100) : 100;
    const setSelectedPct = (value: number) => {
        if (!selectedText) {
            return;
        }
        const next = Math.min(TEXT_SCALE_MAX, Math.max(TEXT_SCALE_MIN, Math.round(value)));
        setTextScale(selectedText, next === 100 ? null : next);
    };
    return (<>
      <div className="paper-stage page-font relative rounded-2xl border border-[#E7DCC7] bg-[#F7F2E8] p-3 shadow-[0_3px_14px_rgba(76,57,28,0.05)] sm:p-4">
        {hideTools ? null : (<>
        <div className="screen-only mb-3 flex items-center justify-between gap-2 rounded-xl border border-[#E7DCC7] bg-white px-3 py-2.5 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <SquareDashedMousePointer size={16} className={regionSelectMode ? "text-[#DC2626]" : "text-[#6B5A40]"}/>

            <span className="truncate text-[14px] font-semibold text-[#3B2F1E]">
              {regionSelectMode
        ? <T>{"Drag anywhere on the paper to mark a custom text region"}</T> : <T>{"Add a custom text area to your question paper (optional)"}</T>}
            </span>
          </div>

          <button type="button" onClick={() => setRegionSelectMode(!regionSelectMode)} className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.98] ${regionSelectMode
            ? "border-[#D42020] bg-[#FFF1EF] text-[#B91C1C]"
            : "border-[#E7DCC7] bg-[#FCF8EF] text-[#51442F] hover:bg-[#F8F0E1]"}`}>
            {regionSelectMode ? <T>{"Cancel area"}</T> : <T>{"Select area"}</T>}
          </button>
        </div>

        {pageSize === "Joint" ? (<div className="screen-only mb-3 flex items-center justify-between gap-2 rounded-xl border border-[#E7DCC7] bg-white px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <Move size={16} className="text-[#DC2626]"/>

              <span className="text-[14px] font-semibold text-[#3B2F1E]">
                {jointLayoutMode === "manual"
            ? <T>{"Manual page distribution"}</T> : <T>{"Auto-balanced distribution"}</T>}
              </span>

              {overflowJointPages.length ? (<span className="rounded-full bg-red-50 px-2 py-0.5 text-[13px] font-bold text-red-500"><T>{"Overflow:"}</T>{<T>{" "}</T>}
                  {overflowJointPages.map((page) => page + 1).join(", ")}
                </span>) : null}
            </div>

            <div className="flex items-center gap-1">
              <button type="button" onClick={handleAutoBalanceJoint} className="rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-1.5 text-[13px] font-bold text-[#3B2F1E] hover:border-[#DC2626] hover:text-[#DC2626] transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]"><T>{"Auto balance\n              "}</T></button>

              <button type="button" onClick={addJointPage} className="rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-1.5 text-[13px] font-bold text-[#3B2F1E] hover:bg-[#EFE3C8] transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]"><T>{"+ Page\n              "}</T></button>

              <button type="button" onClick={removeLastJointPage} disabled={jointPageCount <= 2} className="rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-1.5 text-[13px] font-bold text-[#3B2F1E] hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-70 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]"><T>{"\u2212 Page\n              "}</T></button>
            </div>
          </div>) : null}

        {selectedQuestions.length ? (<div className="screen-only mb-2 flex items-center gap-2 text-[13px] font-medium text-[#6B5A40]">
            <GripVertical size={15}/>

            {regionSelectMode
            ? <T>{"Drag across any page area to create a custom inline text box"}</T> : <T>{"Drag questions to reorder them within a section or move them between pages"}</T>}
          </div>) : null}

        </>)}

        <div className="relative" onPointerEnter={() => {
            stageHoverRef.current = true;
        }} onPointerLeave={() => {
            stageHoverRef.current = false;
        }}>
        <div className="screen-only sticky top-0 z-30 mb-2 flex justify-center">
          <div className="inline-flex items-center gap-0.5 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8]/95 p-1 shadow-[0_4px_14px_rgba(76,57,28,0.12)] backdrop-blur">
            <button type="button" onClick={() => setHandMode((value) => !value)} aria-pressed={handMode} title="Grab & scroll (hold Space)" className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.97] ${handActive
            ? "bg-[#D42020] text-white shadow-sm"
            : "text-[#51442F] hover:bg-[#EFE3C8]"}`}>
              <Hand size={14}/>
              <T>Grab</T>
            </button>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#E3D6B8]"/>
            <button type="button" onClick={() => setZoom((value) => clampZoom(value / 1.15))} disabled={zoom <= ZOOM_MIN + 0.001} title="Zoom out" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#51442F] transition hover:bg-[#EFE3C8] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.97]">
              <ZoomOut size={15}/>
            </button>
            <button type="button" onClick={() => setZoom(1)} title="Reset zoom" className="h-8 min-w-[52px] rounded-lg px-1.5 text-[12px] font-extrabold tabular-nums text-[#342B1E] transition hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30">
              {Math.round(scale * 100)}%
            </button>
            <button type="button" onClick={() => setZoom((value) => clampZoom(value * 1.15))} disabled={zoom >= ZOOM_MAX - 0.001} title="Zoom in" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#51442F] transition hover:bg-[#EFE3C8] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.97]">
              <ZoomIn size={15}/>
            </button>
            <button type="button" onClick={fitZoom} title="Fit to width" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#51442F] transition hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.97]">
              <Maximize2 size={14}/>
            </button>
          </div>
        </div>
        <div ref={scrollBoxRef} onClick={handleStageClick} onPointerDown={handleBackgroundPointerDown} className="scroll paper-print-root overflow-auto rounded-xl border border-[#EAE1D2] bg-[#F1ECE2] p-2 sm:p-3">
          {selectedQuestions.length === 0 ? (<div className="flex min-h-[500px] items-center justify-center px-3 py-8 sm:min-h-[570px] sm:px-6">
              <div className="w-full max-w-[650px] text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F0D5D1] bg-[#FFF1EF] text-[#D42020] shadow-sm">
                  <FileText size={25}/>
                </div>

                <span className="inline-flex items-center rounded-full border border-[#E7DCC7] bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A795F]">
                  <T>{"Paper preview"}</T>
                </span>
                <h3 className="mt-3 text-[20px] font-extrabold tracking-tight text-[#342B1E] sm:text-[22px]">
                  <T>{"Your question paper starts here"}</T>
                </h3>
                <p className="mx-auto mt-2 max-w-[430px] text-[12px] leading-6 text-[#81725A] sm:text-[13px]">
                  <T>{"Choose questions from the list in the middle. Each question you add will appear here in your paper layout."}</T>
                </p>

                <div className="mt-7 grid gap-2.5 text-left sm:grid-cols-3">
                  <div className="rounded-xl border border-[#E7DCC7] bg-white px-3 py-3 shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCE9E6] text-[11px] font-extrabold text-[#B91C1C]">01</span>
                    <p className="mt-2 text-[11px] font-extrabold text-[#51442F]"><T>{"Choose your class"}</T></p>
                    <p className="mt-1 text-[10px] leading-4 text-[#8A795F]"><T>{"Select class, subject and chapter."}</T></p>
                  </div>
                  <div className="rounded-xl border border-[#E7DCC7] bg-white px-3 py-3 shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCE9E6] text-[11px] font-extrabold text-[#B91C1C]">02</span>
                    <p className="mt-2 text-[11px] font-extrabold text-[#51442F]"><T>{"Apply the filter"}</T></p>
                    <p className="mt-1 text-[10px] leading-4 text-[#8A795F]"><T>{"Load the matching questions."}</T></p>
                  </div>
                  <div className="rounded-xl border border-[#E7DCC7] bg-white px-3 py-3 shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8F4EA] text-[11px] font-extrabold text-[#258047]">03</span>
                    <p className="mt-2 text-[11px] font-extrabold text-[#51442F]"><T>{"Add questions"}</T></p>
                    <p className="mt-1 text-[10px] leading-4 text-[#8A795F]"><T>{"Click each question you want to include."}</T></p>
                  </div>
                </div>

                <div className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#F0D5D1] bg-[#FFF7F5] px-4 py-2 text-[11px] font-bold text-[#A83B33]">
                  <ArrowLeft size={14} className="shrink-0"/>
                  <T>{"Choose questions from the middle list"}</T>
                </div>
              </div>
            </div>) : pageSize === "Joint" ? (<div className="flex w-full flex-col pt-2">
              <div className="screen-only sticky top-0 z-20 mb-10 flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-1 shadow-sm">
                {jointPageIndices
                .filter((pageIndex) => pageIndex < jointPageCount)
                .map((pageIndex) => (<button key={`joint-page-tab-${pageIndex}`} type="button" onClick={() => setActiveJointPage(pageIndex)} className={`shrink-0 rounded-lg px-3.5 py-2 text-[14px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${activeJointPage === pageIndex
                    ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                    : "text-[#5A4A32] hover:bg-[#EFE3C8]"}`}><T>{"Page "}</T>{pageIndex + 1}<T>{"\u00B7"}</T>{<T>{" "}</T>}
                      {(jointQuestionsByPage[pageIndex] || []).length}
                    </button>))}
              </div>

              <div ref={measureRef} className="w-full">
              <div className="paper-zoom-outer" style={zoomOuterStyle}>
              <div ref={zoomInnerRef} className="paper-zoom-inner flex flex-col gap-10" style={{
                width: JOINT_NATURAL_WIDTH,
                transform: zoomTransform,
                transformOrigin: "top left",
            }}>
              {Array.from({
                length: totalSheets,
            }, (_, spreadIndex) => {
                const firstVisibleIndex = spreadIndex * 2;
                const spreadPageIndices = visibleJointPageIndices.slice(firstVisibleIndex, firstVisibleIndex + 2);
                return (<div key={`joint-spread-${spreadIndex}`} className="duplex-spread relative flex w-full items-start justify-center gap-3" data-duplex-sheet={Math.floor(spreadIndex / 2) + 1} data-duplex-side={spreadIndex % 2 === 0 ? "front" : "back"}>
                      <div className="screen-only pointer-events-none absolute left-1/2 top-[-18px] -translate-x-1/2 rounded-full border border-[#D8C9A6] bg-[#F3E9D2] px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-[#5A4A32]"><T>{"Sheet "}</T>{Math.floor(spreadIndex / 2) + 1}<T>{"\u00B7"}</T>{<T>{" "}</T>}
                        {spreadIndex % 2 === 0 ? <T>{"Front"}</T> : <T>{"Back / Flip"}</T>}
                      </div>

                      {spreadPageIndices.length === 2 ? (<div aria-hidden="true" className="joint-center-divider pointer-events-none absolute bottom-0 left-1/2 top-0 z-[5] w-0 -translate-x-1/2 border-l border-black"/>) : null}

                      {spreadPageIndices.map((pageIndex, spreadSideIndex) => {
                        const pagePart: "left" | "right" = spreadSideIndex === 0 ? "left" : "right";
                        const pageGroups = manager.jointSectionGroupsByPage[pageIndex] || [];
                        const isLastContentPage = pageIndex === jointPageCount - 1;
                        return (<div key={`joint-page-slot-${pageIndex}`} className="duplex-spread-side shrink-0">
                            {renderPaper({
                                pageIndex,
                                groups: pageGroups,
                                pagePart,
                                showHeader: pageIndex === 0,
                                showFooter: isLastContentPage,
                            })}
                          </div>);
                    })}
                    </div>);
            })}
              </div>
              </div>
              </div>
            </div>) : (<div ref={measureRef} className="w-full">
              <div className="paper-zoom-outer" style={zoomOuterStyle}>
                <div ref={zoomInnerRef} className="paper-center-wrap paper-zoom-inner" style={{
                width: "max-content",
                transform: zoomTransform,
                transformOrigin: "top left",
            }}>
                  {renderPaper({
            pageIndex: 0,
            groups: sectionGroups,
            pagePart: "single",
        })}
                </div>
              </div>
            </div>)}
        </div>

        {handActive ? (<div className="screen-only absolute inset-x-0 bottom-0 top-[46px] z-[40] rounded-xl" style={{
                cursor: panning ? "grabbing" : "grab",
                touchAction: "none",
            }} onPointerDown={beginPan}/>) : null}
        </div>
      </div>

      {selectedText ? (<style>{`.paper-print-root [data-region-edit-target="${escapeAttr(selectedText)}"]{outline:1.5px dashed #DC2626;outline-offset:2px;border-radius:2px;}`}</style>) : null}

      {selectedText && !regionSelectMode
        ? createPortal(<div ref={pillRef} data-text-size-pill="true" data-print-control="true" className="ui-font screen-only print:hidden fixed z-[95] flex items-center gap-1 whitespace-nowrap rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-1 shadow-[0_8px_24px_rgba(45,35,20,0.22)]" style={{
                top: pillPos?.top ?? 0,
                left: pillPos?.left ?? 0,
                visibility: pillPos ? "visible" : "hidden",
            }} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
            <span className="px-2 text-[11px] font-extrabold uppercase tracking-wide text-[#8A795F]"><T>Text size</T></span>
            <button type="button" onClick={() => setSelectedPct(selectedPct - 5)} title="Smaller" className="h-8 w-8 rounded-lg text-[13px] font-bold text-[#3B2F1E] transition hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.96]">A−</button>
            <input type="range" min={TEXT_SCALE_MIN} max={TEXT_SCALE_MAX} step={5} value={selectedPct} onChange={(event) => setSelectedPct(Number(event.target.value))} aria-label="Text size" className="h-1.5 w-28 cursor-pointer accent-[#D42020]"/>
            <button type="button" onClick={() => setSelectedPct(selectedPct + 5)} title="Larger" className="h-8 w-8 rounded-lg text-[15px] font-bold text-[#3B2F1E] transition hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.96]">A+</button>
            <span className="w-11 text-center text-[12px] font-extrabold tabular-nums text-[#342B1E]">{selectedPct}%</span>
            <button type="button" onClick={() => setSelectedPct(100)} disabled={selectedPct === 100} title="Reset size" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#51442F] transition hover:bg-[#EFE3C8] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.96]">
              <RotateCcw size={14}/>
            </button>
            <button type="button" onClick={() => setSelectedText(null)} title="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A795F] transition hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 active:scale-[0.96]">
              <X size={14}/>
            </button>
          </div>, document.body)
        : null}

      <div data-joint-measure-root="true" aria-hidden="true" className="pointer-events-none absolute left-[-100000px] top-0 z-[-1] h-0 w-0 overflow-hidden opacity-0">
        {renderPaper({
            pageIndex: 0,
            groups: [],
            pagePart: "single",
            measurementMode: "header",
        })}

        {renderPaper({
            pageIndex: 0,
            groups: [],
            pagePart: "single",
            showFooter: false,
            measurementMode: "header-no-footer",
        })}

        {renderPaper({
            pageIndex: 0,
            groups: [],
            pagePart: "single",
            showHeader: false,
            measurementMode: "no-header",
        })}

        {renderPaper({
            pageIndex: 0,
            groups: [],
            pagePart: "single",
            showHeader: false,
            showFooter: true,
            measurementMode: "no-header-footer",
        })}

        {renderPaper({
            pageIndex: 0,
            groups: sectionGroups,
            pagePart: "single",
            measurementMode: "rows",
        })}
      </div>

      <style jsx global>{`
        .field-label {
          display: block;
          margin-bottom: 6px;
          color: #6B5A40;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Keep the single-page paper exactly in the middle of the center column (screen only). */
        @media screen {
          .paper-center-wrap {
            display: block;
            width: 100%;
          }

          .paper-center-wrap > [data-paper-fabric-wrapper] {
            width: fit-content;
            max-width: none;
            margin-left: auto;
            margin-right: auto;
          }
        }

        .paper-a4 {
          width: 620px;
          min-height: 875px;
        }

        .paper-a5 {
          width: 520px;
          min-height: 735px;
        }

        .joint-fixed-paper {
          box-sizing: border-box;
          width: 520px;
          height: 735px;
          min-height: 735px;
          max-height: 735px;
          overflow: hidden;
          overflow: clip;
        }

        /*
          IMPORTANT:
          Previously this selector targeted every direct div child of
          .joint-fixed-paper. That accidentally stretched the small
          RegionSelectionOverlay page-indicator pill to full paper height,
          producing the dark vertical bar in Joint (2-in-1) mode.

          Only the real paper content wrapper should receive the fixed
          height/overflow rules.
        */
        .joint-fixed-paper > .paper-sheet-content {
          height: 100%;
          min-height: 0;
          max-height: 100%;
          overflow: hidden;
          overflow: clip;
        }

        [data-paper-question-area] {
          overflow: hidden;
          overflow: clip;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        [data-paper-question-area]::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        .duplex-spread {
          box-sizing: border-box;
          width: 100%;
          min-width: 1045px;
          min-height: 735px;
          background: #ffffff;
          isolation: isolate;
          border-radius: 8px;
        }

        .duplex-spread-side {
          box-sizing: border-box;
          background: #ffffff;
        }

        .region-text-annotation {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        /*
          Prevent the desktop flex row from stretching the paper column to
          the height of the taller question sidebar. That stretch is what
          leaves the large empty area underneath the paper on screen.
          Keep the mobile stacked layout unchanged.
        */
        @media (min-width: 1024px) {
          main:has(.paper-stage) > section {
            align-self: flex-start !important;
          }
        }

        @media (max-width: 900px) {
          .paper-a4 {
            width: 580px;
          }

          .paper-a5 {
            width: 490px;
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .paper-question-group {
          break-inside: auto;
          page-break-inside: auto;
        }

        .paper-question-section-heading {
          break-after: avoid;
          page-break-after: avoid;
        }

        .paper-question-row {
          break-inside: avoid;
          page-break-inside: avoid;
          -webkit-column-break-inside: avoid;
        }

        .katex-math-inline {
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
          white-space: nowrap;
        }

        .katex-math-display {
          display: block;
          margin: 0.2em 0;
        }

        .katex-math-inline math,
        .katex-math-display math {
          vertical-align: middle;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-width: 0 !important;
            background: #ffffff !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .screen-only {
            display: none !important;
          }

          .question-paper-page,
          .paper-stage {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          .paper-zoom-outer,
          .paper-zoom-inner {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            transform: none !important;
          }

          .paper-print-root {
            width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .paper-question-row {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }

          .duplex-spread {
            box-sizing: border-box !important;
            width: 296mm !important;
            min-width: 296mm !important;
            height: 210mm !important;
            min-height: 210mm !important;
            max-height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            isolation: isolate !important;
            break-before: page !important;
            page-break-before: always !important;
            break-after: page !important;
            page-break-after: always !important;
            overflow: hidden !important;
          }

          .duplex-spread:first-child {
            break-before: auto !important;
            page-break-before: auto !important;
          }

          .duplex-spread-side {
            box-sizing: border-box !important;
            flex: 0 0 148mm !important;
            width: 148mm !important;
            min-width: 148mm !important;
            height: 210mm !important;
            min-height: 210mm !important;
            max-height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            background: #ffffff !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .region-text-annotation {
            outline: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>);
}
