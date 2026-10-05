"use client";

import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

import PhotoSizePanel from "./_components/manual-editor/PhotoSizePanel";
import BackgroundPanel from "./_components/manual-editor/BackgroundPanel";
import AiToolsPanel from "./_components/manual-editor/AiToolsPanel";
import PhotoWorkspace from "./_components/manual-editor/PhotoWorkspace";
import AdjustmentsPanel from "./_components/manual-editor/AdjustmentsPanel";
import QrUploadPanel from "./_components/manual-editor/QrUploadPanel";
import GeneratedPhotosPanel from "./_components/manual-editor/GeneratedPhotosPanel";
import ScanModal from "./_components/manual-editor/ScanModal";
import PrintStudioModal from "./_components/manual-editor/PrintStudioModal";
import {
  ManualEditorProvider,
  useManualEditor,
} from "./_components/manual-editor/EditorProvider";

function ManualEditorScreen() {
  const { loading, isAuthenticated } = useManualEditor();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FF5D00] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500">
            যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F9FAFB] flex flex-col font-sans select-none text-gray-900">
      <DashboardNavbar />
      <div className="w-full p-3 md:p-4 lg:px-4 lg:py-3 flex flex-col gap-5 lg:gap-3 flex-1 lg:min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-6 lg:gap-4 lg:flex-1 lg:min-h-0">
          <aside className="lg:col-span-3 bg-white border border-gray-200/80 rounded-3xl p-4 md:p-5 lg:p-4 flex flex-col gap-5 lg:gap-3 shadow-sm overflow-visible lg:overflow-y-auto max-h-[85vh] lg:max-h-none lg:h-full lg:min-h-0">
            <PhotoSizePanel />
            <BackgroundPanel />
            <AiToolsPanel />
          </aside>

          <PhotoWorkspace />

          <aside className="lg:col-span-3 flex flex-col gap-5 lg:gap-3 lg:h-full lg:min-h-0 lg:overflow-y-auto">
            <QrUploadPanel />
            <AdjustmentsPanel />
          </aside>
        </div>

        <GeneratedPhotosPanel />
      </div>

      <footer className="mt-auto shrink-0 border-t border-gray-200 bg-white px-5 py-3 lg:py-1.5 text-[10px] text-gray-400">
        <div className="w-full flex items-center justify-between gap-3">
          <span>Manual Editor</span>
          <span>
            Browser editing is local; AI services will be connected separately.
          </span>
        </div>
      </footer>

      <ScanModal />
      <PrintStudioModal />
    </div>
  );
}

export default function ManualEditorPage() {
  return (
    <ManualEditorProvider>
      <ManualEditorScreen />
    </ManualEditorProvider>
  );
}
