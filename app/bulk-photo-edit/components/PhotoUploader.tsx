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
    return (<aside className="flex w-full shrink-0 flex-col border-b border-[#E2E8F0] bg-white p-4 lg:w-72 lg:border-b-0 lg:border-r">
      <label className={`group flex h-40 w-full flex-col items-center justify-center ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} rounded-2xl border border-dashed border-[#2563EB]/40 bg-[#F8FAFC] p-6 text-center shadow-xs transition hover:border-[#2563EB]`}>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleInputChange} disabled={disabled}/>
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#E2E8F0] font-bold text-[#2563EB] shadow-inner transition group-hover:bg-[#2563EB] group-hover:text-white">
          <Plus size={20}/>
        </span>
        <span className="text-sm font-bold text-[#0F172A]"><BulkT>{"Add photos"}</BulkT></span>
        <span className="mt-1 text-[10px] font-medium text-[#0F172A]/50"><BulkT>{"Select 2 or more photos\n        "}</BulkT></span>
      </label>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowPhoneUpload((current) => !current)}
          disabled={disabled}
          aria-expanded={showPhoneUpload}
          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs font-semibold text-[#334155] shadow-sm transition hover:border-[#2563EB]/40 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center gap-2"><QrCode size={15} className="text-[#2563EB]"/><BulkT>Upload from phone</BulkT></span>
          {showPhoneUpload ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showPhoneUpload && !disabled && (
          <div className="mt-3">
            <QrCodeSidebar onPhotoReceived={(file) => onAddPhotos([file])} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-[#0F172A]"><BulkT>{"Photo queue\n          "}</BulkT></p>
          <p className="mt-0.5 text-[10px] text-[#0F172A]/45">
            <BulkT>{`${photos.length} selected`}</BulkT></p>
        </div>

        {photos.length > 0 && (<button type="button" onClick={onClearPhotos} disabled={disabled} className="cursor-pointer text-[10px] font-bold text-[#64748B] transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"><BulkT>{"Clear all\n          "}</BulkT></button>)}
      </div>

      {photos.length === 0 ? (<div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-center">
          <Upload className="h-6 w-6 text-[#94A3B8]"/>
          <p className="mt-2 text-[11px] font-semibold text-[#475569]"><BulkT>{"No photos added yet\n          "}</BulkT></p>
          <p className="mt-1 max-w-[180px] text-[9px] leading-relaxed text-[#94A3B8]"><BulkT>{"Bulk editing needs at least two photos in the queue.\n          "}</BulkT></p>
        </div>) : (<div className="mt-3 grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {photos.map((photo, index) => (<div key={photo.id} className="group relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <img src={photo.preview} alt={t(`Selected photo ${index + 1}`)} className="aspect-square w-full object-cover"/>

              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[8px] font-bold text-white">
                {index + 1}
              </span>

              {photo.status === "processing" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-blue-600/95 px-1.5 py-1 text-[7px] font-black text-white">
                  <LoaderCircle size={9} className="animate-spin"/><BulkT>{"AI\n                "}</BulkT></span>)}

              {photo.status === "success" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-1.5 py-1 text-[7px] font-black text-white">
                  <CheckCircle2 size={9}/><BulkT>{"Done\n                "}</BulkT></span>)}

              {photo.status === "error" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-red-600/95 px-1.5 py-1 text-[7px] font-black text-white">
                  <AlertCircle size={9}/><BulkT>{"Error\n                "}</BulkT></span>)}

              <button type="button" onClick={() => onRemovePhoto(photo.id)} aria-label={t(`Remove photo ${index + 1}`)} disabled={disabled} className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/95 text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-600 disabled:cursor-not-allowed">
                <X size={12}/>
              </button>
            </div>))}
        </div>)}

      {photos.length === 1 && (<div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-semibold leading-relaxed text-amber-700"><BulkT>{"Add at least one more photo before bulk enhancement can run.\n        "}</BulkT></div>)}

      {photos.length >= 2 && (<div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[9px] font-semibold text-emerald-700">
          <BulkT>{`${photos.length} photos are ready for bulk editing.`}</BulkT></div>)}
    </aside>);
}
