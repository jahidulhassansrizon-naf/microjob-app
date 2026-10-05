import React from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getUserIdFromToken,
  hasActiveSubscription,
} from "../../api/_lib/requireActiveSubscription";
import nextDynamic from "next/dynamic";
import DashboardNavbar from "../../dashboard/_components/DashboardNavbar";

function ToolChunkLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[420px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-8"
    >
      <div className="w-full max-w-xl space-y-4">
        <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

type ToolComponentModule = { default: React.ComponentType };

function dynamicTool(loader: () => Promise<ToolComponentModule>) {
  return nextDynamic(loader, {
    loading: ToolChunkLoading,
  });
}


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
  "nid-joiner": dynamicTool(() => import("./_tools/NidToPdf")),
  "govt-job-photo-sign-resizer": dynamicTool(
    () => import("./_tools/GovtJobPhotoSignResizer"),
  ),
  "change-speed": dynamicTool(() => import("./_tools/ChangeSpeed")),
  "national-university-result": dynamicTool(
    () => import("./_tools/NationalUniversityResult"),
  ),
  "add-watermark": dynamicTool(() => import("./_tools/NationalUniversityResult")),
  "age-calculator": dynamicTool(() => import("./_tools/AgeCalculator")),
  "passport-joiner": dynamicTool(() => import("./_tools/PassportToPdf")),
  "voter-migration-form": dynamicTool(() => import("./_tools/VoterMigrationForm")),
  "voter-registration-form": dynamicTool(
    () => import("./_tools/VoterRegistrationForm"),
  ),
  "family-card-form": dynamicTool(() => import("./_tools/FamilyCardForm")),
  "nid-information-correction-form": dynamicTool(
    () => import("./_tools/NidInformationCorrectionForm"),
  ),
  "reduce-video-file-size": dynamicTool(
    () => import("./_tools/AllowanceApplicationTracking"),
  ),
  "remove-background": dynamicTool(() => import("./_tools/RemoveBackground")),
  "document-scanner": dynamicTool(() => import("./_tools/DocumentScanner")),
  "image-size-reducer": dynamicTool(() => import("./_tools/ImageSizeReducer")),
  "image-upscaler": dynamicTool(() => import("./_tools/ImageUpscaler")),
  "crop-image": dynamicTool(() => import("./_tools/CropImage")),
  "images-to-pdf": dynamicTool(() => import("./_tools/ImagesToPdf")),
  "image-convert": dynamicTool(() => import("./_tools/ImageConvert")),
  "image-to-text": dynamicTool(() => import("./_tools/ImageToText")),
  "compress-pdf": dynamicTool(() => import("./_tools/CompressPdf")),
  "merge-pdfs": dynamicTool(() => import("./_tools/MergePdf")),
  "split-pdf": dynamicTool(() => import("./_tools/SplitPdf")),
  "lock-unlock-pdf": dynamicTool(() => import("./_tools/LockUnlockPdf")),
  "pdf-to-image": dynamicTool(() => import("./_tools/PdfToImage")),
  "edit-pdf": dynamicTool(() => import("./_tools/EditPdf")),
  "bijoy-unicode": dynamicTool(() => import("./_tools/BijoyToUnicode")),
  "banglish-typing": dynamicTool(() => import("./_tools/BanglishTyping")),
  "ats-friendly-cv-maker": dynamicTool(() => import("./_tools/AtsCvMaker")),
  "special-information-form": dynamicTool(
    () => import("./_tools/SpecialInformationForm"),
  ),
  "fuel-card-form": dynamicTool(() => import("./_tools/FuelCardForm")),
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
