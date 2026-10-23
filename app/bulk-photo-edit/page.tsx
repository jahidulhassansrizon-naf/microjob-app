"use client";
import { BulkT, useBulkPhotoText } from "./components/bulkPhotoI18n";
import { PhotoCropWorkspace } from "../_components/PhotoCropWorkspace";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { getClientSession } from "@/lib/clientAuth";
import SubscriptionLock from "./components/SubscriptionLock";
import BulkPhotoStage from "./components/BulkPhotoStage";
import PhotoUploader from "./components/PhotoUploader";
import PresetPanel from "./components/PresetPanel";
import { TOOL_PRESETS } from "./components/toolCatalog";
import type { PhotoItem, PhotoProcessingStatus, SelectedTools, } from "./components/types";
const PAGE_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
  font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
.page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
.scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
.scroll::-webkit-scrollbar { width: 12px; }
.scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
.scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
.scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }
`;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_PHOTOS = 20;
const buildBulkPrompt = (selectedTools: SelectedTools) => {
    const groups = TOOL_PRESETS.map((preset) => {
        const names = selectedTools[preset.name] ?? [];
        if (names.length === 0)
            return null;
        const tools = preset.tools
            .filter((tool) => names.includes(tool.name))
            .map((tool) => `- ${tool.name}: ${tool.description}`);
        if (tools.length === 0)
            return null;
        return `${preset.name}:\n${tools.join("\n")}`;
    }).filter(Boolean);
    return [
        "Edit the provided photo using the selected AI operations below.",
        "",
        "CORE INSTRUCTIONS",
        "1. The provided image is the source of truth. Edit this exact photo; do not generate a different person, replacement subject, or unrelated image.",
        "2. Apply ONLY the operations explicitly listed below. Do not add extra beautification, color grading, relighting, background changes, sharpening, face changes, outfit changes, or other enhancements that were not selected.",
        "3. Preserve the person's identity exactly: facial structure, face shape, eyes, nose, lips, skin characteristics, age, hair, body proportions, and recognizable features.",
        "4. Preserve the original pose, camera angle, framing, composition, clothing, accessories, environment, and scene details unless a selected operation explicitly requires changing that element.",
        "5. When several selected operations overlap, combine them coherently in one natural edit while still respecting the ONLY-SELECTED-OPERATIONS rule.",
        "6. Keep edits photorealistic and natural. Avoid plastic skin, over-sharpening, halos, strange anatomy, duplicate features, melted details, fake textures, or obvious AI artifacts.",
        "7. Do not introduce text, logos, watermarks, extra people, or new objects unless a selected operation explicitly requires a background/object change.",
        "8. Return one finished edited version of the current photo only, with the same overall image dimensions and visual composition where practical.",
        "",
        "SELECTED AI OPERATIONS",
        groups.join("\n\n"),
        "",
        "FINAL CHECK",
        "Before returning the result, verify that every requested operation was applied and that no unselected edit was introduced.",
    ].join("\n");
};
const getDataUrlExtension = (dataUrl: string) => {
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
    if (!match)
        return "png";
    const raw = match[1].toLowerCase();
    if (raw === "jpeg")
        return "jpg";
    return raw === "webp" ? "webp" : "png";
};
const getBaseName = (fileName: string) => fileName.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-") || "photo";
async function persistBulkResult(image: string, name: string) {
    try {
        let url = image;
        let publicId = "";
        if (image.startsWith("data:")) {
            const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ image }),
            });
            const upload = await uploadResponse.json().catch(() => null);
            if (!uploadResponse.ok || !upload?.success || !upload?.url)
                return;
            url = upload.url;
            publicId = upload.publicId || "";
        }
        await fetch("/api/my-files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                name,
                category: "bulk-photo-edit",
                toolName: "Bulk Photo Edit",
                workspace: "creative",
                group: "image",
                url,
                publicId,
            }),
        });
    }
    catch (error) {
        console.error("Failed to save Bulk Photo Edit result to My Files:", error);
    }
}
export default function BulkPhotoEditPage() {
    const { t } = useBulkPhotoText();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [expandedPreset, setExpandedPreset] = useState<string | null>("face-enhance");
    const [selectedTools, setSelectedTools] = useState<SelectedTools>(() => Object.fromEntries(TOOL_PRESETS.map((preset) => [preset.name, []])));
    const [message, setMessage] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processedCount, setProcessedCount] = useState<number>(0);
    const [cropSession, setCropSession] = useState<{ file: File; preview: string } | null>(null);
    const cropSessionRef = useRef<{ file: File; preview: string } | null>(null);
    const cropQueueRef = useRef<File[]>([]);
    const cropResultsRef = useRef<File[]>([]);
    const cropWarningRef = useRef<string>("");
    useEffect(() => {
        let mounted = true;
        void getClientSession().then((session) => {
            if (!mounted)
                return;
            if (!session.authenticated) {
                window.location.replace("/login?callbackUrl=%2Fbulk-photo-edit");
                return;
            }
            setIsAuthenticated(true);
            setLoading(false);
        });
        return () => {
            mounted = false;
        };
    }, []);
    const photosRef = useRef<PhotoItem[]>([]);
    useEffect(() => {
        photosRef.current = photos;
    }, [photos]);
    useEffect(() => {
        return () => {
            photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview));
            if (cropSessionRef.current?.preview) {
                URL.revokeObjectURL(cropSessionRef.current.preview);
            }
        };
    }, []);
    const commitPhotos = useCallback((files: File[]) => {
        setMessage("");
        const validFiles: File[] = [];
        let skippedInvalid = false;
        let skippedOversize = false;
        for (const file of files) {
            if (!file.type.toLowerCase().startsWith("image/")) {
                skippedInvalid = true;
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                skippedOversize = true;
                continue;
            }
            validFiles.push(file);
        }
        let addedCount = 0;
        let hitMaxPhotos = false;
        setPhotos((current) => {
            const remainingSlots = Math.max(0, MAX_PHOTOS - current.length);
            const nextFiles = validFiles.slice(0, remainingSlots);
            addedCount = nextFiles.length;
            hitMaxPhotos = validFiles.length > nextFiles.length;
            const nextItems = nextFiles.map<PhotoItem>((file) => ({
                id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
                file,
                preview: URL.createObjectURL(file),
                status: "pending",
                resultUrl: null,
                error: null,
            }));
            return [...current, ...nextItems];
        });
        if (skippedInvalid || skippedOversize) {
            const reasons = [
                skippedInvalid ? "non-image files were skipped" : "",
                skippedOversize ? "files over 15 MB were skipped" : "",
            ].filter(Boolean);
            setMessage(`${reasons.join(" and ")}.`);
        }
        else if (hitMaxPhotos) {
            setMessage(`Only ${MAX_PHOTOS} photos can be kept in one batch.`);
        }
        else if (addedCount > 0) {
            setMessage("");
        }
    }, []);
    const openCropSession = useCallback((file: File) => {
        const session = { file, preview: URL.createObjectURL(file) };
        cropSessionRef.current = session;
        setCropSession(session);
    }, []);

    // Every upload source (sidebar, drag/drop and phone QR) passes through this crop queue.
    const addPhotos = useCallback((files: File[]) => {
        if (isProcessing) return;
        if (cropSessionRef.current) {
            setMessage("Finish the current crop before adding more photos.");
            return;
        }

        const validFiles: File[] = [];
        let skippedInvalid = false;
        let skippedOversize = false;
        for (const file of files) {
            if (!file.type.toLowerCase().startsWith("image/")) {
                skippedInvalid = true;
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                skippedOversize = true;
                continue;
            }
            validFiles.push(file);
        }

        const remainingSlots = Math.max(0, MAX_PHOTOS - photosRef.current.length);
        const filesToCrop = validFiles.slice(0, remainingSlots);
        const hitMaxPhotos = validFiles.length > filesToCrop.length;
        const warnings = [
            skippedInvalid ? "non-image files were skipped" : "",
            skippedOversize ? "files over 15 MB were skipped" : "",
            hitMaxPhotos ? `Only ${MAX_PHOTOS} photos can be kept in one batch` : "",
        ].filter(Boolean);
        cropWarningRef.current = warnings.length ? `${warnings.join(" and ")}.` : "";
        setMessage("");

        if (filesToCrop.length === 0) {
            setMessage(cropWarningRef.current || `Only ${MAX_PHOTOS} photos can be kept in one batch.`);
            cropWarningRef.current = "";
            return;
        }

        cropQueueRef.current = filesToCrop.slice(1);
        cropResultsRef.current = [];
        openCropSession(filesToCrop[0]);
    }, [isProcessing, openCropSession]);

    const finishCurrentCrop = useCallback((result: File | null) => {
        const current = cropSessionRef.current;
        if (!current) return;
        if (result) cropResultsRef.current.push(result);
        URL.revokeObjectURL(current.preview);
        cropSessionRef.current = null;

        const nextFile = cropQueueRef.current.shift();
        if (nextFile) {
            openCropSession(nextFile);
            return;
        }

        setCropSession(null);
        const completedFiles = cropResultsRef.current.slice();
        cropResultsRef.current = [];
        const warning = cropWarningRef.current;
        cropWarningRef.current = "";
        if (completedFiles.length) commitPhotos(completedFiles);
        if (warning) setMessage(warning);
    }, [commitPhotos, openCropSession]);

    const handleBulkCropApplied = useCallback((blob: Blob) => {
        const current = cropSessionRef.current;
        if (!current) return;
        const baseName = current.file.name.replace(/\.[^.]+$/, "") || "photo";
        const croppedFile = new File([blob], `${baseName}-cropped.jpg`, {
            type: blob.type || "image/jpeg",
            lastModified: Date.now(),
        });
        finishCurrentCrop(croppedFile);
    }, [finishCurrentCrop]);

    const handleBulkUseOriginal = useCallback((file: File) => {
        finishCurrentCrop(file);
    }, [finishCurrentCrop]);

    const cancelCropBatch = useCallback(() => {
        const current = cropSessionRef.current;
        if (current?.preview) URL.revokeObjectURL(current.preview);
        cropSessionRef.current = null;
        cropQueueRef.current = [];
        cropResultsRef.current = [];
        cropWarningRef.current = "";
        setCropSession(null);
        setMessage("Photo crop cancelled. No new photos were added.");
    }, []);

    const removePhoto = useCallback((id: string) => {
        if (isProcessing)
            return;
        setPhotos((current) => {
            const target = current.find((photo) => photo.id === id);
            if (target)
                URL.revokeObjectURL(target.preview);
            return current.filter((photo) => photo.id !== id);
        });
        setMessage("");
    }, [isProcessing]);
    const clearPhotos = useCallback(() => {
        if (isProcessing)
            return;
        setPhotos((current) => {
            current.forEach((photo) => URL.revokeObjectURL(photo.preview));
            return [];
        });
        setProcessedCount(0);
        setMessage("");
    }, [isProcessing]);
    const togglePreset = useCallback((presetId: string) => {
        setExpandedPreset((current) => (current === presetId ? null : presetId));
    }, []);
    const toggleTool = useCallback((presetName: string, toolName: string) => {
        setSelectedTools((current) => {
            const selected = current[presetName] || [];
            const next = selected.includes(toolName)
                ? selected.filter((name) => name !== toolName)
                : [...selected, toolName];
            return {
                ...current,
                [presetName]: next,
            };
        });
        setMessage("");
    }, []);
    const clearPreset = useCallback((presetName: string) => {
        setSelectedTools((current) => ({
            ...current,
            [presetName]: [],
        }));
        setMessage("");
    }, []);
    const selectedTotal = useMemo(() => Object.values(selectedTools).reduce((sum, tools) => sum + tools.length, 0), [selectedTools]);
    const updatePhoto = useCallback((id: string, patch: Partial<Pick<PhotoItem, "status" | "resultUrl" | "error">>) => {
        setPhotos((current) => current.map((photo) => photo.id === id ? { ...photo, ...patch } : photo));
    }, []);
    const handleEnhance = useCallback(async () => {
        if (isProcessing)
            return;
        if (photos.length < 2) {
            setMessage("Bulk editing requires at least 2 photos.");
            return;
        }
        if (selectedTotal === 0) {
            setMessage("Choose at least one AI tool before enhancing.");
            return;
        }
        const prompt = buildBulkPrompt(selectedTools);
        setIsProcessing(true);
        setProcessedCount(0);
        setMessage(`Starting AI bulk editing for ${photos.length} photos. Each photo is processed separately to preserve its own identity and details.`);
        setPhotos((current) => current.map((photo) => ({
            ...photo,
            status: "pending" as PhotoProcessingStatus,
            resultUrl: null,
            error: null,
        })));
        let successCount = 0;
        let failedCount = 0;
        let subscriptionBlocked = false;
        for (let index = 0; index < photos.length; index += 1) {
            const photo = photos[index];
            updatePhoto(photo.id, {
                status: "processing",
                resultUrl: null,
                error: null,
            });
            try {
                const formData = new FormData();
                formData.append("image", photo.file);
                formData.append("prompt", prompt);
                const response = await fetch("/api/image-generate", {
                    method: "POST",
                    body: formData,
                });
                const raw = await response.text();
                let data: {
                    success?: boolean;
                    image?: string;
                    error?: string;
                    code?: string;
                } = {};
                try {
                    data = JSON.parse(raw);
                }
                catch {
                    throw new Error(`AI service returned an unreadable response (${response.status}).`);
                }
                if (!response.ok || !data.success || !data.image) {
                    if (response.status === 403 && data.code === "SUBSCRIPTION_REQUIRED") {
                        subscriptionBlocked = true;
                        window.dispatchEvent(new Event("sohozkaj:subscription-required"));
                    }
                    throw new Error(data.error ||
                        `AI editing failed for photo ${index + 1} (${response.status}).`);
                }
                updatePhoto(photo.id, {
                    status: "success",
                    resultUrl: data.image,
                    error: null,
                });
                void persistBulkResult(data.image, `${getBaseName(photo.file.name)}-ai-edited`);
                successCount += 1;
            }
            catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : "Unknown AI editing error.";
                updatePhoto(photo.id, {
                    status: "error",
                    resultUrl: null,
                    error: errorMessage,
                });
                failedCount += 1;
                if (subscriptionBlocked) {
                    break;
                }
            }
            finally {
                setProcessedCount(index + 1);
            }
        }
        setIsProcessing(false);
        if (subscriptionBlocked) {
            const subscriptionMessage = "An active subscription is required to use this feature.";
            setPhotos((current) => current.map((photo) => photo.status === "pending"
                ? { ...photo, status: "error", resultUrl: null, error: subscriptionMessage }
                : photo));
            setMessage(subscriptionMessage);
            return;
        }
        if (failedCount === 0) {
            setMessage(`Completed successfully: ${successCount}/${photos.length} photos were AI edited.`);
        }
        else {
            setMessage(`Bulk editing finished: ${successCount} completed and ${failedCount} failed. You can run the batch again after checking the failed photos.`);
        }
    }, [
        isProcessing,
        photos,
        selectedTotal,
        selectedTools,
        updatePhoto,
    ]);
    const downloadResult = useCallback((photo: PhotoItem) => {
        if (!photo.resultUrl)
            return;
        const extension = getDataUrlExtension(photo.resultUrl);
        const anchor = document.createElement("a");
        anchor.href = photo.resultUrl;
        anchor.download = `${getBaseName(photo.file.name)}-ai-edited.${extension}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }, []);
    const retryFailedPhoto = useCallback(async (photoId: string) => {
        if (isProcessing || selectedTotal === 0)
            return;
        const photo = photos.find((item) => item.id === photoId);
        if (!photo)
            return;
        const prompt = buildBulkPrompt(selectedTools);
        setIsProcessing(true);
        setMessage(`Retrying ${photo.file.name} with the same selected AI tools...`);
        updatePhoto(photo.id, { status: "processing", error: null });
        try {
            const formData = new FormData();
            formData.append("image", photo.file);
            formData.append("prompt", prompt);
            const response = await fetch("/api/image-generate", {
                method: "POST",
                body: formData,
            });
            const raw = await response.text();
            let data: {
                success?: boolean;
                image?: string;
                error?: string;
                code?: string;
            } = {};
            try {
                data = JSON.parse(raw);
            }
            catch {
                throw new Error(`AI service returned an unreadable response (${response.status}).`);
            }
            if (!response.ok || !data.success || !data.image) {
                if (response.status === 403 && data.code === "SUBSCRIPTION_REQUIRED") {
                    window.dispatchEvent(new Event("sohozkaj:subscription-required"));
                }
                throw new Error(data.error || `AI editing failed (${response.status}).`);
            }
            updatePhoto(photo.id, {
                status: "success",
                resultUrl: data.image,
                error: null,
            });
            void persistBulkResult(data.image, `${getBaseName(photo.file.name)}-ai-edited`);
            setMessage(`${photo.file.name} was edited successfully.`);
        }
        catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Unknown AI editing error.";
            updatePhoto(photo.id, {
                status: "error",
                resultUrl: null,
                error: errorMessage,
            });
            setMessage(`Retry failed for ${photo.file.name}: ${errorMessage}`);
        }
        finally {
            setIsProcessing(false);
        }
    }, [isProcessing, photos, selectedTools, selectedTotal, updatePhoto]);
    const completedCount = photos.filter((photo) => photo.status === "success").length;
    const processingCount = photos.filter((photo) => photo.status === "processing").length;
    const failedCount = photos.filter((photo) => photo.status === "error").length;
    if (!isAuthenticated) {
        return (
          <div className="page-font flex min-h-screen items-center justify-center bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E]">
            <style>{PAGE_STYLES}</style>
            <main className="flex items-center justify-center px-4">
              <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-5 py-4 text-base font-medium text-[#5A4A32] shadow-sm">
                <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                <BulkT>{"Verifying your login..."}</BulkT>
              </div>
            </main>
          </div>
        );
    }
    return (<div
      className="page-font flex min-h-screen select-none flex-col bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E]"
      aria-hidden={Boolean(cropSession)}
      style={{ display: cropSession ? "none" : undefined }}
    >
      <style>{PAGE_STYLES}</style>
      <DashboardNavbar />
      <SubscriptionLock />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <PhotoUploader photos={photos} onAddPhotos={addPhotos} onRemovePhoto={removePhoto} onClearPhotos={clearPhotos} disabled={isProcessing}/>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="border-b border-[#E3D6B8] bg-[#F2E8D2] px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-[-0.01em] text-[#3B2F1E]"><BulkT>{"Bulk Photo Edit\n                "}</BulkT></h1>
                <p className="mt-1 max-w-2xl text-[14px] leading-[1.7] text-[#6B5A40]"><BulkT>{"Select 2 or more photos, choose exact AI operations, and apply\n                  the same selected operation set to each photo individually.\n                "}</BulkT></p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className={`rounded-full border px-3 py-1 text-[13px] font-bold ${photos.length >= 2
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                  <BulkT>{`${photos.length} photos`}</BulkT></span>

                <span className="rounded-full border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-1 text-[13px] font-bold text-[#B91C1C]">
                  <BulkT>{`${selectedTotal} AI tools`}</BulkT></span>

                {isProcessing && (<span className="rounded-full border border-[#FBB6B6] bg-[#FEE9E9] px-3 py-1 text-[13px] font-bold text-[#B91C1C]">
                    <BulkT>{`${processedCount}/${photos.length} processed`}</BulkT></span>)}

                {!isProcessing && completedCount > 0 && (<span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[13px] font-bold text-emerald-700">
                    <BulkT>{`${completedCount} ready`}</BulkT></span>)}

                {!isProcessing && failedCount > 0 && (<span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[13px] font-bold text-red-700">
                    <BulkT>{`${failedCount} failed`}</BulkT></span>)}

                {processingCount > 0 && !isProcessing && (<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[13px] font-bold text-amber-700">
                    <BulkT>{`${processingCount} processing`}</BulkT></span>)}
              </div>
            </div>
          </div>

          <div className="scroll flex min-h-0 flex-1 flex-col overflow-auto">
            <BulkPhotoStage photos={photos} onAddPhotos={addPhotos} onDownloadResult={downloadResult} onRetryPhoto={retryFailedPhoto} isProcessing={isProcessing}/>

            {message && (<div className="px-4 pb-4 sm:px-8">
                <div className="mx-auto w-full max-w-5xl rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] px-4 py-3 text-[14px] font-medium leading-[1.6] text-[#B91C1C]">
                  <BulkT>{message}</BulkT>
                </div>
              </div>)}
          </div>
        </main>

        <PresetPanel selectedTools={selectedTools} expandedPreset={expandedPreset} onTogglePreset={togglePreset} onToggleTool={toggleTool} onClearPreset={clearPreset} onCloseDropdown={() => setExpandedPreset(null)} photosCount={photos.length} onEnhance={handleEnhance} isProcessing={isProcessing} processedCount={processedCount}/>
      </div>
      {cropSession && (
        <PhotoCropWorkspace
          key={cropSession.preview}
          imageSrc={cropSession.preview}
          originalFile={cropSession.file}
          onCancel={cancelCropBatch}
          onApply={handleBulkCropApplied}
          onUseOriginal={handleBulkUseOriginal}
          translate={t}
        />
      )}
    </div>);
}
