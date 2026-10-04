import React from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getUserIdFromToken,
  hasActiveSubscription,
} from "../../api/_lib/requireActiveSubscription";
import nextDynamic from "next/dynamic";
import DashboardNavbar from "../../dashboard/_components/DashboardNavbar";

export const dynamic = "force-dynamic";

const PAID_TOOL_SLUGS = new Set([
  "document-scanner",
  "govt-job-photo-sign-resizer",
  "remove-background",
  "lock-unlock-pdf",
  "pdf-to-image",
  "compress-pdf",
  "merge-pdfs",
  "image-size-reducer",
  "image-upscaler",
  "ats-friendly-cv-maker",
  "passport-joiner",
  "reduce-video-file-size",
  "change-speed",
  "add-watermark",
  "images-to-pdf",
  "image-convert",
  "image-to-text",
  "split-pdf",
  "edit-pdf",
  "bijoy-unicode",
]);

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "nid-joiner": nextDynamic(() => import("./_tools/NidToPdf")),
  "govt-job-photo-sign-resizer": nextDynamic(
    () => import("./_tools/GovtJobPhotoSignResizer"),
  ),
  "change-speed": nextDynamic(() => import("./_tools/ChangeSpeed")),
  "national-university-result": nextDynamic(
    () => import("./_tools/NationalUniversityResult"),
  ),
  "add-watermark": nextDynamic(() => import("./_tools/NationalUniversityResult")),
  "age-calculator": nextDynamic(() => import("./_tools/AgeCalculator")),
  "passport-joiner": nextDynamic(() => import("./_tools/PassportToPdf")),
  "voter-migration-form": nextDynamic(() => import("./_tools/VoterMigrationForm")),
  "voter-registration-form": nextDynamic(
    () => import("./_tools/VoterRegistrationForm"),
  ),
  "family-card-form": nextDynamic(() => import("./_tools/FamilyCardForm")),
  "nid-information-correction-form": nextDynamic(
    () => import("./_tools/NidInformationCorrectionForm"),
  ),
  "reduce-video-file-size": nextDynamic(
    () => import("./_tools/AllowanceApplicationTracking"),
  ),
  "remove-background": nextDynamic(() => import("./_tools/RemoveBackground")),
  "document-scanner": nextDynamic(() => import("./_tools/DocumentScanner")),
  "image-size-reducer": nextDynamic(() => import("./_tools/ImageSizeReducer")),
  "image-upscaler": nextDynamic(() => import("./_tools/ImageUpscaler")),
  "crop-image": nextDynamic(() => import("./_tools/CropImage")),
  "images-to-pdf": nextDynamic(() => import("./_tools/ImagesToPdf")),
  "image-convert": nextDynamic(() => import("./_tools/ImageConvert")),
  "image-to-text": nextDynamic(() => import("./_tools/ImageToText")),
  "compress-pdf": nextDynamic(() => import("./_tools/CompressPdf")),
  "merge-pdfs": nextDynamic(() => import("./_tools/MergePdf")),
  "split-pdf": nextDynamic(() => import("./_tools/SplitPdf")),
  "lock-unlock-pdf": nextDynamic(() => import("./_tools/LockUnlockPdf")),
  "pdf-to-image": nextDynamic(() => import("./_tools/PdfToImage")),
  "edit-pdf": nextDynamic(() => import("./_tools/EditPdf")),
  "bijoy-unicode": nextDynamic(() => import("./_tools/BijoyToUnicode")),
  "banglish-typing": nextDynamic(() => import("./_tools/BanglishTyping")),
  "ats-friendly-cv-maker": nextDynamic(() => import("./_tools/AtsCvMaker")),
  "special-information-form": nextDynamic(
    () => import("./_tools/SpecialInformationForm"),
  ),
  "fuel-card-form": nextDynamic(() => import("./_tools/FuelCardForm")),
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

  if (PAID_TOOL_SLUGS.has(toolSlug)) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value ?? null;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      redirect(`/login?next=${encodeURIComponent(`/sohoj-tools/${toolSlug}`)}`);
    }

    const activeSubscription = await hasActiveSubscription(userId);
    if (!activeSubscription) {
      redirect("/subscription");
    }
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
