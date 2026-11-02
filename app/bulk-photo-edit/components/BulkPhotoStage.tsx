import { useState } from "react";
import { BulkT, useBulkPhotoText } from "./bulkPhotoI18n";
import { AlertCircle, CheckCircle2, Download, Eye, ImagePlus, MousePointerClick, RotateCcw, Upload, } from "lucide-react";
import type { PhotoItem } from "./types";
import { GateOverlay } from "../../_components/GateOverlay";

interface BulkPhotoStageProps {
    photos: PhotoItem[];
    onAddPhotos: (files: File[]) => void;
    onDownloadResult: (photo: PhotoItem) => void;
    onDownloadAll: () => void;
    onRetryPhoto: (photoId: string) => void;
    isProcessing: boolean;
    processedCount: number;
}

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, onAddPhotos: (files: File[]) => void) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length)
        onAddPhotos(files);
    event.target.value = "";
};

const BULK_GATE_STAGES = [
    "Measuring your photo",
    "Detecting face and landmarks",
    "Applying selected AI tools",
    "Refining the details",
];

const HOW_IT_WORKS = [
    { icon: ImagePlus, title: "Upload your photos", text: "Add 2 to 20 photos in one go." },
    { icon: MousePointerClick, title: "Select AI tools", text: "Choose exactly what you want to change." },
    { icon: Download, title: "Download results", text: "Each photo is edited separately and saved to My Files." },
];

