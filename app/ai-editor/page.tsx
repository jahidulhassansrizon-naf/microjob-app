"use client";
import { AiT, useAiEditorText } from "./_components/aiEditorI18n";
import { notifyMyFilesSaved } from "@/app/_lib/myFilesNotice";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import SubscriptionLock from "./_components/SubscriptionLock";
import GenerationSettings from "./_components/GenerationSettings";
import { buildExpressionRule, buildSkinToneRule, buildStandardFinishRule, expressionChangesFace, KEEP_SKIN_COLOR_RETOUCH_RULE, planEditingGuides, TIE_COLORS, TIE_STYLES } from "./_components/editingGuides";
import PhotoPreviewArea from "./_components/PhotoPreviewArea";
import QrCodeSidebar from "./_components/QrCodeSidebar";
import PhotoSetupWizard, { type WizardResult } from "./_components/PhotoSetupWizard";
import RecentGenerations from "./_components/RecentGenerations";
import GeneratedResultPanel, { GeneratedResultItem, PrintSession } from "./_components/GeneratedResultPanel";
import { applyFiltersToExportable, buildPrintStudioPayload, printSinglePhoto } from "./_components/photoExport";
import { DEFAULT_FILTERS, RESULT_DEFAULT_FILTERS, filterString, isNeutralFilters, type FilterState } from "./_components/ImageEditSidebar";
import { deletePrintSession, getPrintSession, listPrintSessions, savePrintSession, type PrintSessionMeta, type PrintSessionSnapshot } from "./_components/printSessionStore";
import { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, Crop as CropIcon, Minus, Plus, Ruler, RotateCw, Loader2 } from "lucide-react";
import { getClientSession } from "@/lib/clientAuth";
import { CLOTHING_NAMES, CLOTHING_STYLES } from "./_components/clothingStyles";
import ConfirmDeleteModal from "./_components/ConfirmDeleteModal";
import usePageLoaderHold from "@/app/_components/usePageLoaderHold";
import { AiEditorFetchError, getCachedAiEditorGenerations, isAiEditorStaticWarm, refreshAiEditorGenerations, setCachedAiEditorGenerations, waitForAiEditorFirstFold } from "./_components/aiEditorData";
// Heavy parts (print studio + PDF, photo preview editor, crop tool) load in the background, so the
// AI Editor page itself opens much faster after a click.
const AiPrintStudioModal = dynamic(() => import("./_components/AiPrintStudioModal"), { ssr: false, loading: () => null });
const ImagePreviewModal = dynamic(() => import("./_components/ImagePreviewModal"), { ssr: false, loading: () => null });
const CropStage = dynamic(() => import("./_components/CropStage"), { ssr: false, loading: () => null });
export default function PhotoEditorPage() {
    const { t } = useAiEditorText();
    const router = useRouter();
    const [authChecking, setAuthChecking] = useState(false);
    const [selectedSize, setSelectedSize] = useState("");
    // -1 = no background chosen: the photo's own background is kept as is.
    const [selectedBg, setSelectedBg] = useState(-1);
    const [customBgColor, setCustomBgColor] = useState("#8B1E1E");
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedClothing, setSelectedClothing] = useState(-1);
    const [leftClothing, setLeftClothing] = useState(2);
    const [rightClothing, setRightClothing] = useState(2);
    const [leftClothingColor, setLeftClothingColor] = useState("#EF4444");
    const [rightClothingColor, setRightClothingColor] = useState("#EF4444");
    const [selectedClothingColor, setSelectedClothingColor] = useState("#EF4444");
    const [editingGuides, setEditingGuides] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDualMode, setIsDualMode] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [leftImage, setLeftImage] = useState<string | null>(null);
    const [rightImage, setRightImage] = useState<string | null>(null);
    const [activeTarget, setActiveTarget] = useState<string | null>(null);
    // Keep the original cropped source separate from generated previews so
    // changing settings and generating again always starts from the source photo.
    const [originalImageForDual, setOriginalImageForDual] = useState<string | null>(null);
    const [originalLeftImage, setOriginalLeftImage] = useState<string | null>(null);
    const [originalRightImage, setOriginalRightImage] = useState<string | null>(null);
    const [isDualPreviewActive, setIsDualPreviewActive] = useState(false);
    // Dual mode: the single combined (left + right side by side) generated image.
    const [dualResultImage, setDualResultImage] = useState<string | null>(null);
    const [recentList, setRecentList] = useState<any[]>([]);
    const [previewModalImage, setPreviewModalImage] = useState<any>(null);
    // Photo that was just generated: drives the right-side actions panel and the inline print studio.
    const [resultItem, setResultItem] = useState<GeneratedResultItem | null>(null);
    // Live edit values (brightness etc.) for the generated photo. A new photo starts slightly brighter and the edit dropdown opens by itself.
    const [resultFilters, setResultFilters] = useState<FilterState>(RESULT_DEFAULT_FILTERS);
    const [resultEditToken, setResultEditToken] = useState(0);
    // The exact image the main preview shows for the current result (the saved record may carry a different URL string).
    const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null);
    const showGeneratedResult = (item: GeneratedResultItem, previewUrl: string) => {
        setResultPreviewUrl(previewUrl);
        setResultFilters(RESULT_DEFAULT_FILTERS);
        setResultEditToken((token) => token + 1);
        setResultItem(item);
    };
    const [printSession, setPrintSession] = useState<PrintSession | null>(null);
    const [bulkPrintSources, setBulkPrintSources] = useState<Array<{ image: string; sourceKey?: string; preset: { id?: string; label?: string; widthMm: number; heightMm: number } }> | null>(null);
    // Print layouts the user kept when closing the print studio (stored in this browser).
    const [savedSessions, setSavedSessions] = useState<PrintSessionMeta[]>([]);
    const [savedSnapshot, setSavedSnapshot] = useState<PrintSessionSnapshot | null>(null);
    const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
    const [previewStartWithEdit, setPreviewStartWithEdit] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    // Prevent duplicate generation submissions before React has time to re-render.
    // This lock is local to this user's page and never shared between users.
    const generationInFlightRef = useRef(false);
    const [customInstructionClearToken, setCustomInstructionClearToken] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    // Same as the other pages: when the recent photos are not ready yet (no cache), the premium page
    // loader covers the page and shows only if it is really needed (slow load). When the photos
    // are already cached, nothing is shown and the page simply opens with them.
    const [openedWithCache] = useState(() => getCachedAiEditorGenerations() !== null);
    // The very first load of this page: until the recent photos are ready, the page itself is not
    // drawn at all (no half-built page "floating" for a moment). The full-screen loader covers the
    // wait only if it is really needed, and the finished page then appears in one go.
    // This flag only ever goes false -> true, so later refreshes never blank an open page.
    const [firstLoadDone, setFirstLoadDone] = useState(true);
    // The page is drawn first (hidden under the loader), and only AFTER it has really been painted
    // the loader is told to finish. So the heavy drawing work never happens while the loader is
    // running its last steps: the loader finishes smoothly and the finished page is revealed.
    const [pageSettled, setPageSettled] = useState(true);
    usePageLoaderHold(!pageSettled, 8000, 120);
    // Data is in: wait only very briefly for the small clothing icons. Photos that are not ready
    // simply fade in afterwards, in the background.
    useEffect(() => {
        if (firstLoadDone || isFetching)
            return;
        let cancelled = false;
        void waitForAiEditorFirstFold(recentList, 900).then(() => {
            if (!cancelled)
                setFirstLoadDone(true);
        });
        return () => {
            cancelled = true;
        };
    }, [firstLoadDone, isFetching, recentList]);
    useEffect(() => {
        if (!firstLoadDone || pageSettled)
            return;
        let inner = 0;
        const outer = window.requestAnimationFrame(() => {
            inner = window.requestAnimationFrame(() => setPageSettled(true));
        });
        return () => {
            window.cancelAnimationFrame(outer);
            if (inner)
                window.cancelAnimationFrame(inner);
        };
    }, [firstLoadDone, pageSettled]);
    // Page is open and painted: in free time, fetch the code of the heavy tools (print studio,
    // preview editor, crop) so they open instantly when first used. Never delays the page itself.
    useEffect(() => {
        if (!pageSettled)
            return;
        const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
        const run = () => {
            void import("./_components/ImagePreviewModal");
            void import("./_components/CropStage");
            void import("./_components/AiPrintStudioModal");
        };
        const handle = idle ? idle(run, { timeout: 6000 }) : window.setTimeout(run, 2500);
        return () => {
            if (idle)
                (window as any).cancelIdleCallback?.(handle);
            else
                window.clearTimeout(handle);
        };
    }, [pageSettled]);
    useEffect(() => {
        if (pageSettled)
            return;
        // Safety net: never keep the page hidden for longer than this.
        const timer = window.setTimeout(() => {
            setFirstLoadDone(true);
            setPageSettled(true);
        }, 8000);
        return () => window.clearTimeout(timer);
    }, [pageSettled]);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState<any>({
        unit: "%",
        width: 80,
        height: 80,
        x: 10,
        y: 10,
    });
    const [completedCrop, setCompletedCrop] = useState<any>(null);
    const [zoom, setZoom] = useState(100);
    const [rotate, setRotate] = useState(0);
    const [showVisaPopup, setShowVisaPopup] = useState(false);
    const [selectedVisaSize, setSelectedVisaSize] = useState("35×45 mm");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    // Guided setup wizard (opens after a photo is uploaded + cropped)
    const WIZARD_DISABLED_KEY = "sebalagbe:ai-editor:setup-wizard-disabled";
    const [showSetupWizard, setShowSetupWizard] = useState(false);
    const [wizardDisabled, setWizardDisabled] = useState(false);
    const [applyGuidesSignal, setApplyGuidesSignal] = useState<{ id: number; guides: string[] } | null>(null);
    const [autoGenerateToken, setAutoGenerateToken] = useState(0);
    const generatePhotoRef = useRef<() => void>(() => { });
    const wizardAfterUploadRef = useRef(false);
    useEffect(() => {
        try {
            setWizardDisabled(window.localStorage.getItem(WIZARD_DISABLED_KEY) === "1");
        }
        catch {
            /* storage can be blocked; the wizard simply stays enabled */
        }
    }, []);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const visaPopupRef = useRef<HTMLDivElement | null>(null);
    const colorPickerRef = useRef<HTMLDivElement | null>(null);
    // Authentication + MongoDB recent-generation loading
    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token
            ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
            : {};
    };
    // Recent generations: shown instantly from the in-memory cache (filled by the
    // navbar the moment the user points at "AI Editor"), then refreshed quietly.
    const listSyncedWithServerRef = useRef(false);
    const fetchUserGenerationsFromMongo = async (showSkeleton = true) => {
        if (showSkeleton)
            setIsFetching(true);
        try {
            const list = await refreshAiEditorGenerations();
            listSyncedWithServerRef.current = true;
            setRecentList(list);
        }
        catch (error) {
            const status = error instanceof AiEditorFetchError ? error.status : 0;
            if (status === 401) {
                router.replace("/login");
                return;
            }
            const message = (error instanceof AiEditorFetchError ? error.serverMessage : "").toLowerCase();
            // A locked AI Editor is an expected state for users without an active
            // subscription. Keep the page mounted so SubscriptionLock can show
            // the normal upgrade UI instead of surfacing a runtime error overlay.
            const subscriptionRequired = status === 402 ||
                status === 403 ||
                message.includes("active subscription") ||
                message.includes("subscription is required") ||
                message.includes("subscription required") ||
                message.includes("subscribe");
            if (subscriptionRequired) {
                setRecentList([]);
                return;
            }
            console.error("Error fetching AI generations from MongoDB:", error);
            if (showSkeleton)
                setRecentList([]);
        }
        finally {
            setIsFetching(false);
        }
    };
    useEffect(() => {
        let mounted = true;
        // Start loading the images right away (in parallel with the login check).
        const cached = getCachedAiEditorGenerations();
        if (cached) {
            listSyncedWithServerRef.current = true;
            setRecentList(cached);
            setIsFetching(false);
        }
        void fetchUserGenerationsFromMongo(!cached);
        void getClientSession().then((session) => {
            if (!mounted)
                return;
            if (!session.authenticated) {
                router.replace("/login?callbackUrl=%2Fai-editor");
                return;
            }
            setAuthChecking(false);
        });
        return () => {
            mounted = false;
        };
    }, [router]);
    // Keep the cache equal to what is on screen (after generate / edit / delete).
    useEffect(() => {
        if (!listSyncedWithServerRef.current || isFetching)
            return;
        setCachedAiEditorGenerations(recentList);
    }, [recentList, isFetching]);
    const photoSizes = [
        {
            id: "Passport",
            label: "Passport",
            tooltip: "BD Passport/MRP (45x55 mm)",
            aspect: "45/55",
            dims: "45×55 mm",
        },
        {
            id: "Dual",
            label: "Dual",
            tooltip: "Dual Photo Format",
            aspect: "auto",
            dims: "Dual Mode",
        },
        {
            id: "E-Pass",
            label: "E-Pass",
            tooltip: "BD E-Passport (25x30 mm)",
            aspect: "25/30",
            dims: "25×30 mm",
        },
        {
            id: "Visa",
            label: "Visa",
            tooltip: "BD Visa (35x45mm)",
            aspect: "35/45",
            dims: "35×45 mm",
        },
        {
            id: "Birth",
            label: "Birth",
            tooltip: "BD Birth Certificate (35x45mm)",
            aspect: "35/45",
            dims: "35×45 mm",
        },
    ];
    const visaSizesList = [
        { label: "2×2 inch", aspect: "1/1" },
        { label: "35×45 mm", aspect: "35/45" },
        { label: "40×60 mm", aspect: "40/60" },
        { label: "40×50 mm", aspect: "40/50" },
        { label: "40×40 mm", aspect: "40/40" },
        { label: "50×50 mm", aspect: "50/50" },
        { label: "50×70 mm", aspect: "50/70" },
        { label: "33×48 mm", aspect: "33/48" },
        { label: "35×50 mm", aspect: "35/50" },
        { label: "36×47 mm", aspect: "36/47" },
        { label: "38×48 mm", aspect: "38/48" },
        { label: "50×60 mm", aspect: "50/60" },
    ];
    // Master resolution: 600 DPI for passport-size photos so zooming in stays sharp.
    // Large sizes are capped (longest side <= ~3600 px) so the browser canvas never runs out of memory.
    const EXPORT_DPI = 600;
    const MIN_EXPORT_DPI = 300;
    const MAX_EXPORT_LONG_SIDE_PX = 3600;
    const JPEG_QUALITY = 0.98;
    type PhysicalSize = {
        width: number;
        height: number;
        unit: "mm" | "in";
    };
    const parsePhysicalSize = (label: string): PhysicalSize => {
        const normalized = String(label || "").trim();
        const inchMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*inch/i);
        if (inchMatch) {
            return {
                width: Number(inchMatch[1]),
                height: Number(inchMatch[2]),
                unit: "in",
            };
        }
        const mmMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm/i);
        if (mmMatch) {
            return {
                width: Number(mmMatch[1]),
                height: Number(mmMatch[2]),
                unit: "mm",
            };
        }
        return {
            width: 45,
            height: 55,
            unit: "mm",
        };
    };
    const getExactExportDimensions = (sizeLabel: string) => {
        const physical = parsePhysicalSize(sizeLabel);
        const widthInches = physical.unit === "in" ? physical.width : physical.width / 25.4;
        const heightInches = physical.unit === "in" ? physical.height : physical.height / 25.4;
        const longSideInches = Math.max(widthInches, heightInches, 0.01);
        const dpi = Math.max(MIN_EXPORT_DPI, Math.min(EXPORT_DPI, Math.floor(MAX_EXPORT_LONG_SIDE_PX / longSideInches)));
        const widthPx = Math.max(1, Math.round(widthInches * dpi));
        const heightPx = Math.max(1, Math.round(heightInches * dpi));
        return {
            ...physical,
            widthPx,
            heightPx,
            dpi,
        };
    };
    // Gentle unsharp-mask so an upscaled photo keeps crisp hair, eyes, beard and fabric detail.
    // Only RGB is touched (alpha stays as is), so transparent PNG edges are not damaged.
    const sharpenCanvasDetail = (context: CanvasRenderingContext2D, width: number, height: number, amount = 0.45) => {
        try {
            const imageData = context.getImageData(0, 0, width, height);
            const src = imageData.data;
            const copy = new Uint8ClampedArray(src);
            const stride = width * 4;
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const i = y * stride + x * 4;
                    if (copy[i + 3] === 0) continue;
                    for (let c = 0; c < 3; c++) {
                        const center = copy[i + c];
                        const blur = (copy[i + c - 4] + copy[i + c + 4] + copy[i + c - stride] + copy[i + c + stride]) / 4;
                        const diff = center - blur;
                        // Ignore tiny differences (flat backdrop / skin) so noise is not boosted.
                        if (diff > 2 || diff < -2) {
                            src[i + c] = center + diff * amount;
                        }
                    }
                }
            }
            context.putImageData(imageData, 0, 0);
        }
        catch {
            // If pixel access is blocked, keep the unsharpened image.
        }
    };
    const normalizeImageToExactPhysicalSize = async (imageSrc: string, sizeLabel: string, transparentBackground = false, dualGroupPhoto = false): Promise<{
        dataUrl: string;
        widthPx: number;
        heightPx: number;
        dpi: number;
    }> => {
        const target = getExactExportDimensions(sizeLabel);
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.src = imageSrc;
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("Could not load image for final size export."));
        });
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        if (!sourceWidth || !sourceHeight) {
            throw new Error("Source image has invalid dimensions.");
        }
        const scale = Math.min(target.widthPx / sourceWidth, target.heightPx / sourceHeight);
        const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
        const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
        const drawX = Math.round((target.widthPx - drawWidth) / 2);
        const drawY = Math.max(0, target.heightPx - drawHeight);
        const canvas = document.createElement("canvas");
        canvas.width = target.widthPx;
        canvas.height = target.heightPx;
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not create final export canvas.");
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        if (transparentBackground) {
            context.clearRect(0, 0, target.widthPx, target.heightPx);
        }
        else {
            context.fillStyle = getSelectedBgColorValue();
            context.fillRect(0, 0, target.widthPx, target.heightPx);
        }
        if (dualGroupPhoto) {
            // Dual group photo: the AI image must fill the whole frame, so there is never
            // a white strip. Close ratios are cover-cropped (a little from the sides or
            // from the bottom, keeping headroom). Very different ratios are fitted whole,
            // and the empty area takes the backdrop colour sampled from the image corner.
            const targetRatio = target.widthPx / target.heightPx;
            const sourceRatio = sourceWidth / sourceHeight;
            if (Math.abs(sourceRatio / targetRatio - 1) <= 0.15) {
                const coverScale = Math.max(target.widthPx / sourceWidth, target.heightPx / sourceHeight);
                const cropW = target.widthPx / coverScale;
                const cropH = target.heightPx / coverScale;
                const sx = (sourceWidth - cropW) / 2;
                const sy = (sourceHeight - cropH) * 0.25;
                context.drawImage(image, sx, sy, cropW, cropH, 0, 0, target.widthPx, target.heightPx);
            }
            else {
                if (!transparentBackground) {
                    try {
                        const probe = document.createElement("canvas");
                        probe.width = 1;
                        probe.height = 1;
                        const probeContext = probe.getContext("2d");
                        if (probeContext) {
                            probeContext.drawImage(image, 0, 0, Math.min(12, sourceWidth), Math.min(12, sourceHeight), 0, 0, 1, 1);
                            const [r, g, b] = probeContext.getImageData(0, 0, 1, 1).data;
                            context.fillStyle = `rgb(${r}, ${g}, ${b})`;
                            context.fillRect(0, 0, target.widthPx, target.heightPx);
                        }
                    }
                    catch {
                        // Keep the selected background colour if the pixel cannot be read.
                    }
                }
                const fitScale = Math.min(target.widthPx / sourceWidth, target.heightPx / sourceHeight);
                const fitW = Math.max(1, Math.round(sourceWidth * fitScale));
                const fitH = Math.max(1, Math.round(sourceHeight * fitScale));
                context.drawImage(image, 0, 0, sourceWidth, sourceHeight, Math.round((target.widthPx - fitW) / 2), Math.round((target.heightPx - fitH) / 2), fitW, fitH);
            }
        }
        else {
            context.drawImage(image, 0, 0, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
        }
        // The AI image is often smaller than the 600 DPI master size: restore fine detail after upscaling.
        if (scale > 1.05 || dualGroupPhoto) {
            sharpenCanvasDetail(context, target.widthPx, target.heightPx, scale > 1.6 ? 0.6 : 0.45);
        }
        // Keep only the serialized image data; release the large canvas bitmap now.
        const dataUrl = transparentBackground
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        canvas.width = 0;
        canvas.height = 0;
        return {
            dataUrl,
            widthPx: target.widthPx,
            heightPx: target.heightPx,
            dpi: target.dpi,
        };
    };
    const getImageRasterDimensions = (imageSrc: string): Promise<{ widthPx: number; heightPx: number }> =>
        new Promise((resolve) => {
            const image = new Image();
            let settled = false;
            let timeoutId: number | undefined;
            const finish = (dimensions: { widthPx: number; heightPx: number }) => {
                if (settled) return;
                settled = true;
                if (timeoutId !== undefined) window.clearTimeout(timeoutId);
                image.onload = null;
                image.onerror = null;
                resolve(dimensions);
            };
            timeoutId = window.setTimeout(
                () => finish({ widthPx: 0, heightPx: 0 }),
                5000,
            );
            image.onload = () => finish({
                widthPx: image.naturalWidth || image.width || 0,
                heightPx: image.naturalHeight || image.height || 0,
            });
            image.onerror = () => finish({ widthPx: 0, heightPx: 0 });
            image.src = imageSrc;
            if (image.complete && (image.naturalWidth || image.width)) {
                finish({ widthPx: image.naturalWidth || image.width, heightPx: image.naturalHeight || image.height });
            }
        });
    const backgroundColors = [
        {
            type: "preset",
            className: "bg-white border border-[#CBD5E1]",
            value: "#FFFFFF",
        },
        { type: "preset", className: "bg-blue-500", value: "#3B82F6" },
        { type: "preset", className: "bg-sky-400", value: "#38BDF8" },
        { type: "preset", className: "bg-gray-400", value: "#9CA3AF" },
        { type: "preset", className: "bg-blue-600", value: "#2563EB" },
        { type: "preset", className: "bg-teal-700", value: "#0F766E" },
        { type: "preset", className: "bg-amber-100", value: "#FEF3C7" },
        {
            type: "transparent",
            className: "",
            value: "transparent",
        },
        { type: "custom", className: "", value: "" },
    ];
    const getSelectedBgColorValue = () => {
        const selectedOption = backgroundColors[selectedBg];
        if (selectedOption?.type === "transparent") {
            return "transparent";
        }
        if (selectedOption?.type === "custom" &&
            /^#[0-9A-F]{6}$/i.test(customBgColor)) {
            return customBgColor.toUpperCase();
        }
        return selectedOption?.value || "#FFFFFF";
    };
    const isKeepOriginalBackground = () => selectedBg < 0 || !backgroundColors[selectedBg];
    const isTransparentBackground = () => backgroundColors[selectedBg]?.type === "transparent";
    const getCurrentSizeLabel = () => {
        if (!selectedSize) return "Original Size";
        if (selectedSize === "Visa")
            return selectedVisaSize;
        const found = photoSizes.find((p) => p.id === selectedSize);
        return found ? found.dims : "35×45 mm";
    };
    const getSelectedTargetAspect = (): number | undefined => {
        // No selected document size means the user is editing a regular photo;
        // keep cropping free-form instead of silently locking it to passport ratio.
        if (!selectedSize) return undefined;
        const sizeLabel = getCurrentSizeLabel();
        if (sizeLabel.includes("inch")) {
            return 1.0;
        }
        const match = sizeLabel.match(/(\d+)×(\d+)/);
        if (match) {
            const w = parseFloat(match[1]);
            const h = parseFloat(match[2]);
            return w / h;
        }
        return undefined;
    };

    const handleCropImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const image = event.currentTarget;
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;
        if (!imageWidth || !imageHeight) return;

        const targetAspect = isDualMode ? 45 / 55 : getSelectedTargetAspect();
        const initialCrop = targetAspect
            ? centerCrop(
                makeAspectCrop(
                    { unit: "%", width: 80 },
                    targetAspect,
                    imageWidth,
                    imageHeight,
                ),
                imageWidth,
                imageHeight,
            )
            : centerCrop(
                { unit: "%", width: 80, height: 80 },
                imageWidth,
                imageHeight,
            );
        setCrop(initialCrop);

        const renderedWidth = image.clientWidth || image.width;
        const renderedHeight = image.clientHeight || image.height;
        setCompletedCrop({
            unit: "px",
            x: (initialCrop.x / 100) * renderedWidth,
            y: (initialCrop.y / 100) * renderedHeight,
            width: (initialCrop.width / 100) * renderedWidth,
            height: (initialCrop.height / 100) * renderedHeight,
        });
    };
    const getStyleFromAspect = (aspectStr: string) => {
        const [rawWidth, rawHeight] = aspectStr.split("/").map(Number);
        const ratio = Number.isFinite(rawWidth) && Number.isFinite(rawHeight) && rawHeight > 0
            ? rawWidth / rawHeight
            : 35 / 45;
        const maxWidth = 460;
        const maxHeight = 620;
        let width = maxWidth;
        let height = width / ratio;
        if (height > maxHeight) {
            height = maxHeight;
            width = height * ratio;
        }
        return {
            width: `${Math.max(1, Math.round(width))}px`,
            height: `${Math.max(1, Math.round(height))}px`,
        };
    };
    const getCurrentBoxDimensions = () => {
        if (!selectedSize) {
            return {
                text: "Original Size",
                isOriginal: true,
                // A neutral square preview is used visually only; the actual image
                // aspect ratio and pixel dimensions are preserved in normal-edit mode.
                style: getStyleFromAspect("1/1"),
            };
        }
        if (selectedSize === "Visa") {
            const found = visaSizesList.find((v) => v.label === selectedVisaSize);
            return {
                text: selectedVisaSize,
                style: getStyleFromAspect(found ? found.aspect : "35/45"),
            };
        }
        const foundSize = photoSizes.find((p) => p.id === selectedSize);
        return {
            text: foundSize ? foundSize.dims : "35×45 mm",
            style: getStyleFromAspect(foundSize ? foundSize.aspect : "35/45"),
        };
    };
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (visaPopupRef.current &&
                !visaPopupRef.current.contains(event.target as Node))
                setShowVisaPopup(false);
            if (colorPickerRef.current &&
                !colorPickerRef.current.contains(event.target as Node))
                setShowColorPicker(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    useEffect(() => {
        if (!errorMessage)
            return;
        const timer = window.setTimeout(() => setErrorMessage(null), 7000);
        return () => window.clearTimeout(timer);
    }, [errorMessage]);
    // Shows a friendly "please wait" popup if a photo takes longer than usual
    // (for example while the server switches to another Gemini session).
    const [showSlowNotice, setShowSlowNotice] = useState(false);
    useEffect(() => {
        if (!isGenerating) {
            setShowSlowNotice(false);
            return;
        }
        const timer = window.setTimeout(() => setShowSlowNotice(true), 50000);
        return () => window.clearTimeout(timer);
    }, [isGenerating]);
    const openImageForCrop = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setErrorMessage("Please select a valid image file.");
            return;
        }
        if (file.size > 12 * 1024 * 1024) {
            setErrorMessage("Image is too large. Please choose an image under 12 MB.");
            return;
        }
        if (tempImageForCrop?.startsWith("blob:")) {
            URL.revokeObjectURL(tempImageForCrop);
        }
        const imageUrl = URL.createObjectURL(file);
        setTempImageForCrop(imageUrl);
        setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
        setCompletedCrop(null);
        setZoom(100);
        setRotate(0);
        setShowCropModal(true);
        setRegeneratingId(null);
    };
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) openImageForCrop(file);
    };
    const handleQrPhotoReceived = (file: File) => {
        // A QR-delivered photo follows the same single-photo upload flow as the main picker.
        setActiveTarget(null);
        openImageForCrop(file);
    };
    // The copy that is saved to "Recent photos" already carries the default brightness. If anything fails, the plain photo is saved instead.
    const saveBrightenedCopy = async (url: string, bgColor?: string): Promise<string> => {
        try {
            const baked = await applyFiltersToExportable({ url, bgColor }, filterString(RESULT_DEFAULT_FILTERS));
            if (baked.url === url)
                return url;
            const uploaded = await uploadToCloudinary(baked.url);
            return uploaded || url;
        }
        catch (error) {
            console.error("Could not apply the default brightness to the saved copy:", error);
            return url;
        }
    };
    const uploadToCloudinary = async (imageData: string) => {
        if (!imageData)
            return null;
        if (/^https?:\/\//i.test(imageData))
            return imageData;
        try {
            let uploadBody: BodyInit;
            let headers: HeadersInit | undefined;
            if (imageData.startsWith("blob:")) {
                const blobResponse = await fetch(imageData);
                if (!blobResponse.ok) {
                    throw new Error("Could not read the temporary image.");
                }
                const blob = await blobResponse.blob();
                const file = new File([blob], `sebalagbe-upload-${Date.now()}.${blob.type.includes("png") ? "png" : "jpg"}`, { type: blob.type || "image/jpeg" });
                const formData = new FormData();
                formData.append("file", file);
                uploadBody = formData;
            }
            else {
                headers = { "Content-Type": "application/json" };
                uploadBody = JSON.stringify({ image: imageData });
            }
            const res = await fetch("/api/upload", {
                method: "POST",
                headers,
                body: uploadBody,
            });
            const data = await res.json().catch(() => null);
            if (res.status === 403 && data?.code === "SUBSCRIPTION_REQUIRED") {
                // Upload preview is still allowed locally; the paid cloud upload and AI
                // actions remain gated. Open the branded subscription dialog as a normal
                // product state rather than surfacing the expected 403 as a console error.
                window.dispatchEvent(new Event("sohozkaj:subscription-required"));
                setErrorMessage(null);
                return null;
            }
            if (!res.ok || !data?.success || !data?.url) {
                throw new Error(data?.error ||
                    data?.message ||
                    `Image upload failed (${res.status}).`);
            }
            return data.url as string;
        }
        catch (err) {
            console.error("Cloudinary Upload Error:", err);
            setErrorMessage(err instanceof Error ? err.message : "Image upload failed.");
            return null;
        }
    };
    const handleConfirmCrop = async (imageEl: HTMLImageElement | null) => {
        if (!tempImageForCrop) {
            setShowCropModal(false);
            return;
        }
        setIsCropping(true);
        setErrorMessage(null);
        try {
            let croppedImageUrl = tempImageForCrop;
            if (completedCrop && imageEl?.naturalWidth && imageEl?.naturalHeight) {
                const scaleX = imageEl.naturalWidth / imageEl.width;
                const scaleY = imageEl.naturalHeight / imageEl.height;
                const cropWidth = Math.max(1, completedCrop.width * scaleX);
                const cropHeight = Math.max(1, completedCrop.height * scaleY);
                const sourceX = Math.max(0, completedCrop.x * scaleX);
                const sourceY = Math.max(0, completedCrop.y * scaleY);
                const sourceCanvas = document.createElement("canvas");
                sourceCanvas.width = Math.round(cropWidth);
                sourceCanvas.height = Math.round(cropHeight);
                const sourceCtx = sourceCanvas.getContext("2d");
                if (!sourceCtx)
                    throw new Error("Could not create crop canvas.");
                sourceCtx.drawImage(imageEl, sourceX, sourceY, cropWidth, cropHeight, 0, 0, sourceCanvas.width, sourceCanvas.height);
                if (rotate % 360 !== 0) {
                    const rotatedCanvas = document.createElement("canvas");
                    const quarterTurns = ((rotate % 360) + 360) % 360;
                    const swap = quarterTurns === 90 || quarterTurns === 270;
                    rotatedCanvas.width = swap ? sourceCanvas.height : sourceCanvas.width;
                    rotatedCanvas.height = swap
                        ? sourceCanvas.width
                        : sourceCanvas.height;
                    const rotatedCtx = rotatedCanvas.getContext("2d");
                    if (!rotatedCtx)
                        throw new Error("Could not create rotation canvas.");
                    rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
                    rotatedCtx.rotate((rotate * Math.PI) / 180);
                    rotatedCtx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
                    croppedImageUrl = rotatedCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
                }
                else {
                    croppedImageUrl = sourceCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
                }
            }
            const uploadedOriginalUrl = await uploadToCloudinary(croppedImageUrl);
            let finalImageUrl = uploadedOriginalUrl || croppedImageUrl;
            if (!uploadedOriginalUrl && finalImageUrl.startsWith("blob:")) {
                const blobResponse = await fetch(finalImageUrl);
                if (!blobResponse.ok) {
                    throw new Error("Could not preserve the cropped image preview.");
                }
                const blob = await blobResponse.blob();
                finalImageUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
                    reader.onerror = () => reject(new Error("Could not convert the cropped image for preview."));
                    reader.readAsDataURL(blob);
                });
                if (!finalImageUrl) {
                    throw new Error("Could not preserve the cropped image preview.");
                }
            }
            setIsDualPreviewActive(false);
            setDualResultImage(null);
            setResultItem(null);
            setPrintSession(null);
            if (activeTarget === "left") {
                setLeftImage(finalImageUrl);
                setOriginalLeftImage(finalImageUrl);
            }
            else if (activeTarget === "right") {
                setRightImage(finalImageUrl);
                setOriginalRightImage(finalImageUrl);
            }
            else {
                setUploadedImage(finalImageUrl);
                setOriginalImageForDual(finalImageUrl);
            }
            if (tempImageForCrop.startsWith("blob:")) {
                URL.revokeObjectURL(tempImageForCrop);
            }
            setShowCropModal(false);
            setTempImageForCrop(null);
            // First-time friendly flow: guide the user through size, clothing and edits.
            const wizardRequested = wizardAfterUploadRef.current;
            wizardAfterUploadRef.current = false;
            if (activeTarget !== "left" && activeTarget !== "right" && !isDualMode && (wizardRequested || !wizardDisabled)) {
                setShowSetupWizard(true);
            }
        }
        catch (error) {
            console.error("Crop & Upload error:", error);
            setErrorMessage("Could not process this image. Please try another image.");
        }
        finally {
            setIsCropping(false);
        }
    };
    const triggerUpload = (target: "single" | "left" | "right") => {
        setActiveTarget(target);
        fileInputRef.current?.click();
    };
    // Drag and drop: a photo file dropped on an empty upload box follows exactly the same flow as picking it with the button.
    const handleDropFile = (target: "single" | "left" | "right", file: File) => {
        setActiveTarget(target);
        openImageForCrop(file);
    };
    const enableDualMode = () => {
        setIsDualMode(true);
        setSelectedSize("Dual");
        setShowVisaPopup(false);
        setShowColorPicker(false);
        setIsDualPreviewActive(false);
        const sourceForLeft = originalImageForDual || uploadedImage;
        if (sourceForLeft && !leftImage) {
            setLeftImage(sourceForLeft);
            setOriginalLeftImage(sourceForLeft);
        }
    };
    const exitDualMode = (nextSize = "") => {
        setIsDualMode(false);
        setSelectedSize(nextSize);
        setLeftImage(null);
        setRightImage(null);
        setOriginalLeftImage(null);
        setOriginalRightImage(null);
        setActiveTarget(null);
        setIsDualPreviewActive(false);
        setDualResultImage(null);
        setRegeneratingId(null);
    };
    const handleSizeClick = (sizeId: string) => {
        if (sizeId === "Visa") {
            // Clicking the already-selected Visa option clears the size constraint.
            // To choose another visa format, click Visa again to reopen its size list.
            if (!isDualMode && selectedSize === "Visa") {
                setSelectedSize("");
                setShowVisaPopup(false);
                return;
            }
            setShowVisaPopup((prev) => !prev);
            return;
        }
        setShowVisaPopup(false);
        if (sizeId === "Dual") {
            if (isDualMode && selectedSize === "Dual") {
                exitDualMode("");
                return;
            }
            enableDualMode();
            return;
        }
        if (isDualMode) {
            exitDualMode(selectedSize === sizeId ? "" : sizeId);
            return;
        }
        // Size presets behave like a toggle: clicking the active preset again
        // returns the editor to regular, unconstrained photo-editing mode.
        setSelectedSize((current) => current === sizeId ? "" : sizeId);
    };
    const handleClothingSelectionChange = (clothing: number) => {
        setSelectedClothing(clothing);
    };
    const handleRegenerateFromModal = async (imageItem: any) => {
        setResultItem(null);
        setPrintSession(null);
        setPreviewStartWithEdit(false);
        if (imageItem?.side === "dual") {
            // A combined dual photo: split the saved real photo back into left/right.
            try {
                const { left, right } = await splitDualImage(imageItem.originalUrl || imageItem.url);
                setIsDualMode(true);
                setSelectedSize("Dual");
                setShowVisaPopup(false);
                setShowColorPicker(false);
                setLeftImage(left);
                setRightImage(right);
                setOriginalLeftImage(left);
                setOriginalRightImage(right);
                setDualResultImage(null);
                setIsDualPreviewActive(false);
                setRegeneratingId(imageItem.id);
                setPreviewModalImage(null);
            }
            catch (error) {
                console.error("Dual regenerate error:", error);
                setErrorMessage("Could not open this dual photo for regeneration.");
            }
            return;
        }
        const realPhoto = imageItem.originalUrl || imageItem.url;
        setOriginalImageForDual(realPhoto);
        setOriginalLeftImage(null);
        setOriginalRightImage(null);
        setUploadedImage(realPhoto);
        setLeftImage(null);
        setRightImage(null);
        setIsDualPreviewActive(false);
        setRegeneratingId(imageItem.id);
        setPreviewModalImage(null);
    };
    const handleSaveEditedImage = async (updatedId: string, newImageUrl: string) => {
        if (!updatedId)
            return;
        try {
            let finalUrl = newImageUrl;
            if (newImageUrl.startsWith("data:")) {
                const uploaded = await uploadToCloudinary(newImageUrl);
                if (!uploaded) {
                    throw new Error("Edited image upload failed. Please try again.");
                }
                finalUrl = uploaded;
            }
            const response = await fetch(`/api/ai-generations?id=${encodeURIComponent(updatedId)}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                credentials: "include",
                body: JSON.stringify({ url: finalUrl }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok || !result?.success) {
                throw new Error(result?.error || "Failed to save the edited image.");
            }
            const savedItem = result.data;
            setRecentList((prev) => prev.map((item) => item.id === updatedId
                ? { ...item, ...(savedItem || {}), url: finalUrl }
                : item));
            setPreviewModalImage((prev: any) => prev && prev.id === updatedId
                ? { ...prev, ...(savedItem || {}), url: finalUrl }
                : prev);
            setResultItem((prev) => prev && prev.id === updatedId
                ? { ...prev, ...(savedItem || {}), url: finalUrl, rawUrl: undefined }
                : prev);
            // The saved file already contains the edits, so the dropdown values start neutral again.
            if (resultItem && resultItem.id === updatedId)
                setResultFilters(DEFAULT_FILTERS);
        }
        catch (error) {
            console.error("Error updating edited image in MongoDB:", error);
            setErrorMessage(error instanceof Error
                ? error.message
                : "Failed to save the edited image.");
            throw error;
        }
    };
    // =========================================================
    // GEMINI IMAGE EDITING FLOW
    // =========================================================
    const CLOTHING_COLOR_NAMES: Record<string, string> = {
        "#FFFFFF": "white",
        "#1E1E1E": "black",
        "#EF4444": "red",
        "#3B82F6": "blue",
        "#22C55E": "green",
        "#1E3A8A": "navy blue",
        "#6B7280": "gray",
        "#78350F": "brown",
        "#FACC15": "yellow",
        "#EC4899": "pink",
        "#A855F7": "purple",
        "#F97316": "orange",
        "#881337": "maroon",
        "#0D9488": "teal",
        "#0EA5E9": "sky blue",
        "#65A30D": "olive",
        "#E5E7EB": "beige",
        "#F59E0B": "amber",
        "#C026D3": "magenta",
        "#06B6D4": "cyan",
    };
    // Always-on professional skin retouch (applies to EVERY generation).
    // Identity (face structure) stays locked; only skin cleanliness / brightness / evenness is improved.
    const SKIN_IDENTITY_RULE = "IDENTITY: the result must be the exact same real person. Keep the face shape, bone structure, jaw, cheeks, forehead, eyes and eye shape, nose, lips, ears, expression, apparent age and permanent marks (moles, birthmarks, scars) unchanged. Keep the eyebrows, the facial hair (beard, mustache, stubble), the hairline and the hairstyle unchanged too, unless an eyebrow, beard/facial-hair, hair style or hair color edit is requested below; if such an edit is requested, apply it fully and exactly as described, and change nothing else about the face. Never create a different, generic, younger or idealized face.";
    const SKIN_RETOUCH_RULE = "PROFESSIONAL SKIN RETOUCH (always apply, exactly like a skilled Photoshop retoucher preparing a clean studio ID photo): make the skin of the face, neck, ears and any visible skin look clean, fresh, healthy, bright and evenly lit. (1) BRIGHTNESS: lift the skin brightness and luminosity by a clearly visible, medium amount, giving a mid-level fairer, clearer, brighter complexion (not a dramatic whitening). Dull, dark, dusky, grayish, muddy, sun-tanned, oily or shadowy skin must become a bright, clean, healthy complexion. (2) EVEN TONE AND CLEANLINESS: remove dark patches, tan marks, uneven pigmentation, blotchy discoloration, dirty-looking spots, stains, dust specks, pimples, acne marks, dark under-eye circles, dark areas around the mouth and nose, and oily shine, so the forehead, cheeks, nose, chin, eye area, neck and ears all share one smooth, consistent tone. (3) COLOR: remove any dull gray, yellow, green, or red cast so the skin looks neutral-warm and radiant, with the face, neck and ears matching in color. (4) NATURAL FINISH: keep realistic fine skin texture and pores; no plastic, waxy, over-smoothed or beauty-filter look. (5) LIMITS: keep the person's natural undertone and ethnicity, do not make the skin pale, chalky, gray, orange or pink, and never change face structure. The final photo should look like the same person after a high-quality professional studio retouch, clean and bright but believable. If a requested edit below deliberately changes the overall color or tone look, follow that look for the mood but still keep the skin clean, even and spot-free. If the final photo is black and white, apply the same brightness, evenness and spot removal as tones only.";
    const BACKGROUND_COLOR_NAMES: Record<string, string> = {
        "#FFFFFF": "white",
        "#3B82F6": "blue",
        "#38BDF8": "sky blue",
        "#9CA3AF": "gray",
        "#2563EB": "royal blue",
        "#0F766E": "teal",
        "#FEF3C7": "soft warm cream",
    };
    const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error("Could not read the image source.");
        }
        const blob = await response.blob();
        return new File([blob], filename, {
            type: blob.type || "image/jpeg",
        });
    };
    // "Original Size" means no photo size was chosen, whatever sizeType a saved
    // record happens to carry, so regenerate/export never force a passport size.
    const resolvePayloadSizeType = (payload: Record<string, unknown>) => {
        if (typeof payload.size === "string" && /^original size$/i.test(payload.size.trim())) {
            return "";
        }
        return typeof payload.sizeType === "string" ? payload.sizeType.trim() : selectedSize;
    };
    // Dual mode: ONE request with TWO attached photos (image = left person, image2 = right person).
    // The AI must return ONE studio group portrait of both people in the same frame.
    const buildDualPrompt = (payload: Record<string, unknown>) => {
        const transparentBackground = payload.transparentBackground === true;
        const keepOriginalBackground = payload.keepOriginalBackground === true && !transparentBackground;
        const bgColor = typeof payload.bgColor === "string" ? payload.bgColor.toUpperCase() : "#FFFFFF";
        const bgColorName = BACKGROUND_COLOR_NAMES[bgColor] || `the exact solid color represented by ${bgColor}`;
        const rawGuides = Array.isArray(payload.editingGuides)
            ? payload.editingGuides.filter((item): item is string => typeof item === "string")
            : [];
        const backgroundRef = transparentBackground
            ? "the fully removed (transparent) background"
            : keepOriginalBackground
                ? "one plain, clean, uniform white or very light neutral studio background"
                : `a solid ${bgColorName} background (${bgColor})`;
        const plan = planEditingGuides(rawGuides, { backgroundRef, side: "" });
        const skinRule = plan.skinTone ? buildSkinToneRule(plan.skinTone) : plan.appliedLabels.includes("Fair & Bright Skin") ? SKIN_RETOUCH_RULE : KEEP_SKIN_COLOR_RETOUCH_RULE;
        const describeClothing = (value: unknown, colorValue: unknown) => {
            const index = typeof value === "number" ? value : -1;
            if (index < 0 || !CLOTHING_NAMES[index]) {
                return "keep their original clothing exactly as it appears in their own photo (same garment, same color, same neckline); only straighten it naturally for the upright pose";
            }
            const clothingPrompt = CLOTHING_STYLES[index]?.prompt || `a ${CLOTHING_NAMES[index].toLowerCase()}`;
            const colorHex = typeof colorValue === "string" ? colorValue.toUpperCase() : "";
            const colorName = CLOTHING_COLOR_NAMES[colorHex] || (colorHex ? `the exact color ${colorHex}` : "a natural color");
            return `replace ONLY their visible clothing with ${clothingPrompt}, in ${colorName}, neatly ironed, symmetrical, properly fitted to the body and shoulders, with a realistic collar and neckline`;
        };
        const backgroundRule = transparentBackground
            ? "BACKGROUND: remove the entire background cleanly from both people with no halos, gray outlines, or leftover fragments. Both people are isolated on one shared transparent canvas."
            : keepOriginalBackground
                ? "BACKGROUND: ONE single seamless plain studio backdrop behind BOTH people, pure white or a very light neutral shade, perfectly uniform from edge to edge. It must NOT be two different backdrops, must NOT show a seam or dividing line in the middle, and must contain no scenery, gradient, pattern, object, or shadow."
                : `BACKGROUND: ONE single seamless solid ${bgColorName} backdrop behind BOTH people, exact color ${bgColor}, perfectly uniform from edge to edge. It must NOT be two different backdrops, must NOT show a seam or dividing line in the middle, and must contain no scenery, gradient, vignette, pattern, object, or shadow.`;
        const rules = [
            "You are a professional passport and ID photographer working in a studio with a DSLR camera. Produce ONE perfect studio group portrait of two people from the two attached photos.",
            "INPUTS: The FIRST attached photo shows Person A, who must appear on the LEFT side of the final image. The SECOND attached photo shows Person B, who must appear on the RIGHT side. Each attached photo contains exactly one person. Use each person's own photo as the one and only reference for that person's face.",
            "OUTPUT: Return exactly ONE image. It is a single photograph of both people sitting side by side in the same frame, as if one camera took one shot of them posing together. It is NOT a collage, NOT a split screen, NOT two separate photos placed next to each other, and has no divider, gap, border, frame, or line between them. Never return the attached photos unchanged.",
            "CANVAS: landscape, aspect ratio exactly 90:55 (about 1.64 : 1). The backdrop must fill the ENTIRE canvas edge to edge. No white, black, or colored bars, margins, strips, or letterboxing at the top, bottom, or sides.",
            `IDENTITY LOCK (highest priority for face structure): Each person's face must remain exactly the same real person. Keep the exact face shape, jaw, cheeks, forehead, eyes and eye shape, nose, lips, teeth, ears, moles, scars, birthmarks and apparent age. Also keep the eyebrows, facial hair, hairline and hairstyle (unless an eyebrow, beard/facial-hair, hair style or hair color edit is requested below; if one is requested, apply it fully to the person it is meant for). Do NOT slim, enlarge, age, reshape, or re-draw any face. Do NOT average, blend, or swap features between the two people. Do NOT create a generic or idealized face. If you must choose between a nicer-looking result and a different face, choose the identical face structure. Both faces must be clearly recognizable as the people in their own photos. (Skin cleanliness and brightness are improved separately, see SKIN RETOUCH.)${plan.expression && expressionChangesFace(plan.expression) ? " The only exception is the facial expression, which follows the EXPRESSION rule." : ""}`,
            `${skinRule} ${plan.skinTone ? "Apply this chosen skin color to BOTH people, with the same level of cleanliness, so the two people look consistent side by side." : "Apply this to BOTH people, keeping each person's own natural skin color exactly (never copy one person's skin color onto the other), with the same level of cleanliness, so the two people look consistent side by side."}`,
            ...(plan.expression ? [`${buildExpressionRule(plan.expression)} Apply this expression to BOTH people.`] : []),
            `${buildStandardFinishRule(plan, { sized: true })} Apply this to BOTH people.`,
            `POSE AND CAMERA: classic passport-studio pose for BOTH people. Sitting upright with straight backs, shoulders square to the camera and level, necks long and relaxed, heads perfectly straight with no tilt, turn, or lean, chin level, eyes open and looking directly into the lens, ${plan.expression ? "with the expression described in the EXPRESSION rule" : "natural neutral expression with the mouth closed (a very slight natural smile at most)"}. If a person's original photo is tilted, turned, or leaning, re-pose only the head and body to face the camera straight while keeping the face identical. The camera is at eye level, shot with a long portrait lens (about 85mm equivalent), no wide-angle distortion.`,
            "FRAMING: Person A is centered in the left half and Person B is centered in the right half, sitting close together so their shoulders almost touch (a very slight overlap of shoulders is fine) with no faces overlapping or hidden. Both people are at exactly the same scale, with their eyes on the same horizontal line and the tops of their heads at the same height, with a small even headroom above. Show each person from the top of the head down to the upper chest. Both are fully inside the frame with nothing cut off.",
            backgroundRule,
            "LIGHTING: soft, even, frontal studio lighting on both faces, identical color temperature and exposure for both people, no harsh shadows on faces, no shadow cast on the backdrop, no color cast. Clean, bright, natural-looking skin, sharp focus, realistic DSLR photo quality.",
            `CLOTHING: Person A (left): ${describeClothing(payload.leftClothing, payload.leftClothingColor)}. Person B (right): ${describeClothing(payload.rightClothing, payload.rightClothingColor)}.`,
            "STRICTLY FORBIDDEN: extra people, text, letters, logos, watermarks, frames, borders, dividing lines, props, jewelry or accessories that are not in the original photos, changed hijab/head covering, changed hair, eyebrows or facial hair (unless such an edit is requested below), changed face structure, a different ethnicity or unnaturally pale/gray/orange skin, cartoon or painted or AI-art look, and any stylization.",
            "BEFORE ANSWERING, silently verify: (1) exactly one image with both people in the same frame; (2) Person A is left and Person B is right; (3) both faces have the same structure as their own photos, with clean, bright, even, spot-free skin; (4) both sit upright facing the camera at the same size and height; (5) one uniform backdrop fills the whole canvas with no strip or seam; (6) clothing matches the instructions. Fix anything that fails before you answer.",
        ];
        if (!plan.appliedLabels.includes("Keep Marks")) {
            const lockIndex = rules.findIndex((rule) => rule.startsWith("IDENTITY LOCK"));
            if (lockIndex >= 0) {
                rules[lockIndex] = rules[lockIndex].replace("ears, moles, scars, birthmarks and apparent age", "ears and apparent age");
            }
        }
        const sections = [rules.join("\n\n")];
        if (plan.edits.length > 0) {
            sections.push([
                plan.edits.length > 1
                    ? "Additional requested edits, apply them to both people together as one coordinated edit, in the order listed, without ever changing anyone's face or identity:"
                    : "Additional requested edit, apply it to both people without ever changing anyone's face or identity:",
                ...plan.edits.map((edit, index) => `${index + 1}. ${edit}`),
            ].join("\n"));
        }
        if (plan.constraints.length > 0) {
            sections.push([
                "Also follow these preservation rules:",
                ...plan.constraints.map((rule) => `- ${rule}`),
            ].join("\n"));
        }
        if (plan.customInstruction) {
            sections.push(`Custom instruction from the user (apply it together with the rules above; never change anyone's face or identity): ${plan.customInstruction}`);
        }
        sections.push("The application handles the exact pixel dimensions after generation, so do not add any text or size labels.");
        return sections.join("\n\n");
    };
    // Always added to EVERY prompt (single, dual, regenerate): the photo must come out ultra sharp and perfectly clean.
    const QUALITY_PREFIX = "TOP PRIORITY FOR EVERY IMAGE: the output must be ULTRA HIGH RESOLUTION, sharp, and perfectly CLEAN, with the face exactly as clean as in the original photo and the same skin color.";
    const QUALITY_SUFFIX = "FINAL QUALITY REQUIREMENTS (apply to every photo, always): (1) RESOLUTION: output at the highest resolution and sharpness you can produce, like a 50-megapixel studio camera shot, so hair strands, eyebrows, eyelashes, eyes, beard, clothing fabric, collar edges, stitching, buttons and tie pattern stay crisp and clear even when zoomed in. (2) CLEAN FACE (very important): the face, forehead, cheeks, nose, chin, neck and ears must be completely clean and spotless, exactly like the person's own clean skin in the original photo. NEVER add any dark spots, dots, moles, freckles, birthmarks, patches, blotches, stains, scars, warts or marks of any kind that are not clearly in the original photo; if the original has any, remove them. Keep the exact same skin color as the original photo. (3) CLEAN IMAGE: no blur, no noise or grain, no compression artifacts, no pixelation, no halos or jagged edges around the hair and shoulders, no dust, no watermark, no text, and a perfectly clean uniform backdrop. (4) NATURAL: a believable real photograph, never plastic, waxy, painted or over-smoothed. (5) IDENTITY: the person's face, identity and anatomy stay exactly the same.";
    const buildAiEditingPrompt = (payload: Record<string, unknown>) => {
        if (payload.dualMode === true) {
            return buildDualPrompt(payload);
        }
        const sizeType = resolvePayloadSizeType(payload);
        const hasSelectedPhotoSize = Boolean(sizeType);
        const transparentBackground = payload.transparentBackground === true;
        const keepOriginalBackground = payload.keepOriginalBackground === true && !transparentBackground;
        const bgColor = typeof payload.bgColor === "string"
            ? payload.bgColor.toUpperCase()
            : "#FFFFFF";
        const bgColorName = BACKGROUND_COLOR_NAMES[bgColor] ||
            `the exact solid color represented by ${bgColor}`;
        const side = typeof payload.side === "string" ? payload.side : "";
        const rawGuides = Array.isArray(payload.editingGuides)
            ? payload.editingGuides.filter((item): item is string => typeof item === "string")
            : [];
        // Presets that mention the backdrop get the real, current background choice.
        const backgroundRef = transparentBackground
            ? "the fully removed (transparent) background"
            : keepOriginalBackground
                ? "a plain, clean area in the photo's own dominant background color (plain white if there is none)"
                : `a solid ${bgColorName} background (${bgColor})`;
        const plan = planEditingGuides(rawGuides, { backgroundRef, side });
        const { flags } = plan;
        // User asked for a straight, front-facing studio pose: this overrides every "keep the original pose/angle" rule.
        const studioPose = plan.appliedLabels.includes("Studio Straight Pose");
        const skinRule = plan.skinTone ? buildSkinToneRule(plan.skinTone) : plan.appliedLabels.includes("Fair & Bright Skin") ? SKIN_RETOUCH_RULE : KEEP_SKIN_COLOR_RETOUCH_RULE;

        // Head cloth (dupatta / scarf / veil) belongs to the OLD clothing. When the user picked new clothing that does not cover
        // the head, it must go away (same as a normal edit); only a head-covering style or "keep my clothes" keeps it.
        const poseClothingName = typeof payload.clothing === "number" && CLOTHING_NAMES[payload.clothing] ? CLOTHING_NAMES[payload.clothing] : "";
        const poseKeepsHeadCover = !poseClothingName || ["Hijab", "Burqa", "Niqab", "Khimar"].includes(poseClothingName);
        const poseHeadCoverRule = poseKeepsHeadCover
            ? "HEAD COVERING: keep the person's own hijab, scarf or head covering (same color, style and fabric), re-draped symmetrically on both sides of the face."
            : "HEAD COVERING (must follow): the person's old clothes are being replaced, so any cloth on or around the head or over the shoulders in the input (dupatta, scarf, shawl, hijab, veil, wrap) must be completely REMOVED and NOT redrawn. The head is uncovered, the real hair is visible naturally, and only the newly chosen clothing appears on the body, exactly like a normal passport edit. Do not keep, copy or re-drape the old head cloth.";
        const instructions = [
            flags.restoration
                ? hasSelectedPhotoSize
                    ? "Restore the provided photograph, keeping its original composition, and make the result suitable for a professional ID/passport-style photo."
                    : "Restore the provided photograph, keeping its original composition and aspect ratio."
                : hasSelectedPhotoSize
                    ? "Edit the provided portrait photo for a professional ID/passport-style result."
                    : "Edit the provided image naturally, preserving its original composition and aspect ratio unless the requested edits require a change.",
            `${(plan.appliedLabels.includes("Keep Marks") ? SKIN_IDENTITY_RULE : SKIN_IDENTITY_RULE.replace("apparent age and permanent marks (moles, birthmarks, scars) unchanged", "and apparent age unchanged")).replace(expressionChangesFace(plan.expression) ? "ears, expression, " : "\u0000", "ears, ")} ${skinRule}`,
            ...(plan.expression ? [buildExpressionRule(plan.expression)] : []),
            buildStandardFinishRule(plan, { sized: hasSelectedPhotoSize }),
            flags.restoration
                ? "Do not add extra people, duplicate facial features, text, logos, frames, borders, or watermarks. Keep every person who is already in the photo."
                : "Do not add extra people, duplicate facial features, text, logos, frames, borders, or watermarks.",
            studioPose
                ? "POSE OVERRIDE (highest priority, it beats every instruction to keep the original pose, angle, framing or expression): the person in the input is NOT sitting straight, so the output MUST show a visibly different, corrected pose. Do not just rotate or deskew the whole picture: redraw the head, neck and shoulders so they are truly frontal and symmetrical."
                : hasSelectedPhotoSize && !(flags.restoration && !flags.posePreset)
                    ? "Keep the person centered and facing the camera unless the requested edit explicitly changes the head angle."
                    : "Preserve the original framing, subject placement, pose, and camera angle unless the requested edit explicitly requires a change.",
            plan.expression
                ? "Apart from the professional skin retouch above, the requested edits and the requested expression, avoid any other changes to the person's face."
                : "Apart from the professional skin retouch above and the requested edits, avoid any other changes to the person's face.",
        ];
        const clothingIndex = typeof payload.clothing === "number" ? payload.clothing : -1;
        if (clothingIndex >= 0 && CLOTHING_NAMES[clothingIndex]) {
            const clothingName = CLOTHING_NAMES[clothingIndex];
            const clothingPrompt = CLOTHING_STYLES[clothingIndex]?.prompt || `a ${clothingName.toLowerCase()}`;
            const colorHex = typeof payload.clothingColor === "string"
                ? payload.clothingColor.toUpperCase()
                : "";
            const colorName = CLOTHING_COLOR_NAMES[colorHex] ||
                (colorHex ? `the selected color (${colorHex})` : "a natural color");
            instructions.push(`Change only the visible clothing to ${clothingPrompt}, professionally styled, in ${colorName}. ${studioPose ? "Keep the face, ears, neck, and body proportions natural (the pose follows the studio pose rule)" : "Keep the face, ears, neck, body proportions, and pose natural"}, and keep the hair as it is unless a hair edit is requested below. Make the clothing edges realistic and properly fitted to the body. ${plan.skinTone ? "Changing the clothing must NOT tint the skin: the clothing color must cast no color onto the face, neck or hands, and the skin color follows the chosen skin color rule above." : "Changing the clothing must NOT change the skin: keep the face, neck and hands in exactly the same skin color and shade as the original photo, never darker, redder or tinted by the clothing color."}`);
            if (plan.tie && TIE_STYLES.includes(clothingName)) {
                const tieColor = TIE_COLORS.find((c) => c.name === plan.tie);
                instructions.push(
                    plan.tie === "None"
                        ? "Do NOT add any necktie or bow tie: the shirt collar is neatly buttoned or open with no tie at all."
                        : `The clothing includes a plain, neatly knotted necktie in ${tieColor ? `${tieColor.name.toLowerCase()} (${tieColor.hex})` : plan.tie}, centered, symmetrical, tucked under the shirt collar, with a correct knot and realistic fabric.`,
                );
            }
        }
        if (studioPose && !(clothingIndex >= 0 && CLOTHING_NAMES[clothingIndex])) {
            // The model only really re-poses the body when it redraws the clothing, so for "keep my clothes" we ask it to
            // redraw the person's OWN clothing as an identical copy on the straightened body.
            instructions.push("CLOTHING REDRAW (required for the straight pose): the person keeps their own clothing, but you must REDRAW it from scratch on the newly straightened body, as if replacing the clothes with a perfect identical copy. The copy must be exactly the same garment type, the same exact colors and shades (for example orange stays the same orange, black stays black), the same print or pattern, the same fabric look, the same neckline and collar, and the same head covering (hijab, scarf, burqa, cap) in the same style and color, now hanging neatly and symmetrically on both sides. Do not change the clothing design or color in any way, and do not copy the old slanted shoulder line or the old crooked folds.");
        }
        if (studioPose && !poseKeepsHeadCover) {
            instructions.push(poseHeadCoverRule);
        }
        if (studioPose) {
            instructions.push(plan.skinTone
                ? "SKIN COLOR FOR THE RE-POSE (very important): the skin of the face, neck, ears and hands must have the chosen skin color from the skin rule above, the same shade on all of them. Re-posing or redrawing the clothing must not make the skin darker, redder, yellower or paler than that chosen color, and colored clothing or head covering must not cast any color onto it."
                : "SKIN COLOR LOCK FOR THE RE-POSE (very important): the skin of the face, neck and hands must keep EXACTLY the same color, shade, depth and undertone as in the original input photo. Re-posing or redrawing the clothing must not darken, tan, redden, yellow, whiten or tint the skin, and colored clothing or head covering must not cast any color onto it. A fair skin stays fair, a wheatish skin stays wheatish, a dark skin stays dark.");
        }
        if (keepOriginalBackground) {
            if (flags.alteringBackground) {
                instructions.push("Keep the original background's overall scene, color, and layout. Do not replace it with a different scene or a new color; only apply the background clean-up requested below.");
            }
            else if (flags.wholeImage) {
                instructions.push("Keep the original background scene, objects, and layout as they are. Do not remove, replace, or restyle it. The repair, tone, color, and clarity edits requested below may apply to the whole image, including the background.");
            }
            else {
                instructions.push("Keep the original background exactly as it is. Do not remove, replace, recolor, blur, or alter the background in any way.");
            }
        }
        else if (transparentBackground) {
            instructions.push("Remove the entire background cleanly and isolate the person from head to shoulders/upper torso. Do not leave halos, gray outlines, or background fragments. Keep the subject's edges natural.");
        }
        else if (flags.monochrome) {
            instructions.push(`Replace the background with a clean, uniform, solid background in the grayscale (neutral black-and-white) equivalent of ${bgColorName} (${bgColor}), because the final photo is black and white. Do not add scenery, gradients, patterns, shadows, or objects.`);
        }
        else {
            instructions.push(`Replace the background with a clean, uniform studio-style solid ${bgColorName} background. Target background color: ${bgColor}. Do not add scenery, gradients, patterns, shadows, or objects.`);
            if (flags.wholeImage) {
                instructions.push("Keep the background exactly this solid color: do not let exposure, color, grain, glow, or lighting edits add tint, gradients, vignetting, shading, or texture to it.");
            }
        }

        const sections = [instructions.join(" ")];
        if (studioPose) {
            // The pose request goes FIRST (models weigh the start of a prompt most) and is checked again at the very end.
            sections.unshift([
                "TOP PRIORITY TASK: STRAIGHTEN THE PERSON INTO A STRICT FRONTAL STUDIO PASSPORT POSE.",
                "The input photo was taken crooked: the head is tilted or leaning to one side, the neck is slanted, the shoulders are uneven or turned, and the body is not square to the camera. The output must NOT keep that crooked pose. Re-pose the person as if they had sat down on a studio stool in front of a passport photographer and been photographed straight-on.",
                "Measurable requirements for the output: (1) an imaginary vertical line through the middle of the forehead, the nose, the center of the lips and the chin is perfectly vertical; (2) an imaginary line through the outer corners of both eyes is perfectly horizontal, and both eyes are the same height; (3) the ears are at the same height and both sides of the face are equally visible, with no head turn to the left or right; (4) the neck is straight and vertical, centered between the shoulders; (5) both shoulders are at exactly the same height, square to the camera, symmetrical about the center line, with the torso facing the camera directly; (6) the chin is level, neither raised nor lowered; (7) both eyes look straight into the camera lens.",
                "How to do it: do NOT merely rotate or deskew the whole picture. Redraw the head, neck and shoulders in the corrected frontal orientation. A head that leans must be brought upright, a turned head must be turned to face the camera, and a raised shoulder must be lowered. The final image must visibly differ from the input in head angle and shoulder line.",
                poseHeadCoverRule,
                "Identity rule for this task: identity means the face itself (facial features, face shape, skin color, eyebrows, eye shape, nose, lips, moles/marks as specified below, apparent age). Changing the head orientation and body pose is explicitly ALLOWED and REQUIRED here, and it does not violate any instruction to keep the person unchanged. The same real person must be recognizable, just sitting straight.",
            ].join("\n"));
        }
        if (plan.edits.length > 0) {
            sections.push([
                plan.edits.length > 1
                    ? "Apply the following requested edits together as one coordinated edit, in the order listed (repair and technical corrections first, stylistic finish last). Keep every request, and never let any edit change the person's identity or anatomy:"
                    : "Apply the following requested edit:",
                ...plan.edits.map((edit, index) => `${index + 1}. ${edit}`),
            ].join("\n"));
        }
        if (plan.constraints.length > 0) {
            sections.push([
                "Also follow these preservation rules:",
                ...plan.constraints.map((rule) => `- ${rule}`),
            ].join("\n"));
        }
        if (plan.customInstruction) {
            sections.push(`Custom instruction from the user (apply it together with the edits above; if it conflicts with a preset above, follow the custom instruction, but never change the person's identity): ${plan.customInstruction}`);
        }
        if (hasSelectedPhotoSize) {
            const size = typeof payload.size === "string" ? payload.size : getCurrentSizeLabel();
            sections.push(`Prepare the composition to suit the selected final document/photo size (${size}). The application will handle the exact pixel dimensions after generation, so do not add any text or size labels.`);
        }
        if (studioPose) {
            sections.push("FINAL POSE CHECK (do this silently before answering): if the head is still tilted, turned or leaning, if the eye line is not horizontal, if one shoulder is higher than the other, if the neck is slanted, or if the person is not looking straight into the lens, the pose is WRONG. Fix it and check again until the pose is perfectly straight and frontal, while the face stays the same real person.");
        }
        return sections.join("\n\n");
    };
    const loadImageForCanvas = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not load image for the dual photo."));
        img.src = src;
    });
    // Joins the left and right person into ONE image (left person | right person).
    const composeDualImage = async (leftSrc: string, rightSrc: string, transparentBackground: boolean, fillColor?: string) => {
        const single = getExactExportDimensions("45×55 mm");
        const [leftImg, rightImg] = await Promise.all([
            loadImageForCanvas(leftSrc),
            loadImageForCanvas(rightSrc),
        ]);
        const canvas = document.createElement("canvas");
        canvas.width = single.widthPx * 2;
        canvas.height = single.heightPx;
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not create the dual photo canvas.");
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        if (!transparentBackground) {
            const selectedBgValue = getSelectedBgColorValue();
            context.fillStyle = fillColor || (selectedBgValue === "transparent" ? "#FFFFFF" : selectedBgValue);
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        // Each half is exactly one 45x55 mm photo; fit (never crop) inside its half.
        const drawHalf = (img: HTMLImageElement, offsetX: number) => {
            const sw = img.naturalWidth || img.width;
            const sh = img.naturalHeight || img.height;
            const scale = Math.min(single.widthPx / sw, single.heightPx / sh);
            const dw = Math.max(1, Math.round(sw * scale));
            const dh = Math.max(1, Math.round(sh * scale));
            context.drawImage(img, 0, 0, sw, sh, offsetX + Math.round((single.widthPx - dw) / 2), single.heightPx - dh, dw, dh);
        };
        drawHalf(leftImg, 0);
        drawHalf(rightImg, single.widthPx);
        const dataUrl = transparentBackground
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        const result = { dataUrl, widthPx: canvas.width, heightPx: canvas.height, dpi: single.dpi };
        canvas.width = 0;
        canvas.height = 0;
        return result;
    };
    // Splits a saved combined dual image back into its left and right halves.
    const splitDualImage = async (src: string) => {
        const img = await loadImageForCanvas(src);
        const sw = img.naturalWidth || img.width;
        const sh = img.naturalHeight || img.height;
        const half = Math.floor(sw / 2);
        const cut = (sx: number, sWidth: number) => {
            const canvas = document.createElement("canvas");
            canvas.width = sWidth;
            canvas.height = sh;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Could not split the dual photo.");
            }
            ctx.drawImage(img, sx, 0, sWidth, sh, 0, 0, sWidth, sh);
            const out = canvas.toDataURL("image/png");
            canvas.width = 0;
            canvas.height = 0;
            return out;
        };
        return { left: cut(0, half), right: cut(half, sw - half) };
    };
    const callGenerateApi = async (payload: Record<string, unknown>) => {
        let image = typeof payload.image === "string" ? payload.image.trim() : "";
        if (!image) {
            throw new Error("No source image was provided.");
        }

        // These values can contain large base64 image strings. Keep them request-scoped
        // and release references in finally after success or failure.
        let prompt = "";
        let result: any = null;
        let normalized: Awaited<ReturnType<typeof normalizeImageToExactPhysicalSize>> | null = null;
        const formData = new FormData();
        const controller = new AbortController();
        // The bot can queue a request (up to ~200s when many people generate at once)
        // and may retry on another Gemini account, so wait up to 5 minutes.
        const GENERATE_TIMEOUT_MS = 300000;
        const generateStartedAt = Date.now();
        const timeoutId = window.setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

        try {
            const chosenSkinTone = Array.isArray(payload.editingGuides) && payload.editingGuides.some((item) => typeof item === "string" && item.startsWith("Skin Tone:"));
            const qualityPrefix = chosenSkinTone ? QUALITY_PREFIX.replace("and the same skin color.", "and the skin color chosen in the skin rule below.") : QUALITY_PREFIX;
            const qualitySuffix = chosenSkinTone ? QUALITY_SUFFIX.replace("Keep the exact same skin color as the original photo.", "Use the skin color chosen in the skin rule above on the whole face, neck and ears.") : QUALITY_SUFFIX;
            prompt = `${qualityPrefix}\n\n${buildAiEditingPrompt(payload)}\n\n${qualitySuffix}`;
            if (/^https?:\/\//i.test(image)) {
                formData.append("imageUrl", image);
            }
            else {
                const sourceFile = await dataUrlToFile(image, `sebalagbe-ai-source-${Date.now()}.jpg`);
                formData.append("image", sourceFile);
            }
            // Dual mode only: the second person's photo travels in the same request.
            const secondImage = typeof payload.image2 === "string" ? payload.image2.trim() : "";
            if (secondImage) {
                if (/^https?:\/\//i.test(secondImage)) {
                    formData.append("imageUrl2", secondImage);
                }
                else {
                    const secondFile = await dataUrlToFile(secondImage, `sebalagbe-ai-source2-${Date.now()}.jpg`);
                    formData.append("image2", secondFile);
                }
            }
            formData.append("prompt", prompt);

            let response: Response;
            let autoRetried = false;
            while (true) {
                response = await fetch("/api/image-generate", {
                    method: "POST",
                    body: formData,
                    signal: controller.signal,
                    cache: "no-store",
                });
                result = await response.json().catch(() => null);
                // One quiet automatic retry for temporary failures (bot busy, gateway timeout).
                // Not for "Gemini could not make this image" (422): the bot already tried
                // other accounts for that. Not when the subscription is
                // missing, when the bot says to wait long, or when a lot of time is already used.
                const retryAfterSeconds = Number(result?.retryAfter) || Number(response.headers.get("retry-after")) || 0;
                const canRetry = !response.ok &&
                    [502, 503, 504].includes(response.status) &&
                    result?.code !== "SUBSCRIPTION_REQUIRED" &&
                    retryAfterSeconds <= 30 &&
                    Date.now() - generateStartedAt < 150000;
                if (canRetry && !autoRetried) {
                    autoRetried = true;
                    await new Promise((resolve) => window.setTimeout(resolve, 3000));
                    continue;
                }
                break;
            }
            if (!response.ok || !result?.success || typeof result.image !== "string") {
                if (response.status === 403 && result?.code === "SUBSCRIPTION_REQUIRED") {
                    window.dispatchEvent(new Event("sohozkaj:subscription-required"));
                    throw new Error("SUBSCRIPTION_REQUIRED");
                }
                // Never show raw technical text (bot page URL, button lists, stack info).
                const rawMessage = typeof result?.error === "string" ? result.error : "";
                const looksTechnical = rawMessage.length > 300 ||
                    /\[page:|signInVisible|buttons:|playwright|gemini\.google|https?:\/\//i.test(rawMessage);
                const message = !rawMessage || looksTechnical
                    ? "একটু অপেক্ষা করুন, ছবিটি তৈরি হতে সাধারণের চেয়ে বেশি সময় লাগছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
                    : rawMessage;
                throw new Error(message);
            }

            const sizeType = resolvePayloadSizeType(payload);
            let cloudUrl: string | null;
            if (sizeType) {
                const currentSize = typeof payload.size === "string" ? payload.size : getCurrentSizeLabel();
                const transparentBackground = payload.transparentBackground === true;
                normalized = await normalizeImageToExactPhysicalSize(result.image, currentSize, transparentBackground, payload.dualMode === true);
                if (payload.skipUpload === true) {
                    // Dual mode composes both people into one image first, then uploads once.
                    return normalized.dataUrl;
                }
                cloudUrl = await uploadToCloudinary(normalized.dataUrl);
            } else {
                // No photo preset selected: keep the generated image's natural pixel size.
                cloudUrl = await uploadToCloudinary(result.image);
            }
            if (!cloudUrl) {
                throw new Error("Generated photo could not be uploaded to Cloudinary, so it was not saved.");
            }
            return cloudUrl;
        }
        catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                throw new Error("Image generation took too long. Please try again.");
            }
            throw error;
        }
        finally {
            window.clearTimeout(timeoutId);
            controller.abort();
            window.dispatchEvent(new Event("sohozkaj:generation-finished"));
            // FormData may hold a File backed by the temporary source image.
            formData.delete("image");
            formData.delete("imageUrl");
            formData.delete("image2");
            formData.delete("imageUrl2");
            formData.delete("prompt");
            if (result && typeof result.image === "string") {
                result.image = "";
            }
            result = null;
            normalized = null;
            prompt = "";
            image = "";
        }
    };
    const handleGeneratePhoto = async () => {
        setErrorMessage(null);
        if (isDualMode) {
            if (!leftImage || !rightImage) {
                setErrorMessage("Dual mode needs both left and right photos.");
                return;
            }
        }
        else if (!uploadedImage) {
            setErrorMessage("Upload a photo before generating.");
            return;
        }
        if (generationInFlightRef.current) {
            return;
        }
        generationInFlightRef.current = true;
        let generationSucceeded = false;
        setResultItem(null);
        setPrintSession(null);
        setIsGenerating(true);
        try {
            const currentSizeLabel = getCurrentSizeLabel();
            const currentBgHex = getSelectedBgColorValue();
            const transparentBackground = isTransparentBackground();
            const exactExport = selectedSize ? getExactExportDimensions(currentSizeLabel) : null;
            const basePayload = {
                size: currentSizeLabel,
                sizeType: selectedSize,
                bgColor: currentBgHex,
                transparentBackground,
                keepOriginalBackground: isKeepOriginalBackground(),
                clothing: selectedClothing,
                clothingColor: selectedClothingColor,
                editingGuides,
                widthPx: exactExport?.widthPx ?? 0,
                heightPx: exactExport?.heightPx ?? 0,
                dpi: exactExport?.dpi ?? EXPORT_DPI,
            };
            if (isDualMode) {
                const leftSource = originalLeftImage || leftImage!;
                const rightSource = originalRightImage || rightImage!;
                const dualExport = getExactExportDimensions("90×55 mm");
                // Both photos go to the AI as two separate images in ONE request
                // (image = left person, image2 = right person). The AI returns ONE
                // group photo with both people in the same frame.
                // A side-by-side copy of the real photos is only kept for Regenerate.
                const reference = await composeDualImage(leftSource, rightSource, false, "#FFFFFF");
                const combinedUrl = await callGenerateApi({
                    ...basePayload,
                    image: leftSource,
                    image2: rightSource,
                    dualMode: true,
                    size: "90×55 mm",
                    leftClothing,
                    rightClothing,
                    leftClothingColor,
                    rightClothingColor,
                    widthPx: dualExport.widthPx,
                    heightPx: dualExport.heightPx,
                });
                // Keep the combined "real photo" too, so Regenerate can restore both people.
                let combinedOriginal: string = reference.dataUrl;
                try {
                    combinedOriginal = (await uploadToCloudinary(reference.dataUrl)) || reference.dataUrl;
                }
                catch (originalError) {
                    console.error("Could not save the combined original photo:", originalError);
                }
                setDualResultImage(combinedUrl);
                setOriginalImageForDual(originalLeftImage || leftImage);
                const savedCombinedUrl = await saveBrightenedCopy(combinedUrl, currentBgHex);
                const dualDocData = {
                    url: savedCombinedUrl,
                    originalUrl: combinedOriginal,
                    size: "90×55 mm",
                    sizeType: selectedSize,
                    widthPx: dualExport.widthPx,
                    heightPx: dualExport.heightPx,
                    dpi: dualExport.dpi,
                    bgColor: currentBgHex,
                    clothingStyle: `Left Style ${leftClothing} / Right Style ${rightClothing}`,
                    clothingColor: selectedClothingColor,
                    editingGuides,
                    side: "dual",
                    source: "ai-editor",
                };
                if (regeneratingId) {
                    const response = await fetch(`/api/ai-generations?id=${encodeURIComponent(regeneratingId)}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            ...getAuthHeaders(),
                        },
                        credentials: "include",
                        body: JSON.stringify(dualDocData),
                    });
                    const result = await response.json().catch(() => null);
                    if (!response.ok || !result?.success) {
                        throw new Error(result?.error || "Failed to update the generated photo.");
                    }
                    const updatedItem = result.data || {
                        id: regeneratingId,
                        ...dualDocData,
                    };
                    setRecentList((prev) => prev.map((item) => item.id === regeneratingId ? { ...item, ...updatedItem } : item));
                    showGeneratedResult({ ...dualDocData, ...updatedItem, rawUrl: combinedUrl } as GeneratedResultItem, combinedUrl);
                }
                else {
                    const response = await fetch("/api/ai-generations", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...getAuthHeaders(),
                        },
                        credentials: "include",
                        body: JSON.stringify(dualDocData),
                    });
                    const result = await response.json().catch(() => null);
                    if (!response.ok || !result?.success) {
                        throw new Error(result?.error || "Failed to save generated photo.");
                    }
                    const createdItem = Array.isArray(result.data) ? result.data[0] : result.data;
                    if (createdItem) {
                        setRecentList((prev) => [createdItem, ...prev]);
                    }
                    showGeneratedResult({ ...dualDocData, ...(createdItem || {}), rawUrl: combinedUrl } as GeneratedResultItem, combinedUrl);
                }
                generationSucceeded = true;
                return;
            }
            const rawImage = originalImageForDual || uploadedImage!;
            const generatedUrl = await callGenerateApi({
                ...basePayload,
                image: rawImage,
            });
            let outputDimensions: { widthPx: number; heightPx: number; dpi?: number } | null = exactExport;
            if (!outputDimensions) {
                outputDimensions = await getImageRasterDimensions(generatedUrl);
                if (!outputDimensions.widthPx || !outputDimensions.heightPx) {
                    outputDimensions = await getImageRasterDimensions(rawImage);
                }
            }
            const finalOriginal = originalImageForDual || rawImage;
            setOriginalImageForDual(finalOriginal);
            setUploadedImage(generatedUrl);
            setIsDualPreviewActive(false);
            const savedGeneratedUrl = await saveBrightenedCopy(generatedUrl, currentBgHex);
            const newDocData = {
                url: savedGeneratedUrl,
                originalUrl: finalOriginal,
                size: currentSizeLabel,
                sizeType: selectedSize,
                widthPx: outputDimensions?.widthPx ?? 0,
                heightPx: outputDimensions?.heightPx ?? 0,
                dpi: exactExport?.dpi ?? EXPORT_DPI,
                bgColor: currentBgHex,
                clothingStyle: `Style ${selectedClothing}`,
                clothingColor: selectedClothingColor,
                editingGuides,
                side: "single",
                source: "ai-editor",
            };
            if (regeneratingId) {
                const response = await fetch(`/api/ai-generations?id=${encodeURIComponent(regeneratingId)}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    credentials: "include",
                    body: JSON.stringify(newDocData),
                });
                const result = await response.json().catch(() => null);
                if (!response.ok || !result?.success) {
                    throw new Error(result?.error || "Failed to update the generated photo.");
                }
                const updatedItem = result.data || {
                    id: regeneratingId,
                    ...newDocData,
                };
                setRecentList((prev) => prev.map((item) => item.id === regeneratingId ? { ...item, ...updatedItem } : item));
                showGeneratedResult({ ...newDocData, ...updatedItem, rawUrl: generatedUrl } as GeneratedResultItem, generatedUrl);
            }
            else {
                const response = await fetch("/api/ai-generations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    credentials: "include",
                    body: JSON.stringify(newDocData),
                });
                const result = await response.json().catch(() => null);
                if (!response.ok || !result?.success) {
                    throw new Error(result?.error || "Failed to save generated photo.");
                }
                const createdItem = Array.isArray(result.data)
                    ? result.data[0]
                    : result.data;
                if (createdItem) {
                    setRecentList((prev) => [createdItem, ...prev]);
                }
                showGeneratedResult({ ...newDocData, ...(createdItem || {}), rawUrl: generatedUrl } as GeneratedResultItem, generatedUrl);
            }
            generationSucceeded = true;
        }
        catch (error) {
            const subscriptionRequired = error instanceof Error && error.message === "SUBSCRIPTION_REQUIRED";
            if (subscriptionRequired) {
                // The subscription dialog already explains the required next step.
                // Do not render the guard response as a red application error.
                setErrorMessage(null);
            } else {
                console.error("Generation error:", error);
                setErrorMessage(error instanceof Error
                    ? error.message
                    : "Could not generate the photo. Please try again.");
            }
        }
        finally {
            if (generationSucceeded) {
                // The photo is saved (it appears in My Files): tell the user where to find it.
                notifyMyFilesSaved();
                // Custom instructions are one-shot: the completed generation has
                // already used/saved its snapshot, so do not carry the text forward.
                setEditingGuides((prev) => prev.filter((entry) => !entry.startsWith("Custom Instruction:")));
                setCustomInstructionClearToken((prev) => prev + 1);
            }
            generationInFlightRef.current = false;
            setIsGenerating(false);
        }
    };
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const handleDeleteImage = (imageToDelete: any) => {
        if (!imageToDelete)
            return;
        setDeleteTarget(imageToDelete);
    };
    const performDeleteImage = async (imageToDelete: any) => {
        if (!imageToDelete)
            return;
        setDeleteTarget(null);
        setPreviewModalImage(null);
        setIsDeleting(true);
        setErrorMessage(null);
        try {
            if (!imageToDelete.id) {
                throw new Error("This generated photo does not have a valid ID.");
            }
            const deleteRes = await fetch(`/api/ai-generations?id=${encodeURIComponent(String(imageToDelete.id))}`, {
                method: "DELETE",
                headers: {
                    ...getAuthHeaders(),
                },
                credentials: "include",
            });
            const deleteResult = await deleteRes.json().catch(() => null);
            if (!deleteRes.ok || !deleteResult?.success) {
                throw new Error(deleteResult?.error || "Failed to delete the generated photo.");
            }
            setRecentList((prevList) => prevList.filter((item) => item.id !== imageToDelete.id && item.url !== imageToDelete.url));
            setResultItem((current) => current && (current.id === imageToDelete.id || current.url === imageToDelete.url) ? null : current);
            setPrintSession(null);
        }
        catch (error) {
            console.error("Error deleting image:", error);
            setErrorMessage(error instanceof Error
                ? error.message
                : "Failed to delete the image. Please try again.");
        }
        finally {
            setIsDeleting(false);
        }
    };
    // Delete several generated photos at once (used by the bulk "ছবি মুছুন" action and the per-photo trash icon).
    const performDeleteMany = async (items: any[]) => {
        const targets = items.filter((item) => item && item.id);
        if (!targets.length)
            return;
        setIsDeleting(true);
        setErrorMessage(null);
        const deletedIds = new Set<string>();
        let failed = 0;
        try {
            await Promise.all(targets.map(async (item) => {
                try {
                    const res = await fetch(`/api/ai-generations?id=${encodeURIComponent(String(item.id))}`, {
                        method: "DELETE",
                        headers: { ...getAuthHeaders() },
                        credentials: "include",
                    });
                    const result = await res.json().catch(() => null);
                    if (!res.ok || !result?.success)
                        throw new Error(result?.error || "Failed to delete");
                    deletedIds.add(String(item.id));
                }
                catch (error) {
                    console.error("Error deleting image:", error);
                    failed += 1;
                }
            }));
            if (deletedIds.size) {
                setRecentList((prevList) => prevList.filter((item) => !deletedIds.has(String(item.id))));
                setResultItem((current) => current && deletedIds.has(String(current.id)) ? null : current);
                setPrintSession(null);
            }
            if (failed)
                setErrorMessage(`${failed}টি ছবি মুছতে পারা যায়নি। আবার চেষ্টা করুন।`);
        }
        finally {
            setIsDeleting(false);
        }
    };
    const closeSetupWizard = (dontShowAgain: boolean) => {
        setShowSetupWizard(false);
        if (dontShowAgain) {
            setWizardDisabled(true);
            try {
                window.localStorage.setItem(WIZARD_DISABLED_KEY, "1");
            }
            catch {
                /* ignore blocked storage */
            }
        }
    };
    const applySetupWizard = (result: WizardResult, options: { generate: boolean }) => {
        setShowSetupWizard(false);
        setErrorMessage(null);
        if (result.size === "Dual") {
            // Dual needs two photos: switch to the normal dual screen and let the user add the second photo.
            enableDualMode();
            return;
        }
        if (isDualMode) {
            exitDualMode(result.size);
        }
        else {
            setSelectedSize(result.size);
        }
        setShowVisaPopup(false);
        setShowColorPicker(false);
        if (result.size === "Visa" && result.visaSize) {
            setSelectedVisaSize(result.visaSize);
        }
        setSelectedBg(result.bg);
        if (/^#[0-9A-F]{6}$/i.test(result.customBg)) {
            setCustomBgColor(result.customBg.toUpperCase());
        }
        setSelectedClothing(result.clothing);
        setSelectedClothingColor(result.clothingColor);
        // Keep any custom instruction the user already typed; the wizard only manages preset guides.
        const mergedGuides = [
            ...result.guides,
            ...editingGuides.filter((g) => g.startsWith("Custom Instruction:")),
        ];
        setEditingGuides(mergedGuides);
        setApplyGuidesSignal({ id: Date.now(), guides: mergedGuides });
        if (options.generate) {
            setAutoGenerateToken((n) => n + 1);
        }
    };
    // Start generating only after React has committed all of the wizard's choices.
    useEffect(() => {
        if (!autoGenerateToken)
            return;
        const timer = window.setTimeout(() => generatePhotoRef.current(), 250);
        return () => window.clearTimeout(timer);
    }, [autoGenerateToken]);
    const handleResetSettings = () => {
        setResultItem(null);
        setPrintSession(null);
        setSelectedSize("");
        setSelectedVisaSize("35×45 mm");
        setSelectedBg(-1);
        setCustomBgColor("#8B1E1E");
        setSelectedClothing(-1);
        setSelectedClothingColor("#EF4444");
        setLeftClothing(2);
        setRightClothing(2);
        setLeftClothingColor("#EF4444");
        setRightClothingColor("#EF4444");
        setEditingGuides([]);
        setLeftImage(null);
        setRightImage(null);
        setOriginalImageForDual(null);
        setOriginalLeftImage(null);
        setOriginalRightImage(null);
        setIsDualPreviewActive(false);
        setDualResultImage(null);
        setShowVisaPopup(false);
        setShowColorPicker(false);
        setIsDualMode(false);
    };
    // Live preview of the edit dropdown, only while the shown photo is the generated result.
    const liveResultFilter = resultItem && !isGenerating && !isNeutralFilters(resultFilters) && !!resultPreviewUrl && (resultPreviewUrl === uploadedImage || resultPreviewUrl === dualResultImage)
        ? filterString(resultFilters)
        : undefined;
    const resultInfo = resultItem && !isGenerating && resultPreviewUrl && (resultPreviewUrl === uploadedImage || resultPreviewUrl === dualResultImage)
        ? (() => {
            const styleMatch = /^Style (\d+)$/.exec(resultItem.clothingStyle || "");
            return {
                size: resultItem.size || "35×45 mm",
                bgColor: resultItem.bgColor || "#FFFFFF",
                clothing: styleMatch ? (CLOTHING_NAMES[Number(styleMatch[1])] || "Default Clothing") : (resultItem.clothingStyle || "Default Clothing"),
            };
        })()
        : null;
    const handleEditingGuidesChange = (guides: string[]) => {
        setEditingGuides(guides);
    };
    useEffect(() => {
        return () => {
            if (tempImageForCrop?.startsWith("blob:"))
                URL.revokeObjectURL(tempImageForCrop);
        };
    }, [tempImageForCrop]);
    const handleBulkPrint = async (items: any[]) => {
        try {
            const sources: Array<{ image: string; sourceKey?: string; preset: { id?: string; label?: string; widthMm: number; heightMm: number } }> = [];
            for (const item of items) {
                const payload = await buildPrintStudioPayload(item);
                sources.push({ image: payload.dataUrl, sourceKey: String(item.url), preset: payload.preset });
            }
            setPrintSession(null);
            setSavedSnapshot(null);
            setActiveSavedId(null);
            setBulkPrintSources(sources);
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Could not prepare selected photos for printing.");
            throw error;
        }
    };

    const refreshSavedSessions = useCallback(async () => {
        try {
            setSavedSessions(await listPrintSessions());
        }
        catch {
            setSavedSessions([]);
        }
    }, []);
    useEffect(() => {
        void refreshSavedSessions();
    }, [refreshSavedSessions]);
    const handleSavePrintSession = async (snapshot: PrintSessionSnapshot) => {
        const id = await savePrintSession(snapshot, activeSavedId);
        setActiveSavedId(id);
        await refreshSavedSessions();
    };
    const handleOpenSavedSession = async (id: string) => {
        try {
            const snapshot = await getPrintSession(id);
            if (!snapshot || !snapshot.items.length) {
                setErrorMessage("এই সংরক্ষিত প্রিন্টটি খুঁজে পাওয়া যায়নি।");
                await refreshSavedSessions();
                return;
            }
            const distinct = new Map<string, { image: string; sourceKey?: string; preset: { id?: string; label?: string; widthMm: number; heightMm: number } }>();
            for (const item of snapshot.items) {
                if (!distinct.has(item.image)) {
                    distinct.set(item.image, { image: item.image, sourceKey: item.sourceKey, preset: { id: "saved-photo", label: item.label, widthMm: item.widthMm, heightMm: item.heightMm } });
                }
            }
            setPrintSession(null);
            setSavedSnapshot(snapshot);
            setActiveSavedId(id);
            setBulkPrintSources(Array.from(distinct.values()));
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "সংরক্ষিত প্রিন্ট খোলা যায়নি।");
        }
    };
    const handleDeleteSavedSession = async (id: string) => {
        try {
            await deletePrintSession(id);
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "সংরক্ষিত প্রিন্ট মোছা যায়নি।");
        }
        await refreshSavedSessions();
    };
    const recentPrintImages = useMemo(() => recentList
        .filter((entry) => entry && typeof entry.url === "string" && entry.url)
        .map((entry) => ({ key: String(entry.url), url: String(entry.url) })), [recentList]);
    const resolveRecentForPrint = async (key: string) => {
        const entry = recentList.find((candidate) => candidate && String(candidate.url) === key);
        if (!entry)
            throw new Error("ছবিটি খুঁজে পাওয়া যায়নি।");
        const payload = await buildPrintStudioPayload(entry);
        return { image: payload.dataUrl, preset: payload.preset };
    };

    // Not ready yet: draw nothing but the plain site background; the page loader handles the wait.
    if (!firstLoadDone) {
        return (<div aria-busy="true" className="min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE]"/>);
    }
    const openSetupWizardFromButton = () => {
        if (uploadedImage) {
            setShowSetupWizard(true);
            return;
        }
        // No photo yet: pick one first, the guide opens right after cropping.
        wizardAfterUploadRef.current = true;
        triggerUpload("single");
    };
    const closeCropModal = () => {
        if (isCropping)
            return;
        wizardAfterUploadRef.current = false;
        if (tempImageForCrop?.startsWith("blob:"))
            URL.revokeObjectURL(tempImageForCrop);
        setTempImageForCrop(null);
        setShowCropModal(false);
    };
    generatePhotoRef.current = handleGeneratePhoto;
    return (<div className="min-h-screen xl:h-[100dvh] xl:min-h-0 xl:overflow-hidden bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] flex flex-col relative select-none ai-editor-font">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .ai-editor-font.ai-editor-font, .ai-editor-font.ai-editor-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans","Hind Siliguri","Noto Sans Bengali",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .ai-editor-font h1, .ai-editor-font h2, .ai-editor-font h3, .ai-editor-font h4 { letter-spacing: -0.01em; }
      `}</style>
      <DashboardNavbar />
      <SubscriptionLock />

      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden"/>

      {errorMessage && (<div className="fixed left-1/2 top-20 z-[1100] -translate-x-1/2 max-w-[min(92vw,720px)] rounded-xl border border-red-200 bg-[#FBF6E8] px-4 py-3 text-base font-medium text-red-700 shadow-xl">
          <AiT>{errorMessage}</AiT>
        </div>)}

      {showSlowNotice && isGenerating && !errorMessage && (<div role="status" className="fixed left-1/2 top-20 z-[1100] -translate-x-1/2 max-w-[min(92vw,720px)] rounded-xl border border-amber-300 bg-[#FBF6E8] px-4 py-3 text-base font-medium text-amber-800 shadow-xl">
          <AiT>Heavy demand right now, so your photo is taking a little longer. Please wait and do not close this page.</AiT>
        </div>)}

      {showCropModal && (<div className="fixed inset-0 z-[999] flex flex-col overflow-hidden bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] ai-editor-font">
          <style>{`
        .sebalagbe-crop-canvas .ReactCrop__crop-selection {
          border: 2px solid #ffffff !important;
          box-shadow: 0 0 0 9999em rgba(59, 47, 30, 0.58), 0 0 0 1px rgba(220, 38, 38, 0.55) !important;
          cursor: move;
          touch-action: none;
        }
        .sebalagbe-crop-canvas .ReactCrop__drag-handle {
          display: block !important;
          opacity: 1 !important;
          width: 18px !important;
          height: 18px !important;
          border: 2px solid #ffffff !important;
          border-radius: 5px !important;
          background: #DC2626 !important;
          box-shadow: 0 2px 8px rgba(59, 47, 30, 0.45) !important;
          touch-action: none;
        }
        .sebalagbe-crop-canvas .ReactCrop__rule-of-thirds-vt::before,
        .sebalagbe-crop-canvas .ReactCrop__rule-of-thirds-hz::before {
          background-color: rgba(255, 255, 255, 0.45) !important;
        }
        /* Fixed aspect crops use custom side handles below so vertical/horizontal
           midpoint drags resize along the pointer axis instead of silently failing. */
        .sebalagbe-crop-canvas .ReactCrop__drag-handle.ord-n,
        .sebalagbe-crop-canvas .ReactCrop__drag-handle.ord-e,
        .sebalagbe-crop-canvas .ReactCrop__drag-handle.ord-s,
        .sebalagbe-crop-canvas .ReactCrop__drag-handle.ord-w {
          display: none !important;
        }
        .sebalagbe-crop-canvas .ReactCrop__child-wrapper,
        .sebalagbe-crop-canvas .ReactCrop__child-wrapper img {
          user-select: none;
          -webkit-user-select: none;
          -webkit-user-drag: none;
        }
        .sebalagbe-zoom-range { accent-color: #DC2626; }
      `}</style>
          {isCropping && (<div className="absolute inset-0 z-50 bg-[#3B2F1E]/55 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-10 py-7 shadow-2xl">
                <Loader2 className="w-9 h-9 animate-spin text-[#DC2626]"/>
                <p className="text-base font-semibold text-[#3B2F1E]"><AiT>{"Saving..."}</AiT></p>
              </div>
            </div>)}

          {/* Header */}
          <div className="shrink-0 border-b border-[#E3D6B8] bg-[#FBF6E8] shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D42020] text-white shadow">
                  <CropIcon size={19}/>
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold leading-tight text-[#3B2F1E] sm:text-lg"><AiT>{"Crop & Rotate Image"}</AiT></h2>
                  <p className="truncate text-[12px] leading-tight text-stone-500 sm:text-[13px]">
                    <AiT>{selectedSize
                ? "Adjust the crop area to frame the subject for your selected photo size."
                : "Adjust the crop freely. No fixed photo size is selected."}</AiT>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden items-center gap-1.5 rounded-full border border-[#E3D6B8] bg-[#F3E9D2] px-3 py-1.5 text-xs font-bold text-[#3B2F1E] sm:flex">
                  <Ruler size={13} className="text-[#DC2626]"/>
                  {selectedSize ? `${t(selectedSize)} · ${getCurrentSizeLabel()}` : "ফ্রি ক্রপ"}
                </span>
                <button onClick={closeCropModal} disabled={isCropping} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E3D6B8] bg-[#F3E9D2] text-[#5A4A32] transition hover:border-[#D42020] hover:bg-[#D42020] hover:text-white cursor-pointer disabled:opacity-50">
                  <X size={18}/>
                </button>
              </div>
            </div>
          </div>

          {/* Crop stage */}
          <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
            <div className="flex h-full w-full max-w-[1100px] items-center justify-center overflow-auto rounded-2xl border border-[#E3D6B8] bg-[#F3E9D2]/70 p-3 shadow-inner sm:p-5">
              <CropStage crop={crop} aspect={isDualMode ? 45 / 55 : getSelectedTargetAspect()} imgRef={imgRef} src={tempImageForCrop || undefined} alt={t("Crop Preview")} zoom={zoom} rotate={rotate} onImageLoad={handleCropImageLoad} onCommit={setCompletedCrop}/>
            </div>
          </div>

          {/* Toolbar */}
          <div className="shrink-0 border-t border-[#E3D6B8] bg-[#FBF6E8] px-3 py-3 shadow-[0_-4px_16px_rgba(59,47,30,0.06)] sm:px-6">
            <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-[#E3D6B8] bg-[#F3E9D2] p-1">
                  <button onClick={() => setZoom((prev) => Math.max(prev - 10, 100))} disabled={isCropping || zoom <= 100} aria-label="Zoom out" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#3B2F1E] transition hover:bg-[#FBF6E8] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    <Minus size={16}/>
                  </button>
                  <input type="range" min={100} max={300} step={10} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} disabled={isCropping} aria-label="Zoom" className="sebalagbe-zoom-range hidden w-28 cursor-pointer sm:block"/>
                  <span className="w-12 text-center text-sm font-bold tabular-nums text-[#3B2F1E]">{zoom}%</span>
                  <button onClick={() => setZoom((prev) => Math.min(prev + 10, 300))} disabled={isCropping || zoom >= 300} aria-label="Zoom in" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#3B2F1E] transition hover:bg-[#FBF6E8] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus size={16}/>
                  </button>
                </div>
                <button onClick={() => setRotate((prev) => (prev + 90) % 360)} disabled={isCropping} className="flex h-11 items-center gap-2 rounded-xl border border-[#E3D6B8] bg-[#F3E9D2] px-4 text-sm font-semibold text-[#3B2F1E] transition hover:border-[#DC2626] hover:text-[#DC2626] cursor-pointer disabled:opacity-50">
                  <RotateCw size={15}/><AiT>{"Rotate"}</AiT>
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={closeCropModal} disabled={isCropping} className="h-11 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-5 text-sm font-semibold text-[#5A4A32] transition hover:bg-[#F3E9D2] cursor-pointer disabled:opacity-50">
                  <AiT>{"Cancel"}</AiT>
                </button>
                <button onClick={() => handleConfirmCrop(imgRef.current)} disabled={isCropping} className="flex h-11 items-center gap-2 rounded-xl bg-[#D42020] px-7 text-sm font-bold text-white shadow-lg transition hover:bg-[#AE1717] cursor-pointer disabled:opacity-60">
                  {isCropping ? (<>
                      <Loader2 size={16} className="animate-spin"/><AiT>{"Saving..."}</AiT></>) : (<>
                      <Check size={16}/><AiT>{"Crop"}</AiT></>)}
                </button>
              </div>
            </div>
          </div>
        </div>)}

      <AiPrintStudioModal open={!!printSession || !!bulkPrintSources?.length} image={bulkPrintSources?.[0]?.image ?? printSession?.image ?? null} preset={bulkPrintSources?.[0]?.preset ?? printSession?.preset ?? null} images={bulkPrintSources ?? undefined} recentImages={recentPrintImages} onResolveRecent={resolveRecentForPrint} onSaveSession={handleSavePrintSession} initialSnapshot={savedSnapshot} onClose={() => { setPrintSession(null); setBulkPrintSources(null); setSavedSnapshot(null); setActiveSavedId(null); }} onPrintSingle={!bulkPrintSources && resultItem ? async () => {
        try {
            await printSinglePhoto(await applyFiltersToExportable({ ...resultItem, url: typeof resultItem.rawUrl === "string" && resultItem.rawUrl ? resultItem.rawUrl : resultItem.url }, isNeutralFilters(resultFilters) ? null : filterString(resultFilters)));
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Could not print this image.");
        }
    } : undefined}/>

      <ImagePreviewModal image={previewModalImage} onClose={() => { setPreviewModalImage(null); setPreviewStartWithEdit(false); }} onDelete={handleDeleteImage} onRegenerate={handleRegenerateFromModal} onSaveImage={handleSaveEditedImage} startWithEdit={previewStartWithEdit}/>

      <div className="flex-1 flex flex-col items-center p-2 sm:p-4 xl:min-h-0 xl:overflow-hidden xl:px-4 xl:py-3">
        <div className="flex flex-col xl:flex-row w-full max-w-[1400px] xl:max-w-none gap-4 items-center xl:items-stretch xl:flex-1 xl:min-h-0">
          <div className="w-full xl:w-auto flex flex-col [&>*]:flex-1 xl:min-h-0 xl:[&>*]:min-h-0">
            <GenerationSettings photoSizes={photoSizes} selectedSize={selectedSize} handleSizeClick={handleSizeClick} showVisaPopup={showVisaPopup} setShowVisaPopup={setShowVisaPopup} visaSizesList={visaSizesList} selectedVisaSize={selectedVisaSize} setSelectedVisaSize={setSelectedVisaSize} setSelectedSize={setSelectedSize} isDualMode={isDualMode} exitDualMode={exitDualMode} backgroundColors={backgroundColors} selectedBg={selectedBg} setSelectedBg={setSelectedBg} setShowColorPicker={setShowColorPicker} showColorPicker={showColorPicker} customBgColor={customBgColor} setCustomBgColor={setCustomBgColor} selectedClothing={selectedClothing} setSelectedClothing={handleClothingSelectionChange} selectedClothingColor={selectedClothingColor} setSelectedClothingColor={setSelectedClothingColor} onEditingGuidesChange={handleEditingGuidesChange} clearCustomInstructionSignal={customInstructionClearToken} applyGuidesSignal={applyGuidesSignal} onResetSettings={handleResetSettings} leftClothing={leftClothing} setLeftClothing={setLeftClothing} rightClothing={rightClothing} setRightClothing={setRightClothing} leftClothingColor={leftClothingColor} setLeftClothingColor={setLeftClothingColor} rightClothingColor={rightClothingColor} setRightClothingColor={setRightClothingColor} colorPickerRef={colorPickerRef} visaPopupRef={visaPopupRef} onGenerate={handleGeneratePhoto} onOpenSetupWizard={isDualMode ? undefined : openSetupWizardFromButton} isGenerating={isGenerating}/>
          </div>

          <div className="w-full xl:flex-1 flex flex-col [&>*]:flex-1 xl:min-h-0 xl:[&>*]:min-h-0">
            <div className="flex flex-col xl:flex-row gap-3 xl:min-h-0">
              {/* Photo preview (kept mounted, hidden while the print section is open) */}
              <div className="flex flex-col flex-1 min-w-0 xl:min-h-0 [&>*]:flex-1 xl:[&>*]:min-h-0">
                <PhotoPreviewArea onDropFile={handleDropFile} isDualMode={isDualMode} uploadedImage={uploadedImage} setUploadedImage={setUploadedImage} leftImage={leftImage} setLeftImage={setLeftImage} rightImage={rightImage} setRightImage={setRightImage} triggerUpload={triggerUpload} enableDualMode={enableDualMode} exitDualMode={exitDualMode} activeBoxInfo={getCurrentBoxDimensions()} currentBgColorValue={getSelectedBgColorValue()} isGenerating={isGenerating} isDeleting={isDeleting} originalImageForDual={originalImageForDual} setOriginalImageForDual={setOriginalImageForDual} isDualPreviewActive={isDualPreviewActive} setIsDualPreviewActive={setIsDualPreviewActive} dualResultImage={dualResultImage} setDualResultImage={setDualResultImage} resultFilter={liveResultFilter} resultInfo={resultInfo}/>
              </div>
              {/* Options appear right beside the generated photo */}
              {resultItem && !printSession && !bulkPrintSources && (<div className="flex justify-center xl:block xl:shrink-0">
                  <GeneratedResultPanel item={resultItem} onClose={() => setResultItem(null)} filters={resultFilters} onFiltersChange={setResultFilters} autoOpenToken={resultEditToken} onDelete={handleDeleteImage} onPrint={(session) => { setBulkPrintSources(null); setPrintSession(session); }}/>
                </div>)}
            </div>
          </div>

          <div className="w-full xl:w-auto flex flex-col [&>*]:flex-1 xl:min-h-0 xl:[&>*]:min-h-0">
            <QrCodeSidebar
              uploadUrl={typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : ""}
              onPhotoReceived={handleQrPhotoReceived}
            />
          </div>
        </div>

                <RecentGenerations generations={recentList} onImageClick={(img) => { setPreviewStartWithEdit(false); setPreviewModalImage(img); }} onBulkPrint={handleBulkPrint} isLoading={isFetching} savedSessions={savedSessions} onOpenSaved={handleOpenSavedSession} onDeleteSaved={handleDeleteSavedSession} onDeleteMany={performDeleteMany}/>
      </div>
      <PhotoSetupWizard open={showSetupWizard} image={uploadedImage} initial={{
        size: isDualMode ? "" : selectedSize,
        visaSize: selectedVisaSize,
        bg: selectedBg,
        customBg: customBgColor,
        clothing: selectedClothing,
        clothingColor: selectedClothingColor,
        guides: editingGuides.filter((g) => !g.startsWith("Custom Instruction:")),
    }} photoSizes={photoSizes} visaSizesList={visaSizesList} backgroundColors={backgroundColors} onApply={applySetupWizard} onClose={closeSetupWizard}/>
      <ConfirmDeleteModal open={!!deleteTarget} imageUrl={deleteTarget?.url} onCancel={() => setDeleteTarget(null)} onConfirm={() => performDeleteImage(deleteTarget)}/>
      </div>);
}
