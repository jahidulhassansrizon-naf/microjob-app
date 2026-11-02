import React from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  hasActiveSubscription,
  requireToolAccess,
} from "../../api/_lib/requireActiveSubscription";
import { isPaidToolSlug } from "../../_lib/paidToolSlugs";
import PaidToolLocked from "../../_components/PaidToolLocked";
import nextDynamic from "next/dynamic";
import DashboardNavbar from "../../dashboard/_components/DashboardNavbar";
import PaidToolGate from "../../_components/PaidToolGate";

export const dynamic = "force-dynamic";

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

  // Every tool page requires a verified login.
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;

  if (!token) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/sohoj-tools/${toolSlug}`)}`);
  }

  // Verify the signed session, latest session version, account status and ban state.
  // This helper also recognizes the configured root-admin token, which is not a
  // MongoDB ObjectId and therefore must not be pre-validated as a normal user ID.
  const accessRequest = new Request("http://internal.local/", {
    headers: { cookie: `token=${encodeURIComponent(token)}` },
  });
  const access = await requireToolAccess(accessRequest);

  if (!access.ok) {
    const status = access.response.status;
    const body = await access.response.json().catch(() => ({} as { code?: string }));
    if (status === 401) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/sohoj-tools/${toolSlug}`)}`);
    }
    const banned = body?.code === "USER_BANNED";
    return (
      <div className="min-h-screen w-full bg-[#FFF4D7] text-[#0F172A] flex flex-col font-sans">
        <DashboardNavbar />
        <main className="flex w-full flex-1 items-center justify-center px-4 py-8">
          <PaidToolLocked variant={banned ? "banned" : "subscription"} />
        </main>
      </div>
    );
  }

  // Authoritative server-side subscription check. A paid tool page now OPENS for everyone with a
  // valid login (so visitors can see the tool), but for an account without active access the tool
  // is rendered locked: PaidToolGate makes it inert and every attempt to use it opens the
  // subscription video. The decision is made here on the server, per request, from the live
  // subscription record -- never from anything the browser sends.
  // Admins are granted access by the shared tool-session check above.
  // If the lookup itself fails, fail CLOSED (locked).
  let paidLocked = false;
  if (isPaidToolSlug(toolSlug) && access.role !== "admin") {
    let subscriptionActive = false;
    try {
      subscriptionActive = await hasActiveSubscription(access.userId);
    } catch (error) {
      console.error("[sohoj-tools] subscription access check failed:", error);
    }
    paidLocked = !subscriptionActive;
  }

  const isNidCorrection = toolSlug === "nid-information-correction-form";
  const isChangeSpeed = toolSlug === "change-speed";
  const isAddWatermark = toolSlug === "add-watermark";

  if (isNidCorrection || isChangeSpeed || isAddWatermark) {
    return (
      <div className="min-h-screen w-full bg-[#FFF4D7] text-[#0F172A] flex flex-col font-sans">
        <DashboardNavbar />
        <main className="w-full flex-1">
          <PaidToolGate slug={toolSlug} locked={paidLocked}>
            <SelectedToolComponent />
          </PaidToolGate>
        </main>
      </div>
    );
  }

  // Tools already restyled with the "Warm Sand + Red" system get the sand page background.
  const isWarmSand = toolSlug === "nid-joiner";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans ${
        isWarmSand
          ? "bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E]"
          : "bg-[#F8FAFC] text-[#0F172A]"
      }`}
    >
      <DashboardNavbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <PaidToolGate slug={toolSlug} locked={paidLocked}>
          <SelectedToolComponent />
        </PaidToolGate>
      </main>
    </div>
  );
}
