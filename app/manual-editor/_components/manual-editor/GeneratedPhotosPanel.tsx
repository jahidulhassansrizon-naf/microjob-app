"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Download,
  Eye,
  Image as ImageIcon,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { useManualEditor, type GeneratedPhoto } from "./EditorProvider";

function GeneratedPhotoPreview({
  photo,
  onClose,
  onDownload,
  onPrint,
  onDelete,
  onUseInEditor,
}: {
  photo: GeneratedPhoto;
  onClose: () => void;
  onDownload: () => Promise<void>;
  onPrint: () => Promise<void>;
  onDelete: () => Promise<void>;
  onUseInEditor: () => Promise<void>;
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [busyAction, setBusyAction] = useState<
    "download" | "print" | "delete" | "use" | null
  >(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyAction) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, busyAction]);

  const runAction = async (
    action: "download" | "print" | "delete" | "use",
    handler: () => Promise<void>,
  ) => {
    if (busyAction) return;
    setBusyAction(action);
    try {
      await handler();
    } finally {
      setBusyAction(null);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[10000] w-screen h-[100dvh] min-h-[100svh] bg-slate-950/95 backdrop-blur-md flex flex-col font-sans overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Saved photo preview"
    >
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Eye size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-gray-950 truncate">
              Saved Photo Preview
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate mt-0.5">
              Preview the saved image before downloading, printing, or deleting
              it.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={Boolean(busyAction)}
          className="p-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Close preview"
        >
          <X size={17} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
        <div className="min-h-full w-full flex flex-col items-center justify-center gap-4 sm:gap-5">
          <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-white/10 p-2 sm:p-4 shadow-2xl">
            <div className="relative w-full min-h-[320px] sm:min-h-[460px] lg:min-h-[560px] rounded-2xl bg-[#f3f4f6] border border-white/15 overflow-hidden flex items-center justify-center [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]">
              {!imageError && (
                <img
                  src={photo.url}
                  alt="Saved generated result"
                  draggable={false}
                  onLoad={() => {
                    setImageLoading(false);
                    setImageError(false);
                  }}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                  className="block max-w-[92%] max-h-[72vh] w-auto h-auto object-contain rounded-xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.30)] select-none"
                />
              )}

              {imageLoading && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
                  <div className="rounded-full bg-slate-900/90 text-white px-4 py-2 text-[11px] font-bold shadow-xl">
                    Loading preview…
                  </div>
                </div>
              )}

              {imageError && (
                <div className="px-6 text-center text-sm font-bold text-red-600">
                  This saved image could not be loaded.
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-5xl rounded-2xl bg-white border border-gray-200 shadow-xl p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-emerald-600 shrink-0"
                  />
                  <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                    Saved image
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 font-medium mt-1">
                  {photo.sizeType || "Manual Editor"}
                  {photo.size ? ` · ${photo.size}` : ""}
                  {photo.widthPx && photo.heightPx
                    ? ` · ${photo.widthPx} × ${photo.heightPx} px`
                    : ""}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto lg:min-w-[540px]">
                <button
                  type="button"
                  disabled={imageLoading || imageError || Boolean(busyAction)}
                  onClick={() => void runAction("download", onDownload)}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 px-3 py-2.5 text-[10px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={13} />
                  {busyAction === "download" ? "Downloading…" : "Download"}
                </button>

                <button
                  type="button"
                  disabled={imageLoading || imageError || Boolean(busyAction)}
                  onClick={() => void runAction("print", onPrint)}
                  className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2.5 text-[10px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Printer size={13} />
                  {busyAction === "print" ? "Preparing…" : "Print"}
                </button>

                <button
                  type="button"
                  disabled={imageLoading || imageError || Boolean(busyAction)}
                  onClick={() => void runAction("use", onUseInEditor)}
                  className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2.5 text-[10px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Eye size={13} />
                  {busyAction === "use" ? "Opening…" : "Use in editor"}
                </button>

                <button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={() => {
                    if (
                      !window.confirm("Delete this saved photo permanently?")
                    ) {
                      return;
                    }
                    void runAction("delete", onDelete);
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2.5 text-[10px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                  {busyAction === "delete" ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function GeneratedPhotosPanel() {
  const {
    generatedPhotos,
    loadHistoryImage,
    downloadHistoryImage,
    openPrintStudioWithImage,
    deleteHistoryImage,
  } = useManualEditor();

  const [previewPhoto, setPreviewPhoto] = useState<GeneratedPhoto | null>(null);

  return (
    <section className="bg-[#1F242D] border border-gray-700/60 rounded-3xl p-5 flex flex-col gap-4 shadow-lg w-full">
      <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
          <h4 className="text-white text-xs font-bold tracking-wider uppercase">
            Generated Photos
          </h4>
        </div>
        <span className="text-[10px] text-gray-400">Recent Output History</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {generatedPhotos.length
          ? generatedPhotos.map((photo, idx) => (
              <button
                type="button"
                key={`${photo.id || photo.url.slice(0, 18)}-${idx}`}
                onClick={() => setPreviewPhoto(photo)}
                className="aspect-[3/4] bg-[#282E3B] border border-gray-700 rounded-xl overflow-hidden relative shadow-sm hover:border-amber-400/60 hover:ring-2 hover:ring-amber-400/20 transition-all cursor-pointer group"
                title="Click to preview"
              >
                <img
                  src={photo.url}
                  alt="Saved result"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />

                <span className="absolute inset-x-2 bottom-2 rounded-lg bg-slate-950/85 text-white px-2 py-1.5 text-[9px] font-bold flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={11} /> Preview
                </span>
              </button>
            ))
          : Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[3/4] bg-[#282E3B]/50 border border-dashed border-gray-700/80 rounded-xl flex flex-col items-center justify-center text-gray-500 text-[10px] gap-1"
              >
                <ImageIcon size={16} />
                <span>Empty slot</span>
              </div>
            ))}
      </div>

      {previewPhoto && (
        <GeneratedPhotoPreview
          photo={previewPhoto}
          onClose={() => setPreviewPhoto(null)}
          onDownload={() => downloadHistoryImage(previewPhoto)}
          onPrint={async () => {
            // Close the Saved Photo Preview first, then open the exact same
            // Print Studio used by the main editor Print button.
            setPreviewPhoto(null);
            openPrintStudioWithImage(previewPhoto.url);
          }}
          onDelete={async () => {
            await deleteHistoryImage(previewPhoto);
            setPreviewPhoto(null);
          }}
          onUseInEditor={async () => {
            await loadHistoryImage(previewPhoto);
            setPreviewPhoto(null);
          }}
        />
      )}
    </section>
  );
}
