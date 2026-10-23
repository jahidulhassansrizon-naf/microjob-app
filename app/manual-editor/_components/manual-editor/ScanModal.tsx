"use client";
import { ManualT as T } from "./manualEditorI18n";
import { QrCode, X } from "lucide-react";
import { useManualEditor } from "./EditorProvider";
export default function ScanModal() {
    const { scanOpen, setScanOpen } = useManualEditor();
    if (!scanOpen)
        return null;
    return (<div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4" onMouseDown={() => setScanOpen(false)}>
      <div className="w-full max-w-md rounded-3xl bg-[#FBF6E8] p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-widest text-[#7A6A50]"><T>{"Phone Upload\r\n            "}</T></p>
            <h3 className="mt-1 text-xl font-extrabold text-[#3B2F1E]"><T>{"Scan QR Code\r\n            "}</T></h3>
          </div>
          <button type="button" onClick={() => setScanOpen(false)} className="h-9 w-9 rounded-full border flex items-center justify-center">
            <X size={16}/>
          </button>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-[#B0A080] bg-[#F6EEDB] p-8 text-center">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-[#FBF6E8] border flex items-center justify-center text-[#7A6A50]">
            <QrCode size={46}/>
          </div>
          <p className="mt-4 text-sm font-bold text-[#5A4A32]"><T>{"QR upload session will be connected in the backend step.\r\n          "}</T></p>
          <p className="mt-1 text-[12px] text-[#7A6A50]"><T>{"For now this is the production-ready UI shell.\r\n          "}</T></p>
        </div>
      </div>
    </div>);
}
