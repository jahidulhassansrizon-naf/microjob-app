"use client";
import { T } from "../i18n";
import type { PaperRenderRequest, PrintPageVariant } from "../types/question";
import type { QuestionManager } from "../hooks/useQuestionManager";
import { ArrowLeft, FileText, GripVertical, Move, SquareDashedMousePointer, } from "lucide-react";
import type { ReactNode } from "react";
type PrintDuplexLayoutProps = {
    manager: QuestionManager;
    renderPaper: (request: PaperRenderRequest) => ReactNode;
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
export async function waitForPrintIframeReady(iframe: HTMLIFrameElement) {
    const printDocument = iframe.contentDocument;
    const printWindow = iframe.contentWindow;
    if (!printDocument || !printWindow) {
        throw new Error("Print frame is not available.");
    }
    try {
        if (printDocument.fonts?.ready) {
            await printDocument.fonts.ready;
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

    @page isolated-a4 {
      size: A4 portrait;
      margin: 0;
    }

    @page isolated-a5 {
      size: A5 portrait;
      margin: 0;
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
      width: 210mm !important;
      min-width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      padding: 10mm !important;
      overflow: hidden !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .print-frame-a5 .print-frame-sheet {
      box-sizing: border-box !important;
      width: 148mm !important;
      min-width: 148mm !important;
      height: 210mm !important;
      min-height: 210mm !important;
      padding: 8mm !important;
      overflow: hidden !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
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
      height: 210mm !important;
      min-height: 210mm !important;
      max-height: 210mm !important;
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
      height: 210mm !important;
      min-height: 210mm !important;
      max-height: 210mm !important;
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
    window.setTimeout(cleanup, 60000);
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
}
export default function PrintDuplexLayout({ manager, renderPaper, }: PrintDuplexLayoutProps) {
    const { pageSize, selectedQuestions, jointLayoutMode, regionSelectMode, setRegionSelectMode, overflowJointPages, handleAutoBalanceJoint, addJointPage, removeLastJointPage, jointPageCount, jointRenderPageCount, jointQuestionsByPage, jointPageIndices, activeJointPage, setActiveJointPage, sectionGroups, } = manager;
    const visibleJointPageIndices = pageSize === "Joint"
        ? Array.from({
            length: jointRenderPageCount,
        }, (_, index) => index).filter((pageIndex) => (jointQuestionsByPage[pageIndex] || []).length > 0)
        : [];
    const totalSheets = pageSize === "Joint" ? Math.ceil(visibleJointPageIndices.length / 2) : 1;
    return (<>
      <div className="paper-stage page-font relative rounded-2xl border border-[#E7DCC7] bg-[#F7F2E8] p-3 shadow-[0_3px_14px_rgba(76,57,28,0.05)] sm:p-4">
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

        <div className="scroll paper-print-root overflow-auto rounded-xl border border-[#EAE1D2] bg-[#F1ECE2] p-2 sm:p-3">
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
            </div>) : pageSize === "Joint" ? (<div className="flex w-full min-w-[1050px] flex-col gap-10 pt-2">
              <div className="screen-only sticky top-0 z-20 flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-1 shadow-sm">
                {jointPageIndices
                .filter((pageIndex) => pageIndex < jointPageCount)
                .map((pageIndex) => (<button key={`joint-page-tab-${pageIndex}`} type="button" onClick={() => setActiveJointPage(pageIndex)} className={`shrink-0 rounded-lg px-3.5 py-2 text-[14px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${activeJointPage === pageIndex
                    ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                    : "text-[#5A4A32] hover:bg-[#EFE3C8]"}`}><T>{"Page "}</T>{pageIndex + 1}<T>{"\u00B7"}</T>{<T>{" "}</T>}
                      {(jointQuestionsByPage[pageIndex] || []).length}
                    </button>))}
              </div>

              {Array.from({
                length: totalSheets,
            }, (_, spreadIndex) => {
                const firstVisibleIndex = spreadIndex * 2;
                const spreadPageIndices = visibleJointPageIndices.slice(firstVisibleIndex, firstVisibleIndex + 2);
                return (<div key={`joint-spread-${spreadIndex}`} className="duplex-spread relative flex w-full items-start justify-center gap-3" data-duplex-sheet={Math.floor(spreadIndex / 2) + 1} data-duplex-side={spreadIndex % 2 === 0 ? "front" : "back"}>
                      <div className="screen-only pointer-events-none absolute left-1/2 top-[-18px] -translate-x-1/2 rounded-full border border-[#D8C9A6] bg-[#F3E9D2] px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-[#5A4A32]"><T>{"Sheet "}</T>{Math.floor(spreadIndex / 2) + 1}<T>{"\u00B7"}</T>{<T>{" "}</T>}
                        {spreadIndex % 2 === 0 ? <T>{"Front"}</T> : <T>{"Back / Flip"}</T>}
                      </div>

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
            </div>) : (renderPaper({
            pageIndex: 0,
            groups: sectionGroups,
            pagePart: "single",
        }))}
        </div>
      </div>

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
