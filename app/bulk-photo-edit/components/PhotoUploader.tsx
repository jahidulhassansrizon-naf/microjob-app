import { T } from "@/components/i18n/I18nProvider";
import { AlertCircle, CheckCircle2, LoaderCircle, Plus, Upload, X } from "lucide-react";
import type { PhotoItem } from "./types";
interface PhotoUploaderProps {
    photos: PhotoItem[];
    onAddPhotos: (files: File[]) => void;
    onRemovePhoto: (id: string) => void;
    onClearPhotos: () => void;
    disabled: boolean;
}
export default function PhotoUploader({ photos, onAddPhotos, onRemovePhoto, onClearPhotos, disabled, }: PhotoUploaderProps) {
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
        <span className="text-sm font-bold text-[#0F172A]"><T>{"Add photos"}</T></span>
        <span className="mt-1 text-[10px] font-medium text-[#0F172A]/50"><T>{"Select 2 or more photos\n        "}</T></span>
      </label>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-[#0F172A]"><T>{"Photo queue\n          "}</T></p>
          <p className="mt-0.5 text-[10px] text-[#0F172A]/45">
            {photos.length}<T>{"selected\n          "}</T></p>
        </div>

        {photos.length > 0 && (<button type="button" onClick={onClearPhotos} disabled={disabled} className="cursor-pointer text-[10px] font-bold text-[#64748B] transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"><T>{"Clear all\n          "}</T></button>)}
      </div>

      {photos.length === 0 ? (<div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-center">
          <Upload className="h-6 w-6 text-[#94A3B8]"/>
          <p className="mt-2 text-[11px] font-semibold text-[#475569]"><T>{"No photos added yet\n          "}</T></p>
          <p className="mt-1 max-w-[180px] text-[9px] leading-relaxed text-[#94A3B8]"><T>{"Bulk editing needs at least two photos in the queue.\n          "}</T></p>
        </div>) : (<div className="mt-3 grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {photos.map((photo, index) => (<div key={photo.id} className="group relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <img src={photo.preview} alt={`Selected photo ${index + 1}`} className="aspect-square w-full object-cover"/>

              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[8px] font-bold text-white">
                {index + 1}
              </span>

              {photo.status === "processing" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-blue-600/95 px-1.5 py-1 text-[7px] font-black text-white">
                  <LoaderCircle size={9} className="animate-spin"/><T>{"AI\n                "}</T></span>)}

              {photo.status === "success" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-1.5 py-1 text-[7px] font-black text-white">
                  <CheckCircle2 size={9}/><T>{"Done\n                "}</T></span>)}

              {photo.status === "error" && (<span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-red-600/95 px-1.5 py-1 text-[7px] font-black text-white">
                  <AlertCircle size={9}/><T>{"Error\n                "}</T></span>)}

              <button type="button" onClick={() => onRemovePhoto(photo.id)} aria-label={`Remove photo ${index + 1}`} disabled={disabled} className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/95 text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-600 disabled:cursor-not-allowed">
                <X size={12}/>
              </button>
            </div>))}
        </div>)}

      {photos.length === 1 && (<div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-semibold leading-relaxed text-amber-700"><T>{"Add at least one more photo before bulk enhancement can run.\n        "}</T></div>)}

      {photos.length >= 2 && (<div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[9px] font-semibold text-emerald-700">
          {photos.length}<T>{"photos are ready for bulk editing.\n        "}</T></div>)}
    </aside>);
}
