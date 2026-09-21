"use client";
import { QrCode, X } from "lucide-react";
import { useManualEditor } from "./EditorProvider";

export default function ScanModal() {
  const { scanOpen, setScanOpen } = useManualEditor();
  if (!scanOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4"
      onMouseDown={() => setScanOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Phone Upload
            </p>
            <h3 className="mt-1 text-lg font-black text-gray-900">
              Scan QR Code
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setScanOpen(false)}
            className="h-9 w-9 rounded-full border flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-white border flex items-center justify-center text-gray-400">
            <QrCode size={46} />
          </div>
          <p className="mt-4 text-xs font-bold text-gray-600">
            QR upload session will be connected in the backend step.
          </p>
          <p className="mt-1 text-[10px] text-gray-400">
            For now this is the production-ready UI shell.
          </p>
        </div>
      </div>
    </div>
  );
}
