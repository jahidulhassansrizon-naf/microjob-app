"use client";
import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Download, Edit3, FileImage, Grid, Info, Loader2, Printer, Trash2, X, } from "lucide-react";
import { CLOTHING_NAMES } from "./clothingStyles";
import { applyFiltersToExportable, buildPrintStudioPayload, downloadPhotoFormat, downloadPhotoPrintSheet, } from "./photoExport";
import ImageEditSidebar, { FilterState, RESULT_DEFAULT_FILTERS, filterString, isNeutralFilters, } from "./ImageEditSidebar";

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
    /** Kept for compatibility; editing now happens in the inline dropdown. */
    onEdit?: (item: GeneratedResultItem) => void;
    onDelete: (item: GeneratedResultItem) => void;
    onPrint: (session: PrintSession) => void;
    onClose: () => void;
    /** Current brightness / contrast / ... values (owned by the page so the main preview can follow them live). */
    filters: FilterState;
    onFiltersChange: React.Dispatch<React.SetStateAction<FilterState>>;
    /** Changes every time a photo has just been generated; the edit dropdown opens automatically. */
    autoOpenToken?: number;
}

/**
 * Right-hand panel that opens as soon as a photo has been generated.
 * Same actions as the Recent Generations preview: Edit, Delete, Print, Download.
 */
