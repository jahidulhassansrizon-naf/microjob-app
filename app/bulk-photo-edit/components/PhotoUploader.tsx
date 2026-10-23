import { useEffect, useState } from "react";
import { BulkT, useBulkPhotoText } from "./bulkPhotoI18n";
import { AlertCircle, CheckCircle2, LoaderCircle, Plus, Upload, X, QrCode, ChevronDown, ChevronUp } from "lucide-react";
import QrCodeSidebar from "@/app/ai-editor/_components/QrCodeSidebar";
import type { PhotoItem } from "./types";
interface PhotoUploaderProps {
    photos: PhotoItem[];
    onAddPhotos: (files: File[]) => void;
    onRemovePhoto: (id: string) => void;
    onClearPhotos: () => void;
    disabled: boolean;
}
export default function PhotoUploader({ photos, onAddPhotos, onRemovePhoto, onClearPhotos, disabled, }: PhotoUploaderProps) {
    const { t } = useBulkPhotoText();
    const [showPhoneUpload, setShowPhoneUpload] = useState(false);

    useEffect(() => {
        if (disabled) setShowPhoneUpload(false);
    }, [disabled]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length)
            onAddPhotos(files);
        event.target.value = "";
    };
    return (<aside className="flex w-full shrink-0 flex-col border-b border-[#E3D6B8] bg-[#F2E8D2] p-4 lg:w-72 lg:border-b-0 lg:border-r">
      <label className={`group flex h-44 w-full flex-col items-center justify-center ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} rounded-2xl border border-dashed border-[#B0A080] bg-[#FBF6E8] p-6 text-center shadow-sm transition duration-200 ease-out hover:border-[#DC2626]/50 hover:bg-[#EFE3C8] focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-[#DC2626]/20`}>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleInputChange} disabled={disabled}/>
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E9D2] font-bold text-[#DC2626] shadow-inner transition duration-200 group-hover:bg-[#DC2626] group-hover:text-white">
          <Plus size={20}/>
        </span>
        <span className="text-base font-semibold text-[#3B2F1E]"><BulkT>{"Add photos"}</BulkT></span>
        <span className="mt-1 text-[13px] font-medium text-[#6B5A40]"><BulkT>{"Select 2 or more photos\n        "}</BulkT></span>
      </label>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowPhoneUpload((current) => !current)}
          disabled={disabled}
          aria-expanded={showPhoneUpload}
          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2.5 text-[15px] font-semibold text-[#5A4A32] shadow-sm transition duration-200 ease-out hover:border-[#DC2626]/40 hover:bg-[#EFE3C8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2E8D2]"
        >
          <span className="flex items-center gap-2"><QrCode size={17} className="text-[#DC2626]"/><BulkT>Upload from phone</BulkT></span>
          {showPhoneUpload ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showPhoneUpload && !disabled && (
          <div className="mt-3">
            <QrCodeSidebar onPhotoReceived={(file) => onAddPhotos([file])} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[#6B5A40]"><BulkT>{"Photo queue\n          "}</BulkT></p>
          <p className="mt-0.5 text-[13px] text-[#6B5A40]">
            <BulkT>{`${photos.length} selected`}</BulkT></p>
        </div>

        {photos.length > 0 && (<button type="button" onClick={onClearPhotos} disabled={disabled} className="cursor-pointer rounded-lg px-1 text-[15px] font-semibold text-[#6B5A40] transition duration-200 hover:text-[#DC2626] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2E8D2]"><BulkT>{"Clear all\n          "}</BulkT></button>)}
      </div>

      {photos.length === 0 ? (<div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#E3D6B8] bg-[#F6EEDB] p-5 text-center">
          <Upload className="h-6 w-6 text-[#7A6A50]"/>
          <p className="mt-2 text-[15px] font-semibold text-[#5A4A32]"><BulkT>{"No photos added yet\n          "}</BulkT></p>
          <p className="mt-1 max-w-[220px] text-[14px] italic leading-[1.6] text-[#6B5A40]"><BulkT>{"Bulk editing needs at least two photos in the queue.\n          "}</BulkT></p>
        </div>) : (<div className="scroll mt-3 grid max-h-[380px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {photos.map((photo, index) => (<div key={photo.id} className="group relative overflow-hidden rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]">
              <img src={photo.preview} alt={t(`Selected photo ${index + 1}`)} className="aspect-square w-full object-cover"/>

              <span className="absolute left-1.5 top-1.5 rounded-full bg-[#3B2F1E]/80 px-2 py-0.5 text-[12px] font-bold text-white">
                {index + 1}
              </span>

              {photo.status === "processing" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-[#DC2626]/95 px-2 py-1 text-[11px] font-bold text-white">
                  <LoaderCircle size={11} className="animate-spin"/><BulkT>{"AI\n                "}</BulkT></span>)}

              {photo.status === "success" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2 py-1 text-[11px] font-bold text-white">
                  <CheckCircle2 size={11}/><BulkT>{"Done\n                "}</BulkT></span>)}

              {photo.status === "error" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-red-600/95 px-2 py-1 text-[11px] font-bold text-white">
                  <AlertCircle size={11}/><BulkT>{"Error\n                "}</BulkT></span>)}

              <button type="button" onClick={() => onRemovePhoto(photo.id)} aria-label={t(`Remove photo ${index + 1}`)} disabled={disabled} className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#FBF6E8]/95 text-[#5A4A32] opacity-0 shadow-sm transition duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 hover:text-red-600 active:scale-[0.95] disabled:cursor-not-allowed">
                <X size={12}/>
              </button>
            </div>))}
        </div>)}

      {photos.length === 1 && (<div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium leading-[1.6] text-amber-700"><BulkT>{"Add at least one more photo before bulk enhancement can run.\n        "}</BulkT></div>)}

      {photos.length >= 2 && (<div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[14px] font-medium leading-[1.6] text-emerald-700">
          <BulkT>{`${photos.length} photos are ready for bulk editing.`}</BulkT></div>)}
    </aside>);
}
