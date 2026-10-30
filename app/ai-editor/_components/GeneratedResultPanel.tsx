"use client";
import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Download, Edit3, FileImage, Grid, Info, Loader2, Printer, Trash2, X, } from "lucide-react";
import { CLOTHING_NAMES } from "./clothingStyles";
import { buildPrintStudioPayload, downloadPhotoFormat, downloadPhotoPrintSheet, } from "./photoExport";

export interface GeneratedResultItem {
    id?: string;
    url: string;
    originalUrl?: string;
    bgColor?: string;
    size?: string;
    clothingStyle?: string;
    dpi?: number;
    widthPx?: number;
    heightPx?: number;
    [key: string]: unknown;
}

export interface PrintSession {
    image: string;
    preset: { id: string; label: string; widthMm: number; heightMm: number };
}

interface GeneratedResultPanelProps {
    item: GeneratedResultItem;
    onEdit: (item: GeneratedResultItem) => void;
    onDelete: (item: GeneratedResultItem) => void;
    onPrint: (session: PrintSession) => void;
    onClose: () => void;
}

/**
 * Right-hand panel that opens as soon as a photo has been generated.
 * Same actions as the Recent Generations preview: Edit, Delete, Print, Download.
 */
export default function GeneratedResultPanel({ item, onEdit, onDelete, onPrint, onClose, }: GeneratedResultPanelProps) {
    const { t } = useAiEditorText();
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setShowDownloadMenu(false);
        setMessage(null);
    }, [item.id, item.url]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const bgHex = item.bgColor || "#FFFFFF";
    const isTransparent = bgHex === "transparent";
    const styleMatch = /^Style (\d+)$/.exec(item.clothingStyle || "");
    const clothingInfo = styleMatch
        ? (CLOTHING_NAMES[Number(styleMatch[1])] || "Default Clothing")
        : (item.clothingStyle || "Default Clothing");

    const runDownload = async (job: () => Promise<void>) => {
        setShowDownloadMenu(false);
        setIsDownloading(true);
        setMessage(null);
        try {
            await job();
        }
        catch (error) {
            console.error("Download failed:", error);
            setMessage(error instanceof Error ? error.message : "The image could not be exported.");
        }
        finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = async () => {
        setMessage(null);
        setIsPreparingPrint(true);
        try {
            const payload = await buildPrintStudioPayload(item);
            onPrint({ image: payload.dataUrl, preset: payload.preset });
        }
        catch (error) {
            console.error("Opening print studio failed:", error);
            setMessage(error instanceof Error ? error.message : "Could not open the print studio.");
        }
        finally {
            setIsPreparingPrint(false);
        }
    };

    return (<aside className="w-full xl:w-[280px] max-w-[320px] xl:max-w-[280px]" aria-label={t("Photo actions")}>
      <div className="rounded-2xl border border-stone-200 bg-[#FBF6E8] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={18} className="text-[#10B981] shrink-0"/>
            <h3 className="text-sm font-semibold text-[#3B2F1E] leading-snug"><AiT>{"Photo ready"}</AiT></h3>
          </div>
          <button type="button" onClick={onClose} aria-label={t("Close actions")} title={t("Close actions")} className="text-stone-500 hover:text-[#3B2F1E] p-1 rounded-md hover:bg-stone-200/70 transition cursor-pointer shrink-0">
            <X size={16}/>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {/* Edit */}
          <button type="button" onClick={() => onEdit(item)} className="w-full bg-stone-200 hover:bg-stone-300 text-[#3B2F1E] px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer">
            <Edit3 size={15}/><AiT>{"Edit"}</AiT>
          </button>

          {/* Delete */}
          <button type="button" onClick={() => onDelete(item)} className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer">
            <Trash2 size={15}/><AiT>{"Delete"}</AiT>
          </button>

          {/* Print */}
          <button type="button" onClick={handlePrint} disabled={isPreparingPrint} className="w-full bg-stone-200 hover:bg-stone-300 disabled:opacity-60 text-[#3B2F1E] px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer">
            {isPreparingPrint ? <Loader2 size={15} className="animate-spin"/> : <Printer size={15}/>}<AiT>{"Print"}</AiT>
          </button>

          {/* Download */}
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setShowDownloadMenu((previous) => !previous)} disabled={isDownloading} className="w-full bg-[#10B981] hover:bg-emerald-600 disabled:opacity-60 text-white px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer shadow-md">
              {isDownloading ? <Loader2 size={15} className="animate-spin"/> : <Download size={15}/>}
              <span className="flex-1 text-left">{isDownloading ? <AiT>{"Downloading..."}</AiT> : <AiT>{"Download"}</AiT>}</span>
              <ChevronDown size={15} className={`transition-transform ${showDownloadMenu ? "rotate-180" : ""}`}/>
            </button>

            {showDownloadMenu && (<div className="mt-2 w-full bg-[#F2E8D2] text-[#3B2F1E] rounded-xl shadow-lg border border-stone-300 py-2 text-sm">
                <div className="px-3 py-1.5 border-b border-stone-200 font-semibold text-stone-500 text-[12px] uppercase"><AiT>{"Select Format"}</AiT></div>
                <button type="button" onClick={() => runDownload(() => downloadPhotoFormat(item, "jpg"))} className="w-full text-left px-3 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#10B981]/20 text-[#10B981] rounded-lg shrink-0"><FileImage size={16}/></div>
                  <div>
                    <div className="font-semibold"><AiT>{"Standard JPG"}</AiT></div>
                    <div className="text-[12px] text-stone-500"><AiT>{"Recommended for Passport & Visa"}</AiT></div>
                  </div>
                </button>
                <button type="button" onClick={() => runDownload(() => downloadPhotoFormat(item, "png"))} className="w-full text-left px-3 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#DC2626]/20 text-[#DC2626] rounded-lg shrink-0"><FileImage size={16}/></div>
                  <div>
                    <div className="font-semibold"><AiT>{"HD PNG Image"}</AiT></div>
                    <div className="text-[12px] text-stone-500">
                      {isTransparent ? <AiT>{"Lossless PNG • keeps transparency"}</AiT> : <AiT>{"Lossless High Quality"}</AiT>}
                    </div>
                  </div>
                </button>
                <div className="my-1 border-t border-stone-200"/>
                <button type="button" onClick={() => runDownload(() => downloadPhotoPrintSheet(item))} className="w-full text-left px-3 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#DC2626]/20 text-[#DC2626] rounded-lg shrink-0"><Grid size={16}/></div>
                  <div>
                    <div className="font-semibold"><AiT>{"Print Sheet (4×6\")"}</AiT></div>
                    <div className="text-[12px] text-stone-500"><AiT>{"8-copy grid layout"}</AiT></div>
                  </div>
                </button>
              </div>)}
          </div>
        </div>

        {message && (<p className="mt-3 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">{message}</p>)}

        {/* Generation info */}
        <div className="mt-4 pt-3 border-t border-stone-300">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-[#DC2626]"/>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#3B2F1E]"><AiT>{"Generation Info"}</AiT></h4>
          </div>
          <div className="space-y-1.5 text-[13px] text-stone-700">
            <div className="flex justify-between items-center bg-white/60 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <span className="text-stone-500"><AiT>{"Photo Size:"}</AiT></span>
              <span className="font-bold text-[#DC2626]">{item.size || "35×45 mm"}</span>
            </div>
            <div className="flex justify-between items-center bg-white/60 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <span className="text-stone-500"><AiT>{"Background:"}</AiT></span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-stone-300" style={isTransparent ? undefined : { backgroundColor: bgHex }}/>
                <span className="font-medium text-[#3B2F1E]">{isTransparent ? <AiT>{"Transparent"}</AiT> : bgHex}</span>
              </span>
            </div>
            <div className="flex justify-between items-center bg-white/60 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <span className="text-stone-500"><AiT>{"Clothing:"}</AiT></span>
              <span className="font-medium text-[#3B2F1E] truncate max-w-[110px]"><AiT>{clothingInfo}</AiT></span>
            </div>
          </div>
        </div>
      </div>
    </aside>);
}