export default function GeneratedResultPanel({ item, onDelete, onPrint, onClose, filters, onFiltersChange, autoOpenToken = 0, }: GeneratedResultPanelProps) {
    const { t } = useAiEditorText();
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setShowDownloadMenu(false);
        setMessage(null);
    }, [item.id, item.url]);

    // A freshly generated photo opens the edit dropdown right away.
    useEffect(() => {
        setIsEditOpen(true);
    }, [autoOpenToken]);

    // Every export / print uses the photo exactly as the user sees it (filters baked in).
    const currentFilterCss = isNeutralFilters(filters) ? null : filterString(filters);
    // rawUrl = the photo before the default brightness was saved into the stored copy, so the slider always works from the real original.
    const getEditedItem = () => applyFiltersToExportable({ ...item, url: typeof item.rawUrl === "string" && item.rawUrl ? item.rawUrl : item.url }, currentFilterCss);

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
            const payload = await buildPrintStudioPayload(await getEditedItem());
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

    return (<aside className="w-full xl:w-[var(--ai-right-w)] max-w-[320px] xl:max-w-[var(--ai-right-w)] xl:h-full xl:flex xl:flex-col" aria-label={t("Photo actions")}>
      <div className="rounded-2xl border border-stone-200 bg-[#FBF6E8] p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:overflow-y-auto xl:[scrollbar-gutter:stable]">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={18} className="text-[#10B981] shrink-0"/>
            <h3 className="text-sm font-semibold text-[#3B2F1E] leading-snug"><AiT>{"Photo ready"}</AiT></h3>
          </div>
          <button type="button" onClick={onClose} aria-label={t("Close actions")} title={t("Close actions")} className="text-stone-500 hover:text-[#3B2F1E] p-1 rounded-md hover:bg-stone-200/70 transition cursor-pointer shrink-0">
            <X size={16}/>
          </button>
        </div>

        <div className="flex flex-col gap-1.5 xl:flex-1">
          {/* Edit: opens a dropdown right here under the button */}
          <div>
            <button type="button" onClick={() => setIsEditOpen((previous) => !previous)} aria-expanded={isEditOpen} className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer ${isEditOpen ? "bg-[#3B2F1E] text-white" : "bg-stone-200 hover:bg-stone-300 text-[#3B2F1E]"}`}>
              <Edit3 size={15}/><span className="flex-1 text-left"><AiT>{"Edit"}</AiT></span>
              <ChevronDown size={15} className={`transition-transform duration-300 ${isEditOpen ? "rotate-180" : ""}`}/>
            </button>
            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isEditOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} aria-hidden={!isEditOpen}>
              <div className="overflow-hidden min-h-0">
                <div className="pt-1.5">
                  <ImageEditSidebar inline isOpen filters={filters} setFilters={onFiltersChange} resetFilters={RESULT_DEFAULT_FILTERS} onClose={() => setIsEditOpen(false)} onReset={() => setMessage(null)}/>
                </div>
              </div>
            </div>
          </div>

          {/* Delete */}
          <button type="button" onClick={() => onDelete(item)} className="w-full xl:mt-auto bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer">
            <Trash2 size={15}/><AiT>{"Delete"}</AiT>
          </button>

          {/* Print: the highlighted main action */}
          <div className="relative my-1">
            <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 opacity-60 blur-md animate-pulse"/>
            <button type="button" onClick={handlePrint} disabled={isPreparingPrint} className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 px-3 py-3 text-white ring-2 ring-white/80 shadow-[0_6px_18px_rgba(234,88,12,0.45)] flex items-center gap-3 transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.99] disabled:opacity-70 cursor-pointer">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 blur-sm animate-[pulse_2.2s_ease-in-out_infinite]"/>
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/25 ring-1 ring-white/50">
                {isPreparingPrint ? <Loader2 size={22} className="animate-spin"/> : <Printer size={24}/>}
              </span>
              <span className="relative flex-1 text-left leading-tight">
                <span className="block text-[17px] font-extrabold tracking-wide drop-shadow-sm"><AiT>{"Print"}</AiT></span>
                <span className="block text-[11.5px] font-medium text-white/95"><AiT>{"Print directly from here"}</AiT></span>
              </span>
              <ArrowRight size={18} className="relative shrink-0 animate-pulse"/>
            </button>
          </div>

          {/* Download */}
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setShowDownloadMenu((previous) => !previous)} disabled={isDownloading} className="w-full bg-[#10B981] hover:bg-emerald-600 disabled:opacity-60 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition cursor-pointer shadow-md">
              {isDownloading ? <Loader2 size={15} className="animate-spin"/> : <Download size={15}/>}
              <span className="flex-1 text-left">{isDownloading ? <AiT>{"Downloading..."}</AiT> : <AiT>{"Download"}</AiT>}</span>
              <ChevronDown size={15} className={`transition-transform ${showDownloadMenu ? "rotate-180" : ""}`}/>
            </button>

            {showDownloadMenu && (<div className="mt-2 w-full bg-[#F2E8D2] text-[#3B2F1E] rounded-xl shadow-lg border border-stone-300 py-2 text-sm">
                <div className="px-3 py-1.5 border-b border-stone-200 font-semibold text-stone-500 text-[12px] uppercase"><AiT>{"Select Format"}</AiT></div>
                <button type="button" onClick={() => runDownload(async () => downloadPhotoFormat(await getEditedItem(), "jpg"))} className="w-full text-left px-3 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#10B981]/20 text-[#10B981] rounded-lg shrink-0"><FileImage size={16}/></div>
                  <div>
                    <div className="font-semibold"><AiT>{"Standard JPG"}</AiT></div>
                    <div className="text-[12px] text-stone-500"><AiT>{"Recommended for Passport & Visa"}</AiT></div>
                  </div>
                </button>
                <button type="button" onClick={() => runDownload(async () => downloadPhotoFormat(await getEditedItem(), "png"))} className="w-full text-left px-3 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
                  <div className="p-1.5 bg-[#DC2626]/20 text-[#DC2626] rounded-lg shrink-0"><FileImage size={16}/></div>
                  <div>
                    <div className="font-semibold"><AiT>{"HD PNG Image"}</AiT></div>
                    <div className="text-[12px] text-stone-500">
                      {isTransparent ? <AiT>{"Lossless PNG • keeps transparency"}</AiT> : <AiT>{"Lossless High Quality"}</AiT>}
                    </div>
                  </div>
                </button>
                <div className="my-1 border-t border-stone-200"/>
                <button type="button" onClick={() => runDownload(async () => downloadPhotoPrintSheet(await getEditedItem()))} className="w-full text-left px-3 py-2.5 hover:bg-stone-100 flex items-center gap-2.5 transition cursor-pointer">
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

      </div>
    </aside>);
}
