import React from "react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardNavbar from "../../dashboard/_components/DashboardNavbar";

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "form-auto-fillup": dynamic(() => import("./_tools/FormAutoFillup")),
  "education-board-result": dynamic(
    () => import("./_tools/EducationBoardResult"),
  ),
  "national-university-result": dynamic(
    () => import("./_tools/NationalUniversityResult"),
  ),
  "ats-friendly-cv-maker": dynamic(() => import("./_tools/AtsCvMaker")),
  "govt-job-photo-sign-resizer": dynamic(
    () => import("./_tools/GovtJobPhotoSignResizer"),
  ),
  "compress-pdf": dynamic(() => import("./_tools/CompressPdf")),
  "merge-pdfs": dynamic(() => import("./_tools/MergePdf")),
  "create-pdf": dynamic(() => import("./_tools/CreatePdf")),
  "split-pdf": dynamic(() => import("./_tools/SplitPdf")),
  "pdf-to-image": dynamic(() => import("./_tools/PdfToImage")),
  "lock-unlock-pdf": dynamic(() => import("./_tools/LockUnlockPdf")),
  "rotate-pdf": dynamic(() => import("./_tools/RotatePdf")),
  "remove-pages": dynamic(() => import("./_tools/RemovePages")),
  "pdf-watermark": dynamic(() => import("./_tools/PdfWatermark")),
  "extract-images": dynamic(() => import("./_tools/ExtractImages")),
  "pdf-permissions": dynamic(() => import("./_tools/PdfPermissions")),
  "resize-pdf": dynamic(() => import("./_tools/ResizePdf")),
  "pdf-crop": dynamic(() => import("./_tools/PdfCrop")),
  "pdf-to-excel": dynamic(() => import("./_tools/PdfToExcel")),
  "pdf-repair": dynamic(() => import("./_tools/PdfRepair")),
  "edit-pdf": dynamic(() => import("./_tools/EditPdf")),
  "image-size-reducer": dynamic(() => import("./_tools/ImageSizeReducer")),
  "nid-to-pdf": dynamic(() => import("./_tools/NidToPdf")),
  "remove-background": dynamic(() => import("./_tools/RemoveBackground")),
  "passport-to-pdf": dynamic(() => import("./_tools/PassportToPdf")),
  "document-cleanup": dynamic(() => import("./_tools/DocumentCleanup")),
  "qr-code-generator": dynamic(() => import("./_tools/QrCodeGenerator")),
  "image-resize": dynamic(() => import("./_tools/ImageResize")),
  "crop-image": dynamic(() => import("./_tools/CropImage")),
  "images-to-pdf": dynamic(() => import("./_tools/ImagesToPdf")),
  "add-watermark": dynamic(() => import("./_tools/AddWatermark")),
  "flatten-image": dynamic(() => import("./_tools/FlattenImage")),
  "barcode-generator": dynamic(() => import("./_tools/BarcodeGenerator")),
  "color-picker": dynamic(() => import("./_tools/ColorPicker")),
  "digital-signature-pad": dynamic(
    () => import("./_tools/DigitalSignaturePad"),
  ),
  "text-signature-generator": dynamic(
    () => import("./_tools/TextSignatureGenerator"),
  ),
  "logo-color-changer": dynamic(() => import("./_tools/LogoColorChanger")),
  "compress-gif": dynamic(() => import("./_tools/CompressGif")),
  "image-convert": dynamic(() => import("./_tools/ImageConvert")),
  "image-upscaler": dynamic(() => import("./_tools/ImageUpscaler")),
  "notice-generator": dynamic(() => import("./_tools/NoticeGenerator")),
  "bijoy-unicode": dynamic(() => import("./_tools/BijoyToUnicode")),
  "banglish-typing": dynamic(() => import("./_tools/BanglishTyping")),
  "number-to-words": dynamic(() => import("./_tools/NumberToWords")),
  "image-to-text": dynamic(() => import("./_tools/ImageToText")),
  "text-analyzer": dynamic(() => import("./_tools/TextAnalyzer")),
  "date-format-converter": dynamic(
    () => import("./_tools/DateFormatConverter"),
  ),
  "compress-video": dynamic(() => import("./_tools/CompressVideo")),
  "trim-cut-video": dynamic(() => import("./_tools/TrimCutVideo")),
  "merge-videos": dynamic(() => import("./_tools/MergeVideos")),
  "video-to-audio": dynamic(() => import("./_tools/VideoToAudio")),
  "add-watermark-to-video": dynamic(
    () => import("./_tools/AddWatermarkToVideo"),
  ),
  "audio-volume-boosterreducer": dynamic(
    () => import("./_tools/AudioVolumeBooster"),
  ),
  "audio-volume-booster-reducer": dynamic(
    () => import("./_tools/AudioVolumeBooster"),
  ),
  "change-speed": dynamic(() => import("./_tools/ChangeSpeed")),
  "video-to-gif": dynamic(() => import("./_tools/VideoToGif")),
  "rotate-flip": dynamic(() => import("./_tools/RotateFlip")),
  "remove-audio": dynamic(() => import("./_tools/RemoveAudio")),
  "family-card-form": dynamic(() => import("./_tools/FamilyCardForm")),
  "voter-migration-form": dynamic(() => import("./_tools/VoterMigrationForm")),
  "allowance-application-tracking": dynamic(
    () => import("./_tools/AllowanceApplicationTracking"),
  ),
  "fuel-card-form": dynamic(() => import("./_tools/FuelCardForm")),
  "age-calculator": dynamic(() => import("./_tools/AgeCalculator")),
  "emi-calculator": dynamic(() => import("./_tools/EmiCalculator")),
  "bmi-calculator": dynamic(() => import("./_tools/BmiCalculator")),
  "hisabpottro-stock": dynamic(() => import("./_tools/HisabpottroStock")),
  "document-scanner": dynamic(() => import("./_tools/DocumentScanner")),
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
//  beat me hate me you can never break me srizon
