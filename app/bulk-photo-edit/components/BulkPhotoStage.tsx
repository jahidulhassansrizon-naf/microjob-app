import {
  AlertCircle,
  CheckCircle2,
  Download,
  LoaderCircle,
  RotateCcw,
  Upload,
} from "lucide-react";
import type { PhotoItem } from "./types";

interface BulkPhotoStageProps {
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => void;
  onDownloadResult: (photo: PhotoItem) => void;
  onRetryPhoto: (photoId: string) => void;
  isProcessing: boolean;
}

const handleInputChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  onAddPhotos: (files: File[]) => void,
) => {
  const files = Array.from(event.target.files ?? []);
  if (files.length) onAddPhotos(files);
  event.target.value = "";
};

export default function BulkPhotoStage({
  photos,
  onAddPhotos,
  onDownloadResult,
  onRetryPhoto,
  isProcessing,
}: BulkPhotoStageProps) {
  if (photos.length === 0) {
    return (
      <div className="flex h-full min-h-[460px] flex-1 items-center justify-center overflow-auto p-4 sm:p-8">
        <label className="flex h-[460px] w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[#2563EB]/25 bg-white p-8 text-center shadow-sm transition hover:border-[#2563EB]/60 hover:bg-[#F8FBFF]">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(event) => handleInputChange(event, onAddPhotos)}
          />
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#2563EB] shadow-xs">
            <Upload size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Add 2 or more photos</h3>
          <p className="mt-2 max-w-sm text-[10px] leading-relaxed text-[#64748B]">
            Add your photos, select the exact AI operations you need, and process
            the batch one photo at a time.
          </p>
          <span className="mt-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[10px] font-mono font-semibold text-[#0F172A]/60 shadow-2xs">
            Ctrl+U
          </span>
        </label>
      </div>
    );
  }

  const completedCount = photos.filter(
    (photo) => photo.status === "success",
  ).length;
  const processingCount = photos.filter(
    (photo) => photo.status === "processing",
  ).length;
  const failedCount = photos.filter(
    (photo) => photo.status === "error",
  ).length;

  return (
    <div className="flex min-h-[460px] flex-1 items-start justify-center overflow-auto p-4 sm:p-8">
      <div className="w-full max-w-6xl rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-[#0F172A]">
              Bulk AI results
            </h3>
            <p className="mt-1 text-[10px] text-[#64748B]">
              Each photo is sent to the existing AI edit pipeline separately, so
              one photo never becomes a collage or a replacement for another.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[8px] font-black text-[#475569]">
              {completedCount}/{photos.length} done
            </span>

            {processingCount > 0 && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-black text-blue-700">
                {processingCount} processing
              </span>
            )}

            {failedCount > 0 && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[8px] font-black text-red-700">
                {failedCount} failed
              </span>
            )}

            <label
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold transition ${
                isProcessing
                  ? "cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]"
                  : "cursor-pointer border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:border-[#2563EB]/40 hover:text-[#2563EB]"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                disabled={isProcessing}
                onChange={(event) => handleInputChange(event, onAddPhotos)}
              />
              <Upload size={13} />
              Add more
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => {
            const displayUrl = photo.resultUrl || photo.preview;
            const isResult = photo.status === "success" && Boolean(photo.resultUrl);

            return (
              <article
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#E2E8F0]">
                  <img
                    src={displayUrl}
                    alt={
                      isResult
                        ? `AI edited photo ${index + 1}`
                        : `Bulk preview ${index + 1}`
                    }
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-black/65 px-2 py-1 text-[8px] font-bold text-white">
                      Photo {index + 1}
                    </span>

                    {isResult && (
                      <span className="rounded-full bg-emerald-500/95 px-2 py-1 text-[8px] font-black text-white">
                        AI Result
                      </span>
                    )}

                    {photo.status === "pending" && (
                      <span className="rounded-full bg-slate-900/70 px-2 py-1 text-[8px] font-black text-white">
                        Waiting
                      </span>
                    )}
                  </div>

                  {photo.status === "processing" && (
                    <div className="absolute inset-0 overflow-hidden bg-black/20">
                      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(37,99,235,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.10)_1px,transparent_1px)] [background-size:24px_24px] animate-pulse" />
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent shadow-[0_0_18px_rgba(34,211,238,0.95)] motion-safe:animate-[bulkScan_2.2s_ease-in-out_infinite]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-2xl border border-white/20 bg-slate-950/75 px-4 py-3 text-center shadow-xl backdrop-blur">
                          <LoaderCircle
                            size={20}
                            className="mx-auto animate-spin text-cyan-300"
                          />
                          <p className="mt-2 text-[10px] font-black text-white">
                            AI editing...
                          </p>
                          <p className="mt-1 text-[8px] font-medium text-slate-300">
                            Applying selected operations only
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {photo.status === "success" && (
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2 py-1 text-[8px] font-black text-white">
                      <CheckCircle2 size={10} />
                      Completed
                    </div>
                  )}

                  {photo.status === "error" && (
                    <div className="absolute inset-x-2 bottom-2 rounded-xl border border-red-200 bg-white/95 p-2.5 shadow-sm backdrop-blur">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-red-700">
                            AI edit failed
                          </p>
                          <p className="mt-1 break-words text-[8px] leading-relaxed text-red-600">
                            {photo.error || "Unknown error."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-black text-[#0F172A]">
                        {photo.file.name}
                      </p>
                      <p className="mt-0.5 text-[8px] text-[#64748B]">
                        {photo.status === "success"
                          ? "Ready to download"
                          : photo.status === "processing"
                            ? "This photo is being edited"
                            : photo.status === "error"
                              ? "Retry this photo"
                              : "Waiting for the AI queue"}
                      </p>
                    </div>

                    {photo.status === "success" && photo.resultUrl && (
                      <button
                        type="button"
                        onClick={() => onDownloadResult(photo)}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#2563EB] px-3 py-2 text-[9px] font-black text-white transition hover:bg-[#1D4ED8]"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    )}

                    {photo.status === "error" && (
                      <button
                        type="button"
                        onClick={() => onRetryPhoto(photo.id)}
                        disabled={isProcessing}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[9px] font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw size={12} />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
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
    </div>
  );
}
