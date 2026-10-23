"use client";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Download, Eye, Image as ImageIcon, Printer, Trash2, X, } from "lucide-react";
import { useManualEditor, type GeneratedPhoto } from "./EditorProvider";
function GeneratedPhotoPreview({ photo, onClose, onDownload, onPrint, onDelete, onUseInEditor, }: {
    photo: GeneratedPhoto;
    onClose: () => void;
    onDownload: () => Promise<void>;
    onPrint: () => Promise<void>;
    onDelete: () => Promise<void>;
    onUseInEditor: () => Promise<void>;
}) {
    const { t } = useManualEditorText();
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [busyAction, setBusyAction] = useState<"download" | "print" | "delete" | "use" | null>(null);
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
    const runAction = async (action: "download" | "print" | "delete" | "use", handler: () => Promise<void>) => {
        if (busyAction)
            return;
        setBusyAction(action);
        try {
            await handler();
        }
        finally {
            setBusyAction(null);
        }
    };
    const modal = (<div className="fixed inset-0 z-[10000] w-screen h-[100dvh] min-h-[100svh] bg-[#2A2117]/90 backdrop-blur-md flex flex-col font-sans page-font overflow-hidden" role="dialog" aria-modal="true" aria-label={t("Saved photo preview")}>
      <div className="shrink-0 bg-[#F2E8D2] border-b border-[#E3D6B8] px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0">
            <Eye size={16}/>
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-[#3B2F1E] truncate"><T>{"Saved Photo Preview\r\n            "}</T></p>
            <p className="text-[12px] sm:text-[13px] text-[#6B5A40] font-medium truncate mt-0.5"><T>{"Preview the saved image before downloading, printing, or deleting\r\n              it.\r\n            "}</T></p>
          </div>
        </div>

        <button type="button" onClick={onClose} disabled={Boolean(busyAction)} className="p-2 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] text-[#3B2F1E] hover:bg-[#EFE3C8] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" aria-label={t("Close preview")}>
          <X size={17}/>
        </button>
      </div>

      <div className="scroll flex-1 min-h-0 overflow-auto p-4 sm:p-6">
        <div className="min-h-full w-full flex flex-col items-center justify-center gap-4 sm:gap-5">
          <div className="w-full max-w-5xl rounded-3xl border border-white/20 bg-white/10 p-2 sm:p-4 shadow-xl">
            <div className="relative w-full min-h-[320px] sm:min-h-[460px] lg:min-h-[560px] rounded-2xl bg-[#F2E8D2] border border-[#E3D6B8] overflow-hidden flex items-center justify-center [background-image:radial-gradient(#B0A080_1px,transparent_1px)] [background-size:16px_16px]">
              {!imageError && (<img src={photo.url} alt={t("Saved generated result")} draggable={false} onLoad={() => {
                setImageLoading(false);
                setImageError(false);
            }} onError={() => {
                setImageLoading(false);
                setImageError(true);
            }} className="block max-w-[92%] max-h-[72vh] w-auto h-auto object-contain rounded-xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] select-none"/>)}

              {imageLoading && !imageError && (<div className="absolute inset-0 flex items-center justify-center bg-[#F2E8D2]/75 backdrop-blur-[1px]">
                  <div className="rounded-full bg-[#3B2F1E] text-white px-4 py-2 text-[13px] font-bold shadow-xl"><T>{"Loading preview\u2026\r\n                  "}</T></div>
                </div>)}

              {imageError && (<div className="px-6 text-center text-base font-bold text-red-600"><T>{"This saved image could not be loaded.\r\n                "}</T></div>)}
            </div>
          </div>

          <div className="w-full max-w-5xl rounded-2xl bg-[#F2E8D2] border border-[#E3D6B8] shadow-xl p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#10B981] shrink-0"/>
                  <p className="text-sm sm:text-base font-extrabold text-[#3B2F1E]"><T>{"Saved image\r\n                  "}</T></p>
                </div>
                <p className="text-[12px] text-[#6B5A40] font-medium mt-1">
                  <T>{photo.sizeType || "Manual Editor"}</T>
                  {photo.size ? <T>{` · ${photo.size}`}</T> : <T>{""}</T>}
                  {photo.widthPx && photo.heightPx
        ? <T>{` · ${photo.widthPx} × ${photo.heightPx} px`}</T> : <T>{""}</T>}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto lg:min-w-[540px]">
                <button type="button" disabled={imageLoading || imageError || Boolean(busyAction)} onClick={() => void runAction("download", onDownload)} className="rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3 py-2.5 text-[12px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <Download size={13}/>
                  {busyAction === "download" ? <T>{"Downloading…"}</T> : <T>{"Download"}</T>}
                </button>

                <button type="button" disabled={imageLoading || imageError || Boolean(busyAction)} onClick={() => void runAction("print", onPrint)} className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] hover:bg-[#EFE3C8] text-[#3B2F1E] px-3 py-2.5 text-[12px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <Printer size={13}/>
                  {busyAction === "print" ? <T>{"Preparing…"}</T> : <T>{"Print"}</T>}
                </button>

                <button type="button" disabled={imageLoading || imageError || Boolean(busyAction)} onClick={() => void runAction("use", onUseInEditor)} className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] hover:bg-[#EFE3C8] text-[#3B2F1E] px-3 py-2.5 text-[12px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <Eye size={13}/>
                  {busyAction === "use" ? <T>{"Opening…"}</T> : <T>{"Use in editor"}</T>}
                </button>

                <button type="button" disabled={Boolean(busyAction)} onClick={() => {
            if (!window.confirm(t("Delete this saved photo permanently?"))) {
                return;
            }
            void runAction("delete", onDelete);
        }} className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2.5 text-[12px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <Trash2 size={13}/>
                  {busyAction === "delete" ? <T>{"Deleting…"}</T> : <T>{"Delete"}</T>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
    return createPortal(modal, document.body);
}
export default function GeneratedPhotosPanel() {
    const { t } = useManualEditorText();
    const { generatedPhotos, loadHistoryImage, downloadHistoryImage, openPrintStudioWithImage, deleteHistoryImage, } = useManualEditor();
    const [previewPhoto, setPreviewPhoto] = useState<GeneratedPhoto | null>(null);
    return (<section className="bg-[#F2E8D2] border border-[#E3D6B8] rounded-3xl p-5 lg:px-4 lg:py-3 flex flex-col gap-4 lg:gap-2 shadow-lg w-full shrink-0">
      <div className="flex items-center justify-between border-b border-[#E3D6B8] pb-3 lg:pb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#DC2626] rounded-full"/>
          <h4 className="text-[#3B2F1E] text-sm font-bold tracking-wider uppercase"><T>{"Generated Photos\r\n          "}</T></h4>
        </div>
        <span className="text-[12px] text-[#6B5A40]"><T>{"Recent Output History\r\n        "}</T></span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 lg:flex lg:gap-3 lg:overflow-x-auto lg:overflow-y-hidden lg:pb-1">
        {generatedPhotos.length
            ? generatedPhotos.map((photo, idx) => (<button type="button" key={`${photo.id || photo.url.slice(0, 18)}-${idx}`} onClick={() => setPreviewPhoto(photo)} className="aspect-[3/4] lg:h-[clamp(64px,11vh,120px)] lg:shrink-0 bg-[#F3E9D2] border border-[#E3D6B8] rounded-xl overflow-hidden relative shadow-sm hover:border-[#DC2626] hover:ring-2 hover:ring-[#DC2626]/20 transition-all cursor-pointer group" title={t("Click to preview")}>
                <img src={photo.url} alt={t("Saved result")} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"/>

                <span className="absolute inset-x-2 bottom-2 rounded-lg bg-[#3B2F1E]/85 text-white px-2 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={11}/><T>{"Preview\r\n                "}</T></span>
              </button>))
            : Array.from({ length: 8 }).map((_, idx) => (<div key={idx} className="aspect-[3/4] lg:h-[clamp(64px,11vh,120px)] lg:shrink-0 bg-[#F6EEDB] border border-dashed border-[#E3D6B8] rounded-xl flex flex-col items-center justify-center text-[#7A6A50] text-[12px] gap-1">
                <ImageIcon size={16}/>
                <span><T>{"Empty slot"}</T></span>
              </div>))}
      </div>

      {previewPhoto && (<GeneratedPhotoPreview photo={previewPhoto} onClose={() => setPreviewPhoto(null)} onDownload={() => downloadHistoryImage(previewPhoto)} onPrint={async () => {
                setPreviewPhoto(null);
                openPrintStudioWithImage(previewPhoto.url);
            }} onDelete={async () => {
                await deleteHistoryImage(previewPhoto);
                setPreviewPhoto(null);
            }} onUseInEditor={async () => {
                await loadHistoryImage(previewPhoto);
                setPreviewPhoto(null);
            }}/>)}
    </section>);
}
