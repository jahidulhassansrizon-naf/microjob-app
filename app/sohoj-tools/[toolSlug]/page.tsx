import React from "react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardNavbar from "../../dashboard/_components/DashboardNavbar";

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  'nid-joiner': dynamic(() => import("./_tools/NidToPdf")),
  'govt-job-photo-sign-resizer': dynamic(() => import("./_tools/GovtJobPhotoSignResizer")),
  'education-board-result': dynamic(() => import("./_tools/EducationBoardResult")),
  'national-university-result': dynamic(() => import("./_tools/NationalUniversityResult")),
  'age-calculator': dynamic(() => import("./_tools/AgeCalculator")),
  'passport-to-pdf': dynamic(() => import("./_tools/PassportToPdf")),
  'voter-migration-form': dynamic(() => import("./_tools/VoterMigrationForm")),
  'family-card-form': dynamic(() => import("./_tools/FamilyCardForm")),
  'allowance-application-tracking': dynamic(() => import("./_tools/AllowanceApplicationTracking")),
  'remove-background': dynamic(() => import("./_tools/RemoveBackground")),
  'document-scanner': dynamic(() => import("./_tools/DocumentScanner")),
  'image-size-reducer': dynamic(() => import("./_tools/ImageSizeReducer")),
  'crop-image': dynamic(() => import("./_tools/CropImage")),
  'images-to-pdf': dynamic(() => import("./_tools/ImagesToPdf")),
  'image-convert': dynamic(() => import("./_tools/ImageConvert")),
  'image-to-text': dynamic(() => import("./_tools/ImageToText")),
  'compress-pdf': dynamic(() => import("./_tools/CompressPdf")),
  'merge-pdfs': dynamic(() => import("./_tools/MergePdf")),
  'split-pdf': dynamic(() => import("./_tools/SplitPdf")),
  'lock-unlock-pdf': dynamic(() => import("./_tools/LockUnlockPdf")),
  'pdf-to-image': dynamic(() => import("./_tools/PdfToImage")),
  'edit-pdf': dynamic(() => import("./_tools/EditPdf")),
  'bijoy-unicode': dynamic(() => import("./_tools/BijoyToUnicode")),
  'banglish-typing': dynamic(() => import("./_tools/BanglishTyping")),
  'ats-friendly-cv-maker': dynamic(() => import("./_tools/AtsCvMaker")),
};

export default async function DynamicToolPage({
  params,
}: {
  params: Promise<{ toolSlug: string }>;
}) {
  const { toolSlug } = await params;
  const SelectedToolComponent = TOOL_COMPONENTS[toolSlug];

  if (!SelectedToolComponent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 flex flex-col font-sans">
      <DashboardNavbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <SelectedToolComponent />
      </main>
    </div>
  );
}