export default function BulkPhotoStage({ photos, onAddPhotos, onDownloadResult, onDownloadAll, onRetryPhoto, isProcessing, processedCount, }: BulkPhotoStageProps) {
    const { t } = useBulkPhotoText();
    const [dragging, setDragging] = useState(false);
    const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});

    if (photos.length === 0) {
        return (<div className="scroll flex min-h-[420px] flex-1 flex-col items-center justify-center gap-5 overflow-auto p-4 sm:p-8">
        <label
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); const files = Array.from(event.dataTransfer.files ?? []); if (files.length) onAddPhotos(files); }}
          className={`flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-10 text-center shadow-sm transition duration-200 ease-out focus-within:ring-2 focus-within:ring-[#DC2626]/30 ${dragging ? "border-[#DC2626] bg-[#FEE9E9]" : "border-[#B0A080] bg-[#FBF6E8] hover:border-[#DC2626]/60 hover:bg-[#FFF8EA]"}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => handleInputChange(event, onAddPhotos)}/>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE9E9] text-[#DC2626] shadow-sm">
            <Upload size={26}/>
          </div>
          <h3 className="text-[20px] font-bold text-[#3B2F1E]"><BulkT>{"Add 2 or more photos"}</BulkT></h3>
          <p className="mt-2 max-w-md text-[14px] leading-[1.7] text-[#6B5A40]"><BulkT>{"Add your photos, select the exact AI operations you need, and process the batch one photo at a time."}</BulkT></p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#D42020] px-5 py-2.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#AE1717]">
            <ImagePlus size={17}/><BulkT>{"Add photos"}</BulkT>
          </span>
          <span className="mt-3 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] px-2.5 py-1 font-mono text-[13px] font-semibold text-[#6B5A40]">Ctrl+U</span>
        </label>

        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item, index) => {
            const Icon = item.icon;
            return (<div key={item.title} className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FEE9E9] text-[#DC2626]"><Icon size={15}/></span>
                <span className="text-[12px] font-extrabold text-[#DC2626]">{index + 1}</span>
              </div>
              <p className="mt-2 text-[14.5px] font-bold text-[#3B2F1E]"><BulkT>{item.title}</BulkT></p>
              <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[#6B5A40]"><BulkT>{item.text}</BulkT></p>
            </div>);
          })}
        </div>
      </div>);
    }

    const completedCount = photos.filter((photo) => photo.status === "success").length;
    const processingCount = photos.filter((photo) => photo.status === "processing").length;
    const failedCount = photos.filter((photo) => photo.status === "error").length;
    const progress = photos.length > 0 ? Math.round((processedCount / photos.length) * 100) : 0;

    return (<>
      <div className="shrink-0 border-b border-[#E3D6B8] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-8 w-1 rounded-full bg-[#DC2626]"/>
            <div>
              <h3 className="text-[17px] font-bold leading-tight text-[#3B2F1E]"><BulkT>{"Bulk AI results"}</BulkT></h3>
              <p className="text-[12.5px] text-[#6B5A40]"><BulkT>{`${completedCount}/${photos.length} done`}</BulkT></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {processingCount > 0 && (<span className="rounded-full border border-[#FBB6B6] bg-[#FEE9E9] px-2.5 py-1 text-[12.5px] font-bold text-[#B91C1C]">
                <BulkT>{`${processingCount} processing`}</BulkT></span>)}

            {failedCount > 0 && (<span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[12.5px] font-bold text-red-700">
                <BulkT>{`${failedCount} failed`}</BulkT></span>)}

            <label className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[14px] font-semibold transition duration-200 ease-out focus-within:ring-2 focus-within:ring-[#DC2626]/40 ${isProcessing
            ? "cursor-not-allowed border-[#E3D6B8] bg-[#F6EEDB] text-[#6B5A40] opacity-70"
            : "cursor-pointer border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:border-[#DC2626]/40 hover:bg-[#EFE3C8] active:scale-[0.98]"}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={isProcessing} onChange={(event) => handleInputChange(event, onAddPhotos)}/>
              <Upload size={14}/><BulkT>{"Add more"}</BulkT></label>

            <button type="button" onClick={onDownloadAll} disabled={completedCount === 0 || isProcessing} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#D42020] px-3.5 py-1.5 text-[14px] font-bold text-white shadow-sm transition duration-200 ease-out hover:bg-[#AE1717] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2E8D2]">
              <Download size={14}/><BulkT>{"Download all"}</BulkT>
            </button>
          </div>
        </div>

        {isProcessing && (<div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E3D6B8]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#F87171] to-[#DC2626] transition-all duration-500" style={{ width: `${Math.max(progress, 4)}%` }}/>
            </div>
          </div>)}
      </div>

      <div className="scroll min-h-0 flex-1 overflow-auto p-4 pb-16 sm:p-5 sm:pb-16">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {photos.map((photo, index) => {
            const isResult = photo.status === "success" && Boolean(photo.resultUrl);
            const viewingOriginal = Boolean(showOriginal[photo.id]);
            const displayUrl = isResult && !viewingOriginal ? (photo.resultUrl as string) : photo.preview;
            return (<article key={photo.id} className="overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-sm transition duration-200 hover:shadow-md">
                <div className="relative aspect-[4/4.4] overflow-hidden bg-[#E3D6B8]">
                  <img src={displayUrl} alt={t(isResult ? `AI edited photo ${index + 1}` : `Bulk preview ${index + 1}`)} className="h-full w-full object-cover"/>

                  <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#3B2F1E]/80 px-2.5 py-1 text-[12px] font-bold text-white"><BulkT>{`Photo ${index + 1}`}</BulkT>
                    </span>

                    {isResult && (<span className={`rounded-full px-2.5 py-1 text-[12px] font-bold text-white ${viewingOriginal ? "bg-[#6B5A40]/90" : "bg-emerald-500/95"}`}><BulkT>{viewingOriginal ? "Original" : "AI Result"}</BulkT></span>)}

                    {photo.status === "pending" && (<span className="rounded-full bg-[#3B2F1E]/70 px-2.5 py-1 text-[12px] font-bold text-white"><BulkT>{"Waiting"}</BulkT></span>)}
                  </div>

                  {isResult && (<button type="button" onClick={() => setShowOriginal((current) => ({ ...current, [photo.id]: !current[photo.id] }))} className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#FBF6E8]/95 px-2.5 py-1.5 text-[12.5px] font-bold text-[#3B2F1E] shadow-sm backdrop-blur transition hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
                      <Eye size={13}/><BulkT>{viewingOriginal ? "Show AI result" : "Show original"}</BulkT>
                    </button>)}

                  {/* Same generating animation as the AI Editor (doors close, photo is processed, doors open). */}
                  <GateOverlay active={photo.status === "processing"} image={displayUrl} background="#F3E9D2" t={t} stages={BULK_GATE_STAGES}/>

                  {photo.status === "error" && (<div className="scroll absolute inset-x-2 bottom-2 max-h-[65%] overflow-y-auto rounded-xl border border-red-200 bg-[#FBF6E8]/95 p-3 shadow-sm backdrop-blur">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500"/>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-bold text-red-700"><BulkT>{"AI edit failed"}</BulkT></p>
                          <p className="mt-1 break-words text-[12.5px] leading-[1.5] text-red-700">
                            <BulkT>{photo.error || "Unknown error."}</BulkT>
                          </p>
                        </div>
                      </div>
                    </div>)}
                </div>

                <div className="border-t border-[#E3D6B8] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#3B2F1E]">
                        {photo.file.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[#6B5A40]">
                        {photo.status === "success"
                ? <><CheckCircle2 size={12} className="text-emerald-600"/><BulkT>{"Ready to download"}</BulkT></> : photo.status === "processing"
                ? <BulkT>{"This photo is being edited"}</BulkT>
                : photo.status === "error"
                    ? <BulkT>{"Retry this photo"}</BulkT>
                    : <BulkT>{"Waiting for the AI queue"}</BulkT>}
                      </p>
                    </div>

                    {photo.status === "success" && photo.resultUrl && (<button type="button" onClick={() => onDownloadResult(photo)} className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#DC2626] px-3 py-2 text-[14px] font-semibold text-white transition duration-200 ease-out hover:bg-[#B91C1C] active:scale-[0.98] active:bg-[#991B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF6E8]">
                        <Download size={14}/><BulkT>{"Download"}</BulkT></button>)}

                    {photo.status === "error" && (<button type="button" onClick={() => onRetryPhoto(photo.id)} disabled={isProcessing} className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-3 py-2 text-[14px] font-semibold text-[#B91C1C] transition duration-200 ease-out hover:bg-[#FEE9E9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 disabled:cursor-not-allowed disabled:opacity-70">
                        <RotateCcw size={14}/><BulkT>{"Retry"}</BulkT></button>)}
                  </div>
                </div>
              </article>);
        })}
        </div>

        <style jsx>{`
          @keyframes bulkScan {
            0% {
              transform: translateY(0);
              opacity: 0.35;
            }
            45% {
              transform: translateY(calc(100% + 220px));
              opacity: 1;
            }
            50% {
              transform: translateY(calc(100% + 220px));
              opacity: 1;
            }
            100% {
              transform: translateY(0);
              opacity: 0.35;
            }
          }
        `}</style>
      </div>
    </>);
}
