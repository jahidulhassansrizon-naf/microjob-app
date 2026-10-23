import { BulkT, useBulkPhotoText } from "./bulkPhotoI18n";
import { AlertCircle, CheckCircle2, Download, LoaderCircle, RotateCcw, Upload, } from "lucide-react";
import type { PhotoItem } from "./types";
interface BulkPhotoStageProps {
    photos: PhotoItem[];
    onAddPhotos: (files: File[]) => void;
    onDownloadResult: (photo: PhotoItem) => void;
    onRetryPhoto: (photoId: string) => void;
    isProcessing: boolean;
}
const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, onAddPhotos: (files: File[]) => void) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length)
        onAddPhotos(files);
    event.target.value = "";
};
export default function BulkPhotoStage({ photos, onAddPhotos, onDownloadResult, onRetryPhoto, isProcessing, }: BulkPhotoStageProps) {
    const { t } = useBulkPhotoText();
    if (photos.length === 0) {
        return (<div className="flex h-full min-h-[460px] flex-1 items-center justify-center scroll overflow-auto p-4 sm:p-8">
        <label className="flex h-[460px] w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#B0A080] bg-[#FBF6E8] p-8 text-center shadow-sm transition duration-200 ease-out hover:border-[#DC2626]/50 hover:bg-[#EFE3C8] focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-[#DC2626]/20">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => handleInputChange(event, onAddPhotos)}/>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#E3D6B8] bg-[#F6EEDB] text-[#DC2626] shadow-sm">
            <Upload size={22}/>
          </div>
          <h3 className="text-[18px] font-semibold text-[#3B2F1E]"><BulkT>{"Add 2 or more photos"}</BulkT></h3>
          <p className="mt-2 max-w-sm text-[14px] leading-[1.7] text-[#6B5A40]"><BulkT>{"Add your photos, select the exact AI operations you need, and process\n            the batch one photo at a time.\n          "}</BulkT></p>
          <span className="mt-4 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-1.5 text-[14px] font-mono font-semibold text-[#6B5A40] shadow-sm"><BulkT>{"Ctrl+U\n          "}</BulkT></span>
        </label>
      </div>);
    }
    const completedCount = photos.filter((photo) => photo.status === "success").length;
    const processingCount = photos.filter((photo) => photo.status === "processing").length;
    const failedCount = photos.filter((photo) => photo.status === "error").length;
    return (<div className="scroll flex min-h-[460px] flex-1 items-start justify-center overflow-auto p-4 sm:p-8">
      <div className="w-full max-w-6xl rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-semibold text-[#3B2F1E]"><BulkT>{"Bulk AI results\n            "}</BulkT></h3>
            <p className="mt-1 text-[14px] leading-[1.6] text-[#6B5A40]"><BulkT>{"Each photo is sent to the existing AI edit pipeline separately, so\n              one photo never becomes a collage or a replacement for another.\n            "}</BulkT></p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-1 text-[13px] font-bold text-[#5A4A32]">
              <BulkT>{`${completedCount}/${photos.length} done`}</BulkT></span>

            {processingCount > 0 && (<span className="rounded-full border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-1 text-[13px] font-bold text-[#B91C1C]">
                <BulkT>{`${processingCount} processing`}</BulkT></span>)}

            {failedCount > 0 && (<span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[13px] font-bold text-red-700">
                <BulkT>{`${failedCount} failed`}</BulkT></span>)}

            <label className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[15px] font-semibold transition duration-200 ease-out focus-within:ring-2 focus-within:ring-[#DC2626]/40 ${isProcessing
            ? "cursor-not-allowed border-[#E3D6B8] bg-[#F6EEDB] text-[#6B5A40] opacity-70"
            : "cursor-pointer border-[#FBB6B6] bg-[#FBF6E8] text-[#B91C1C] hover:bg-[#FEE9E9] active:scale-[0.98]"}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={isProcessing} onChange={(event) => handleInputChange(event, onAddPhotos)}/>
              <Upload size={15}/><BulkT>{"Add more\n            "}</BulkT></label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => {
            const displayUrl = photo.resultUrl || photo.preview;
            const isResult = photo.status === "success" && Boolean(photo.resultUrl);
            return (<article key={photo.id} className="overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#F6EEDB]">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#E3D6B8]">
                  <img src={displayUrl} alt={t(isResult ? `AI edited photo ${index + 1}` : `Bulk preview ${index + 1}`)} className="h-full w-full object-cover"/>

                  <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#3B2F1E]/80 px-2.5 py-1 text-[12px] font-bold text-white"><BulkT>{`Photo ${index + 1}`}</BulkT>
                    </span>

                    {isResult && (<span className="rounded-full bg-emerald-500/95 px-2.5 py-1 text-[12px] font-bold text-white"><BulkT>{"AI Result\n                      "}</BulkT></span>)}

                    {photo.status === "pending" && (<span className="rounded-full bg-[#3B2F1E]/80 px-2.5 py-1 text-[12px] font-bold text-white"><BulkT>{"Waiting\n                      "}</BulkT></span>)}
                  </div>

                  {photo.status === "processing" && (<div className="absolute inset-0 overflow-hidden bg-black/20">
                      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(220,38,38,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.10)_1px,transparent_1px)] [background-size:24px_24px] animate-pulse"/>
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#F87171] to-transparent shadow-[0_0_18px_rgba(248,113,113,0.95)] motion-safe:animate-[bulkScan_2.2s_ease-in-out_infinite]"/>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-2xl border border-white/20 bg-[#3B2F1E]/85 px-4 py-3 text-center shadow-xl backdrop-blur">
                          <LoaderCircle size={22} className="mx-auto animate-spin text-[#FCA5A5]"/>
                          <p className="mt-2 text-[15px] font-bold text-white"><BulkT>{"AI editing...\n                          "}</BulkT></p>
                          <p className="mt-1 text-[13px] font-medium text-[#E9DDC3]"><BulkT>{"Applying selected operations only\n                          "}</BulkT></p>
                        </div>
                      </div>
                    </div>)}

                  {photo.status === "success" && (<div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[12px] font-bold text-white">
                      <CheckCircle2 size={12}/><BulkT>{"Completed\n                    "}</BulkT></div>)}

                  {photo.status === "error" && (<div className="scroll absolute inset-x-2 bottom-2 max-h-[65%] overflow-y-auto rounded-xl border border-red-200 bg-[#FBF6E8]/95 p-3 shadow-sm backdrop-blur">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500"/>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-red-700"><BulkT>{"AI edit failed\n                          "}</BulkT></p>
                          <p className="mt-1 break-words text-[13px] leading-[1.5] text-red-700">
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
                      <p className="mt-0.5 text-[13px] text-[#6B5A40]">
                        {photo.status === "success"
                ? <BulkT>{"Ready to download"}</BulkT> : photo.status === "processing"
                ? <BulkT>{"This photo is being edited"}</BulkT>
                : photo.status === "error"
                    ? <BulkT>{"Retry this photo"}</BulkT>
                    : <BulkT>{"Waiting for the AI queue"}</BulkT>}
                      </p>
                    </div>

                    {photo.status === "success" && photo.resultUrl && (<button type="button" onClick={() => onDownloadResult(photo)} className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#DC2626] px-3 py-2 text-[15px] font-semibold text-white transition duration-200 ease-out hover:bg-[#B91C1C] active:scale-[0.98] active:bg-[#991B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6EEDB]">
                        <Download size={15}/><BulkT>{"Download\n                      "}</BulkT></button>)}

                    {photo.status === "error" && (<button type="button" onClick={() => onRetryPhoto(photo.id)} disabled={isProcessing} className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-3 py-2 text-[15px] font-semibold text-[#B91C1C] transition duration-200 ease-out hover:bg-[#FEE9E9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6EEDB] disabled:cursor-not-allowed disabled:opacity-70">
                        <RotateCcw size={15}/><BulkT>{"Retry\n                      "}</BulkT></button>)}
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
    </div>);
}
