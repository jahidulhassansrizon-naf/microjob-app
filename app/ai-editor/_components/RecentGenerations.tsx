"use client";
import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useRef, useState } from "react";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    FileArchive,
    FileImage,
    FileText,
    Printer,
    Settings,
    Trash2,
    X,
} from "lucide-react";
import { downloadPhotosArchive, downloadPhotosPdf } from "./photoExport";
import type { PrintSessionMeta } from "./printSessionStore";
import { getAiEditorThumbnailUrl } from "./aiEditorData";

export interface GenerationItem {
    id?: string | number;
    url: string;
    bgColor?: string;
    size?: string;
    clothingStyle?: string;
    createdAt?: unknown;
    sizeType?: string;
    widthPx?: number;
    heightPx?: number;
    dpi?: number;
    [key: string]: unknown;
}
type BulkAction = "print" | "png" | "jpg" | "pdf";
export interface RecentGenerationsProps {
    generations?: GenerationItem[];
    onImageClick?: (item: GenerationItem) => void;
    onBulkPrint?: (items: GenerationItem[]) => void | Promise<void>;
    isLoading?: boolean;
    /** Print layouts the user chose to keep when closing the print studio. */
    savedSessions?: PrintSessionMeta[];
    onOpenSaved?: (id: string) => void | Promise<void>;
    onDeleteSaved?: (id: string) => void | Promise<void>;
}
const TRANSPARENT_THUMBNAIL_STYLE: React.CSSProperties = {
    backgroundImage: "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
    backgroundSize: "12px 12px",
    backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
    backgroundColor: "#ffffff",
};
function displayDate(value: unknown) {
    if (!value) return "";
    if (typeof (value as { toDate?: unknown })?.toDate === "function") {
        try { return (value as { toDate: () => Date }).toDate().toLocaleDateString(); }
        catch { return ""; }
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}
function imageKey(item: GenerationItem, index: number) {
    return `${String(item.id ?? "generation")}:${index}:${item.url}`;
}

function RecentLoadingAnimation() {
    return (<div role="status" aria-label="Loading recent photos" className="rg-anim flex w-full flex-col justify-center gap-2">
        <div className="flex gap-4 overflow-hidden xl:gap-3">
            {Array.from({ length: 10 }).map((_, index) => (<div key={index} className="relative h-36 w-28 xl:h-[clamp(72px,10.5vh,112px)] xl:w-[calc(clamp(72px,10.5vh,112px)*0.78)] shrink-0 overflow-hidden rounded-xl border border-[#E3D6B8] bg-gradient-to-b from-[#FBF6E8] to-[#EADFC2]" style={{ animation: `rg-rise 500ms ease-out ${index * 70}ms both` }}>
                <span className="absolute inset-0 flex items-center justify-center text-[#D9C9A0]" style={{ animation: `rg-float 1.8s ease-in-out ${index * 140}ms infinite` }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="3.4"/><path d="M5 20c.8-3.6 3.5-5.6 7-5.6s6.2 2 7 5.6"/></svg>
                </span>
                <span className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" style={{ animation: `rg-sweep 1.6s ease-in-out ${index * 120}ms infinite` }}/>
            </div>))}
        </div>
        <div className="relative h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-[#E3D6B8]">
            <span className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-[#DC2626]" style={{ animation: "rg-line 1.4s ease-in-out infinite" }}/>
        </div>
    </div>);
}

export default function RecentGenerations({
    generations = [], onImageClick = () => { }, onBulkPrint, isLoading = false,
    savedSessions = [], onOpenSaved, onDeleteSaved,
}: RecentGenerationsProps) {
    const { t } = useAiEditorText();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showAll, setShowAll] = useState(false);
    const [showMeta, setShowMeta] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkMessage, setBulkMessage] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [openingId, setOpeningId] = useState<string | null>(null);
    const savedCount = savedSessions.length;
    const openSaved = async (id: string) => {
        if (!onOpenSaved || openingId)
            return;
        setOpeningId(id);
        try {
            await onOpenSaved(id);
        }
        finally {
            setOpeningId(null);
        }
    };
    const selectedItems = generations.filter((item, index) => selectedKeys.has(imageKey(item, index)));
    const isSelecting = bulkAction !== null;

    const scroll = (direction: "left" | "right") => {
        scrollRef.current?.scrollBy({ left: direction === "left" ? -520 : 520, behavior: "smooth" });
    };
    const startBulkAction = (action: BulkAction) => {
        if (!generations.length) return;
        setBulkAction(action);
        setSelectedKeys(new Set());
        setBulkMessage(null);
    };
    const toggleSelected = (item: GenerationItem, index: number) => {
        const key = imageKey(item, index);
        setSelectedKeys((current) => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };
    const cancelSelection = () => {
        setBulkAction(null);
        setSelectedKeys(new Set());
        setBulkMessage(null);
    };
    const runBulkAction = async () => {
        if (!selectedItems.length || !bulkAction || isProcessing) return;
        setIsProcessing(true);
        setBulkMessage(null);
        try {
            if (bulkAction === "print") {
                if (!onBulkPrint) throw new Error(t("Print Studio is not available."));
                await onBulkPrint(selectedItems);
                cancelSelection();
            }
            else if (bulkAction === "pdf") {
                await downloadPhotosPdf(selectedItems);
                cancelSelection();
            }
            else {
                await downloadPhotosArchive(selectedItems, bulkAction);
                cancelSelection();
            }
        }
        catch (error) {
            setBulkMessage(error instanceof Error ? t(error.message) : t("Could not complete the selected action."));
        }
        finally {
            setIsProcessing(false);
        }
    };
    const actionLabel = bulkAction === "print" ? "প্রিন্ট" : bulkAction === "png" ? "PNG ZIP" : bulkAction === "jpg" ? "JPG ZIP" : "এক PDF";

    const renderImageCard = (item: GenerationItem, index: number, compact = false) => {
        const selected = selectedKeys.has(imageKey(item, index));
        return (
            <button
                type="button"
                key={imageKey(item, index)}
                aria-pressed={isSelecting ? selected : undefined}
                onClick={() => isSelecting ? toggleSelected(item, index) : onImageClick(item)}
                className={`${compact ? `group relative ${item.side === "dual" ? "col-span-2 aspect-[90/55]" : "aspect-[4/5]"} ` : `group relative flex h-36 ${item.side === "dual" ? "w-56 xl:w-[calc(clamp(72px,10.5vh,112px)*1.56)]" : "w-28 xl:w-[calc(clamp(72px,10.5vh,112px)*0.78)]"} xl:h-[clamp(72px,10.5vh,112px)] shrink-0 flex-col `}overflow-hidden rounded-xl border bg-[#F2E8D2] text-left transition ${isSelecting && selected ? "border-[#DC2626] ring-2 ring-[#DC2626]" : "border-[#E3D6B8] hover:border-[#DC2626]"} cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DC2626]`}
                style={item.bgColor === "transparent" ? TRANSPARENT_THUMBNAIL_STYLE : undefined}
            >
                <img src={compact ? item.url : getAiEditorThumbnailUrl(item.url)} alt={t("Generated photo")} loading={!compact && index < 8 ? "eager" : "lazy"} decoding="async" ref={(el) => { if (el && el.complete) el.style.opacity = "1"; }} onLoad={(e) => { e.currentTarget.style.opacity = "1"; }} onError={(e) => { e.currentTarget.style.opacity = "1"; }} style={{ opacity: 0, transition: "opacity 450ms ease" }} className={`h-full w-full ${item.side === "dual" ? "object-contain" : "object-cover"}`} />
                {isSelecting ? (
                    <span className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow ${selected ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-white bg-black/35 text-transparent"}`}>
                        <Check size={15} strokeWidth={3} />
                    </span>
                ) : (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100"><AiT>View</AiT></span>
                )}
                {showMeta && !compact && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1.5 py-1 text-[11px] leading-tight text-white">
                        <AiT>{item.size || "Photo"}</AiT>{" "}
                        {displayDate(item.createdAt) ? <AiT>{`• ${displayDate(item.createdAt)}`}</AiT> : ""}
                    </span>
                )}
                {compact && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-left text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                        <AiT>{item.size || "Photo"}</AiT>
                    </span>
                )}
            </button>
        );
    };

    const renderSavedCards = () => savedSessions.map((session) => {
            const asking = confirmDeleteId === session.id;
            const date = new Date(session.updatedAt);
            return (<div key={session.id} className="group relative flex h-36 w-44 shrink-0 flex-col overflow-hidden rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] xl:h-[clamp(72px,10.5vh,112px)] xl:w-[clamp(120px,16vh,176px)]">
                <button type="button" onClick={() => { void openSaved(session.id); }} disabled={!!openingId} aria-label={`সংরক্ষিত প্রিন্ট খুলুন: ${session.photoCount}টি ছবি`} className="relative flex-1 min-h-0 cursor-pointer overflow-hidden disabled:cursor-wait">
                  <span className="grid h-full w-full grid-cols-2 gap-px bg-[#E3D6B8]">
                    {(session.thumbs.length ? session.thumbs.slice(0, 4) : [""]).map((thumb, index) => thumb
                        ? <img key={index} src={thumb} alt="" draggable={false} className="h-full w-full object-cover"/>
                        : <span key={index} className="h-full w-full bg-[#F2E8D2]"/>)}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">
                    {openingId === session.id ? "খোলা হচ্ছে..." : "খুলুন"}
                  </span>
                </button>
                <span className="block truncate bg-[#3B2F1E] px-2 py-1 text-[11px] leading-tight text-white">
                  {session.photoCount}টি ছবি · {session.pageCount} পেজ · {Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString()}
                </span>
                {asking ? (<div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/92 p-2 text-center">
                    <p className="text-[11px] font-bold text-[#3B2F1E]">মুছে ফেলবেন?</p>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => { setConfirmDeleteId(null); void onDeleteSaved?.(session.id); }} className="cursor-pointer rounded-md bg-[#DC2626] px-2 py-1 text-[11px] font-bold text-white hover:bg-[#B91C1C]">হ্যাঁ</button>
                      <button type="button" onClick={() => setConfirmDeleteId(null)} className="cursor-pointer rounded-md border border-[#E3D6B8] bg-white px-2 py-1 text-[11px] font-bold text-[#3B2F1E] hover:bg-[#F2E8D2]">না</button>
                    </div>
                  </div>) : (onDeleteSaved && (<button type="button" onClick={() => setConfirmDeleteId(session.id)} aria-label="সংরক্ষিত প্রিন্ট মুছুন" title="মুছুন" className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#DC2626] shadow transition hover:bg-white"><Trash2 size={12}/></button>))}
              </div>);
          });

    return (<>
      <section className="mt-4 w-full max-w-[1400px] xl:max-w-none shrink-0 rounded-2xl bg-[#F2E8D2] p-4 shadow-sm sm:p-6 xl:mt-3 xl:px-4 xl:py-2.5 text-[#3B2F1E]">
        <div className="mb-3 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-3 sm:p-4 xl:mb-2 xl:px-3 xl:py-1.5">
          <div className="xl:flex xl:flex-wrap xl:items-center xl:justify-between xl:gap-x-4 xl:gap-y-1.5">
          <div className="mb-3 xl:mb-0">
            <h3 className="text-lg font-extrabold text-[#3B2F1E] xl:text-base">একাধিক ছবি একসাথে সিলেক্ট করুন</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#3B2F1E]/70 sm:text-sm xl:hidden">ছবিগুলো বেছে নিয়ে একসাথে প্রিন্ট করুন, PNG/JPG ZIP হিসেবে ডাউনলোড করুন অথবা সবগুলো একটি PDF-এ নিন।</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!generations.length || isProcessing} onClick={() => startBulkAction("print")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-40"><Printer size={14}/>একসাথে প্রিন্ট</button>
            <button type="button" disabled={!generations.length || isProcessing} onClick={() => startBulkAction("png")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-40"><FileImage size={14}/>PNG ডাউনলোড</button>
            <button type="button" disabled={!generations.length || isProcessing} onClick={() => startBulkAction("jpg")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B2F1E] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#59452A] disabled:cursor-not-allowed disabled:opacity-40"><FileArchive size={14}/>JPG ডাউনলোড</button>
            <button type="button" disabled={!generations.length || isProcessing} onClick={() => startBulkAction("pdf")} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DC2626]/40 bg-white px-3 py-2 text-xs font-bold text-[#DC2626] transition hover:bg-[#DC2626]/5 disabled:cursor-not-allowed disabled:opacity-40"><FileText size={14}/>এক PDF ডাউনলোড</button>
          </div>
          </div>
          {isSelecting && (
            <div className="mt-3 rounded-lg border border-[#DC2626]/25 bg-white/70 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#3B2F1E]">{actionLabel} এর জন্য ছবি নির্বাচন করুন — {selectedItems.length}টি নির্বাচিত</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedKeys(new Set(generations.map(imageKey)))} className="rounded-md border border-[#E3D6B8] px-2.5 py-1 text-xs font-semibold hover:bg-[#F2E8D2]">সব নির্বাচন</button>
                  <button type="button" onClick={() => setSelectedKeys(new Set())} className="rounded-md border border-[#E3D6B8] px-2.5 py-1 text-xs font-semibold hover:bg-[#F2E8D2]">নির্বাচন মুছুন</button>
                  <button type="button" onClick={cancelSelection} className="rounded-md border border-[#E3D6B8] px-2.5 py-1 text-xs font-semibold hover:bg-[#F2E8D2]">বাতিল</button>
                </div>
              </div>
              <button type="button" onClick={runBulkAction} disabled={!selectedItems.length || isProcessing} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-40">
                {isProcessing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/>প্রসেস হচ্ছে...</> : <><Download size={15}/>নির্বাচিত {selectedItems.length}টি ছবি {actionLabel === "প্রিন্ট" ? "প্রিন্ট স্টুডিওতে পাঠান" : `${actionLabel} হিসেবে ডাউনলোড করুন`}</>}
              </button>
              {bulkAction === "png" || bulkAction === "jpg" ? <p className="mt-1.5 text-[11px] text-[#3B2F1E]/60">একাধিক ফাইল একসাথে রাখার জন্য একটি ZIP ফাইল ডাউনলোড হবে।</p> : null}
              {bulkAction === "pdf" ? <p className="mt-1.5 text-[11px] text-[#3B2F1E]/60">প্রতিটি নির্বাচিত ছবি PDF-এর আলাদা পৃষ্ঠায় থাকবে।</p> : null}
              {bulkMessage && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{bulkMessage}</p>}
            </div>
          )}
          {savedCount > 0 && (
            <div className="mt-3 border-t border-[#E3D6B8] pt-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-4 w-1.5 rounded-full bg-[#10B981]" />
                <h4 className="text-sm font-bold text-[#3B2F1E]">সংরক্ষিত প্রিন্ট</h4>
                <span className="rounded-full bg-[#DC2626]/10 px-2 py-0.5 text-[12px] font-semibold text-[#DC2626]">{savedCount}</span>
                <span className="text-[11px] text-[#3B2F1E]/55">খুলে আরও ছবি যোগ করুন বা প্রিন্ট করুন</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                {renderSavedCards()}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-[#E3D6B8] pb-3 sm:flex-row sm:items-center xl:mb-2 xl:pb-2">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-[#DC2626]" />
            <h3 className="text-base font-semibold text-[#3B2F1E]"><AiT>RECENT GENERATIONS</AiT></h3>
            <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[12px] font-semibold text-[#10B981]">{generations.length}</span>
            {isSelecting && <span className="rounded-full bg-[#DC2626]/10 px-2 py-0.5 text-[11px] font-bold text-[#DC2626]">{selectedItems.length}টি নির্বাচিত</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => scroll("left")} className="cursor-pointer rounded-lg border border-[#E3D6B8] p-1.5 text-[#3B2F1E] transition hover:bg-[#E3D6B8]" aria-label={t("Previous generations")}><ChevronLeft size={16}/></button>
            <button type="button" onClick={() => scroll("right")} className="cursor-pointer rounded-lg border border-[#E3D6B8] p-1.5 text-[#3B2F1E] transition hover:bg-[#E3D6B8]" aria-label={t("Next generations")}><ChevronRight size={16}/></button>
            <button type="button" onClick={() => setShowAll(true)} className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#DC2626] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#B91C1C]"><ExternalLink size={14}/><AiT>View all images</AiT></button>
            <button type="button" onClick={() => setShowMeta((previous) => !previous)} className={`cursor-pointer rounded-lg border p-1.5 transition ${showMeta ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]" : "border-[#E3D6B8] text-[#3B2F1E] hover:bg-[#E3D6B8]"}`} aria-label={t("Toggle generation details")}><Settings size={16}/></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex min-h-[150px] gap-4 overflow-x-auto pb-2 scrollbar-thin xl:min-h-[clamp(72px,10.5vh,112px)] xl:gap-3 xl:pb-1">
          {isLoading ? <RecentLoadingAnimation />
          : generations.length === 0 ? <div className="flex min-h-[150px] w-full items-center justify-center xl:min-h-[clamp(72px,10.5vh,112px)]"><p className="text-sm italic text-[#3B2F1E]/60"><AiT>No recent generations yet. Click “Generate Photo” to add images here.</AiT></p></div>
          : generations.map((item, index) => renderImageCard(item, index))}
        </div>
      </section>

      {showAll && <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && setShowAll(false)}>
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#F2E8D2] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3D6B8] p-4">
              <div><h2 className="text-base font-semibold text-[#3B2F1E]"><AiT>All generated images</AiT></h2><p className="text-sm text-[#3B2F1E]/60">{generations.length} <AiT>image(s)</AiT>{isSelecting ? ` • ${selectedItems.length} selected` : ""}</p></div>
              <button type="button" onClick={() => setShowAll(false)} className="cursor-pointer rounded-lg p-2 text-[#3B2F1E] transition hover:bg-[#E3D6B8]" aria-label={t("Close gallery")}><X size={18}/></button>
            </div>
            <div className="grid overflow-y-auto p-4 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
              {generations.map((item, index) => renderImageCard(item, index, true))}
            </div>
          </div>
        </div>}
    </>);
}
