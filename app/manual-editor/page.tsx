"use client";

import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

import CreditBanner from "./_components/manual-editor/CreditBanner";
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
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans select-none text-gray-900">
      <DashboardNavbar />
      <CreditBanner />

      <div className="max-w-[1700px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 bg-white border border-gray-200/80 rounded-3xl p-4 md:p-5 flex flex-col gap-5 shadow-sm overflow-visible lg:overflow-y-auto max-h-[85vh]">
            <PhotoSizePanel />
            <BackgroundPanel />
            <AiToolsPanel />
          </aside>

          <PhotoWorkspace />

          <aside className="lg:col-span-3 flex flex-col gap-5">
            <QrUploadPanel />
            <AdjustmentsPanel />
          </aside>
        </div>

        <GeneratedPhotosPanel />
      </div>

      <footer className="mt-auto border-t border-gray-200 bg-white px-5 py-3 text-[10px] text-gray-400">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3">
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
