import React from "react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardNavbar from "../../dashboard/_components/DashboardNavbar";

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "nid-joiner": dynamic(() => import("./_tools/NidToPdf")),
  "govt-job-photo-sign-resizer": dynamic(
    () => import("./_tools/GovtJobPhotoSignResizer"),
  ),
  "change-speed": dynamic(() => import("./_tools/ChangeSpeed")),
  "national-university-result": dynamic(
    () => import("./_tools/NationalUniversityResult"),
  ),
  "add-watermark": dynamic(() => import("./_tools/NationalUniversityResult")),
  "age-calculator": dynamic(() => import("./_tools/AgeCalculator")),
  "passport-joiner": dynamic(() => import("./_tools/PassportToPdf")),
  "voter-migration-form": dynamic(() => import("./_tools/VoterMigrationForm")),
  "voter-registration-form": dynamic(
    () => import("./_tools/VoterRegistrationForm"),
  ),
  "family-card-form": dynamic(() => import("./_tools/FamilyCardForm")),
  "nid-information-correction-form": dynamic(
    () => import("./_tools/NidInformationCorrectionForm"),
  ),
  "reduce-video-file-size": dynamic(
    () => import("./_tools/AllowanceApplicationTracking"),
  ),
  "remove-background": dynamic(() => import("./_tools/RemoveBackground")),
  "document-scanner": dynamic(() => import("./_tools/DocumentScanner")),
  "image-size-reducer": dynamic(() => import("./_tools/ImageSizeReducer")),
  "image-upscaler": dynamic(() => import("./_tools/ImageUpscaler")),
  "crop-image": dynamic(() => import("./_tools/CropImage")),
  "images-to-pdf": dynamic(() => import("./_tools/ImagesToPdf")),
  "image-convert": dynamic(() => import("./_tools/ImageConvert")),
  "image-to-text": dynamic(() => import("./_tools/ImageToText")),
  "compress-pdf": dynamic(() => import("./_tools/CompressPdf")),
  "merge-pdfs": dynamic(() => import("./_tools/MergePdf")),
  "split-pdf": dynamic(() => import("./_tools/SplitPdf")),
  "lock-unlock-pdf": dynamic(() => import("./_tools/LockUnlockPdf")),
  "pdf-to-image": dynamic(() => import("./_tools/PdfToImage")),
  "edit-pdf": dynamic(() => import("./_tools/EditPdf")),
  "bijoy-unicode": dynamic(() => import("./_tools/BijoyToUnicode")),
  "banglish-typing": dynamic(() => import("./_tools/BanglishTyping")),
  "ats-friendly-cv-maker": dynamic(() => import("./_tools/AtsCvMaker")),
  "special-information-form": dynamic(
    () => import("./_tools/SpecialInformationForm"),
  ),
  "fuel-card-form": dynamic(() => import("./_tools/FuelCardForm")),
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

  const isNidCorrection = toolSlug === "nid-information-correction-form";
  const isChangeSpeed = toolSlug === "change-speed";
  const isAddWatermark = toolSlug === "add-watermark";

  if (isNidCorrection || isChangeSpeed || isAddWatermark) {
    return (
      <div className="min-h-screen w-full bg-[#FFF4D7] text-[#0F172A] flex flex-col font-sans">
        <DashboardNavbar />
        <main className="w-full flex-1">
          <SelectedToolComponent />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      <DashboardNavbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <SelectedToolComponent />
      </main>
    </div>
  );
}
