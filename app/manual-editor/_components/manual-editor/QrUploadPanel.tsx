"use client";
import { QrCode, ScanLine } from "lucide-react";
import { useManualEditor } from "./EditorProvider";

export default function QrUploadPanel() {
  const { activePhoto, setScanOpen } = useManualEditor();
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
      <div className="bg-[#1F242D] text-white p-4 rounded-2xl flex items-center justify-between border border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-800/90 rounded-xl text-blue-400 border border-gray-700">
            <QrCode size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold">Scan Now</h4>
            <p className="text-[10px] text-gray-400">Scan QR Code</p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setScanOpen(true)}
        className="w-full bg-[#1F242D] hover:bg-[#282E3B] text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 border border-gray-700/50"
      >
        <ScanLine size={14} /> Scan
      </button>
      {activePhoto && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center text-[10px] font-bold text-gray-500">
          Photo already loaded
        </div>
      )}
    </div>
  );
}
