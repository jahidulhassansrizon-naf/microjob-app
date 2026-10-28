"use client";
import React, { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { ManualT as T } from "./_components/manual-editor/manualEditorI18n";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import PhotoSizePanel from "./_components/manual-editor/PhotoSizePanel";
import BackgroundPanel from "./_components/manual-editor/BackgroundPanel";
import AiToolsPanel from "./_components/manual-editor/AiToolsPanel";
import PhotoWorkspace from "./_components/manual-editor/PhotoWorkspace";
import AdjustmentsPanel from "./_components/manual-editor/AdjustmentsPanel";
import QrUploadPanel from "./_components/manual-editor/QrUploadPanel";
import GeneratedPhotosPanel from "./_components/manual-editor/GeneratedPhotosPanel";
import ScanModal from "./_components/manual-editor/ScanModal";
import PrintStudioModal from "./_components/manual-editor/PrintStudioModal";
import { ManualEditorProvider, useManualEditor, } from "./_components/manual-editor/EditorProvider";
/*
 * The left panel has no visible scrollbar, so let the mouse drag it
 * (press on an empty area / between buttons and pull up or down). Wheel,
 * touch and keyboard scrolling keep working natively. A drag never clicks
 * the button it started on.
 */
function useDragScroll() {
    const drag = useRef<{ y: number; top: number; moved: boolean; id: number; } | null>(null);
    const suppressClick = useRef(false);
    const finish = (event: ReactPointerEvent<HTMLElement>) => {
        const d = drag.current;
        if (!d)
            return;
        drag.current = null;
        delete event.currentTarget.dataset.dragging;
        if (d.moved) {
            suppressClick.current = true;
            window.setTimeout(() => {
                suppressClick.current = false;
            }, 0);
            try {
                event.currentTarget.releasePointerCapture(d.id);
            }
            catch {
                // capture already released
            }
        }
    };
    // Marks the panel as scrollable only while its content really overflows,
    // so the grab cursor and drag-scroll appear exactly when they are useful.
    const syncScrollable = (el: HTMLElement) => {
        const overflowing = el.scrollHeight - el.clientHeight > 2;
        if (overflowing)
            el.dataset.scrollable = "1";
        else
            delete el.dataset.scrollable;
        return overflowing;
    };
    return {
        onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
            if (event.pointerType !== "mouse" || event.button !== 0)
                return;
            if (!syncScrollable(event.currentTarget))
                return;
            if ((event.target as HTMLElement).closest("input, select, textarea, [role=\"slider\"]"))
                return;
            drag.current = { y: event.clientY, top: event.currentTarget.scrollTop, moved: false, id: event.pointerId };
        },
        onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
            const d = drag.current;
            if (!d) {
                if (event.pointerType === "mouse")
                    syncScrollable(event.currentTarget);
                return;
            }
            const dy = event.clientY - d.y;
            if (!d.moved) {
                if (Math.abs(dy) < 6)
                    return;
                d.moved = true;
                event.currentTarget.dataset.dragging = "1";
                event.currentTarget.setPointerCapture(d.id);
            }
            event.currentTarget.scrollTop = d.top - dy;
        },
        onPointerUp: finish,
        onPointerCancel: finish,
        onClickCapture: (event: React.MouseEvent<HTMLElement>) => {
            if (suppressClick.current) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
    };
}
function ManualEditorScreen() {
    const { loading, isAuthenticated } = useManualEditor();
    const leftDragScroll = useDragScroll();
    if (loading) {
        return (<div className="page-font min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin"/>
          <p className="text-sm font-semibold text-[#6B5A40]"><T>{"\u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u099A\u09CD\u099B\u09C7...\n          "}</T></p>
        </div>
      </div>);
    }
    if (!isAuthenticated)
        return null;
    return (<div className="manual-editor-root min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] flex flex-col font-sans page-font select-none text-[#3B2F1E]">
      <DashboardNavbar />
      <div className="w-full p-3 md:p-4 lg:px-4 lg:py-3 flex flex-col gap-5 lg:gap-3 flex-1 lg:min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-6 lg:gap-4 lg:flex-1 lg:min-h-0">
          <aside {...leftDragScroll} className="me-left scroll lg:col-span-3 bg-[#F2E8D2] border border-[#E3D6B8] rounded-3xl p-4 md:p-5 lg:p-4 flex flex-col gap-5 lg:gap-3 shadow-sm overflow-visible lg:overflow-y-auto max-h-[85vh] lg:max-h-none lg:h-full lg:min-h-0">
            <PhotoSizePanel />
            <BackgroundPanel />
            <AiToolsPanel />
          </aside>

          <PhotoWorkspace />

          <aside className="me-right scroll lg:col-span-3 flex flex-col gap-5 lg:gap-2 lg:h-full lg:min-h-0 lg:overflow-y-auto">
            <QrUploadPanel />
            <AdjustmentsPanel />
          </aside>
        </div>

        <GeneratedPhotosPanel />
      </div>

      <footer className="mt-auto shrink-0 border-t border-[#E3D6B8] bg-[#F2E8D2] px-5 py-3 lg:py-1.5 text-[12px] text-[#6B5A40]">
        <div className="w-full flex items-center justify-between gap-3">
          <span><T>{"Manual Editor"}</T></span>
          <span><T>{"Browser editing is local; AI processing runs in your browser.\n          "}</T></span>
        </div>
      </footer>

      <ScanModal />
      <PrintStudioModal />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
        .scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
        .scroll::-webkit-scrollbar { width: 12px; }
        .scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
        .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
        .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }

        /* Left panel: still scrolls (wheel / touch / keyboard) but shows no scrollbar. */
        .manual-editor-root .me-left { scrollbar-width: none; -ms-overflow-style: none; overflow-anchor: none; overscroll-behavior: contain; }
        .manual-editor-root .me-left::-webkit-scrollbar { display: none; width: 0; height: 0; }
        /* Open hand on empty areas, closed hand (everywhere) while dragging. */
        .manual-editor-root .me-left[data-scrollable="1"] { cursor: grab; }
        .manual-editor-root .me-left[data-dragging="1"],
        .manual-editor-root .me-left[data-dragging="1"] * { cursor: grabbing !important; }

        .manual-editor-root button:not(:disabled),
        .manual-editor-root [role="button"],
        .manual-editor-root input[type="range"],
        .manual-editor-root select,
        .manual-editor-root summary {
          cursor: pointer;
        }

        /* One-screen fit on desktop: tighter vertical rhythm on shorter viewports,
           so every panel stays visible without inner scrolling. */
        @media (min-width: 1024px) and (max-height: 900px) {
          .manual-editor-root .me-left { gap: 0.6rem; padding-top: 0.75rem; padding-bottom: 0.75rem; }
          .manual-editor-root .me-left section { gap: 0.5rem; }
          .manual-editor-root .me-left .lg\\:h-14 { height: 3.4rem; }
          .manual-editor-root .me-left .lg\\:h-16 { height: 3.75rem; }
          .manual-editor-root .me-left .lg\\:h-\\[72px\\] { height: 4.2rem; }
          .manual-editor-root .me-left .lg\\:h-9 { height: 2rem; }
          .manual-editor-root .me-right .mb-4,
          .manual-editor-root .me-right .lg\\:mb-2 { margin-bottom: 0.4rem; }
        }
        @media (min-width: 1024px) and (max-height: 760px) {
          .manual-editor-root .me-left .lg\\:h-14 { height: 2.9rem; }
          .manual-editor-root .me-left .lg\\:h-16 { height: 3.2rem; }
          .manual-editor-root .me-left .lg\\:h-\\[72px\\] { height: 3.6rem; }
          .manual-editor-root .me-left .lg\\:h-9 { height: 1.75rem; }
          .manual-editor-root .me-left .lg\\:h-14 svg,
          .manual-editor-root .me-left .lg\\:h-16 svg { width: 1rem; height: 1rem; }
          .manual-editor-root .me-right input[type="range"] { height: 0.9rem; }
        }

        .manual-editor-root button:disabled,
        .manual-editor-root select:disabled,
        .manual-editor-root input:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </div>);
}
export default function ManualEditorPage() {
    return (<ManualEditorProvider>
      <ManualEditorScreen />
    </ManualEditorProvider>);
}
