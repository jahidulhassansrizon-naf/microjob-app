import { useEffect, useState } from "react";
import { BulkT, useBulkPhotoText } from "./bulkPhotoI18n";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ImagePlus, LoaderCircle, QrCode, Trash2, X } from "lucide-react";
import QrCodeSidebar from "@/app/ai-editor/_components/QrCodeSidebar";
import type { PhotoItem } from "./types";

interface PhotoUploaderProps {
    photos: PhotoItem[];
    onAddPhotos: (files: File[]) => void;
    onRemovePhoto: (id: string) => void;
    onClearPhotos: () => void;
    disabled: boolean;
    maxPhotos?: number;
}

export default function PhotoUploader({ photos, onAddPhotos, onRemovePhoto, onClearPhotos, disabled, maxPhotos = 20, }: PhotoUploaderProps) {
    const { t } = useBulkPhotoText();
    const [showPhoneUpload, setShowPhoneUpload] = useState(false);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        if (disabled) setShowPhoneUpload(false);
    }, [disabled]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length)
            onAddPhotos(files);
        event.target.value = "";
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length) onAddPhotos(files);
    };

    return (<aside className="order-1 flex w-full shrink-0 flex-col rounded-2xl bg-[#F2E8D2] p-4 text-[#3B2F1E] shadow-sm lg:w-auto lg:min-w-[300px] lg:flex-1 xl:min-h-0 xl:w-[300px] xl:flex-none">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DC2626] text-[13px] font-extrabold text-white shadow-sm">1</span>
          <h2 className="text-[17px] font-bold leading-tight"><BulkT>{"Add photos"}</BulkT></h2>
        </div>
        <span className="rounded-full border border-[#E3D6B8] bg-[#FBF6E8] px-2.5 py-0.5 text-[12.5px] font-bold tabular-nums text-[#5A4A32]">
          {photos.length}/{maxPhotos}
        </span>
      </div>

      <label
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`group flex h-32 w-full shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition duration-200 ease-out focus-within:ring-2 focus-within:ring-[#DC2626]/30 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${dragging ? "border-[#DC2626] bg-[#FEE9E9]" : "border-[#B0A080] bg-[#FBF6E8] hover:border-[#DC2626]/60 hover:bg-[#FFF8EA]"}`}>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleInputChange} disabled={disabled}/>
        <span className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE9E9] text-[#DC2626] transition duration-200 group-hover:bg-[#DC2626] group-hover:text-white">
          <ImagePlus size={20}/>
        </span>
        <span className="text-[14.5px] font-bold leading-snug text-[#3B2F1E]"><BulkT>{dragging ? "Drop photos here" : "Click to add photos or drag them here"}</BulkT></span>
        <span className="mt-0.5 text-[12px] font-medium text-[#6B5A40]"><BulkT>{"JPG, PNG, WEBP · up to 15 MB each"}</BulkT></span>
      </label>

      <div className="mt-2.5 shrink-0">
        <button
          type="button"
          onClick={() => setShowPhoneUpload((current) => !current)}
          disabled={disabled}
          aria-expanded={showPhoneUpload}
          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-[14.5px] font-semibold text-[#5A4A32] shadow-sm transition duration-200 ease-out hover:border-[#DC2626]/40 hover:bg-[#EFE3C8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
        >
          <span className="flex items-center gap-2"><QrCode size={17} className="text-[#DC2626]"/><BulkT>Upload from phone</BulkT></span>
          {showPhoneUpload ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showPhoneUpload && !disabled && (
          <div className="mt-2.5">
            <QrCodeSidebar onPhotoReceived={(file) => onAddPhotos([file])} />
          </div>
        )}
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-between">
        <p className="text-[12.5px] font-bold uppercase tracking-wide text-[#6B5A40]"><BulkT>{"Photo queue"}</BulkT></p>
        {photos.length > 0 && (<button type="button" onClick={onClearPhotos} disabled={disabled} className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-0.5 text-[13px] font-semibold text-[#6B5A40] transition duration-200 hover:bg-[#FEE9E9] hover:text-[#DC2626] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"><Trash2 size={13}/><BulkT>{"Clear all"}</BulkT></button>)}
      </div>

      {photos.length === 0 ? (<div className="mt-2 flex min-h-[110px] flex-1 flex-col items-center justify-center rounded-2xl border border-[#E3D6B8] bg-[#F6EEDB] p-4 text-center">
          <p className="text-[14.5px] font-semibold text-[#5A4A32]"><BulkT>{"No photos added yet"}</BulkT></p>
          <p className="mt-1 max-w-[220px] text-[12.5px] leading-[1.6] text-[#6B5A40]"><BulkT>{"Bulk editing needs at least two photos in the queue."}</BulkT></p>
        </div>) : (<div className="scroll mt-2 grid max-h-[300px] min-h-0 grid-cols-3 content-start gap-2 overflow-y-auto pr-1 xl:max-h-none xl:flex-1">
          {photos.map((photo, index) => (<div key={photo.id} className="group relative overflow-hidden rounded-lg border border-[#E3D6B8] bg-[#F6EEDB]">
              <img src={photo.preview} alt={t(`Selected photo ${index + 1}`)} className="aspect-square w-full object-cover"/>

              <span className="absolute left-1 top-1 rounded-full bg-[#3B2F1E]/80 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                {index + 1}
              </span>

              {photo.status === "processing" && (<span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-[#DC2626]/95 px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                  <LoaderCircle size={10} className="animate-spin"/><BulkT>{"AI"}</BulkT></span>)}

              {photo.status === "success" && (<span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                  <CheckCircle2 size={10}/><BulkT>{"Done"}</BulkT></span>)}

              {photo.status === "error" && (<span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-red-600/95 px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                  <AlertCircle size={10}/><BulkT>{"Error"}</BulkT></span>)}

              <button type="button" onClick={() => onRemovePhoto(photo.id)} aria-label={t(`Remove photo ${index + 1}`)} disabled={disabled} className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[#FBF6E8]/95 text-[#5A4A32] opacity-0 shadow-sm transition duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 hover:text-red-600 active:scale-[0.95] disabled:cursor-not-allowed">
                <X size={11}/>
              </button>
            </div>))}
        </div>)}

      {photos.length === 1 && (<div className="mt-2.5 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] font-medium leading-[1.55] text-amber-700"><BulkT>{"Add at least one more photo before bulk enhancement can run."}</BulkT></div>)}

      {photos.length >= 2 && (<div className="mt-2.5 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium leading-[1.55] text-emerald-700">
          <BulkT>{`${photos.length} photos are ready for bulk editing.`}</BulkT></div>)}
    </aside>);
}
