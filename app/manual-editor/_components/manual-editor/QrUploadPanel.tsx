"use client";

import { useCallback } from "react";
import { ManualT as T } from "./manualEditorI18n";
import { useManualEditor } from "./EditorProvider";
import QrCodeSidebar from "@/app/ai-editor/_components/QrCodeSidebar";

export default function QrUploadPanel() {
  const { activePhoto, processFile } = useManualEditor();

  const handlePhotoReceived = useCallback((file: File) => {
    void processFile(file);
  }, [processFile]);

  return (
    <div className="flex w-full shrink-0 flex-col gap-3">
      <QrCodeSidebar onPhotoReceived={handlePhotoReceived} />
      {activePhoto && (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-[10px] font-semibold text-slate-500">
          <T>Photo already loaded</T>
        </div>
      )}
    </div>
  );
}
