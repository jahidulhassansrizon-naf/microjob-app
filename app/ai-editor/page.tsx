"use client";
import { AiT, useAiEditorText } from "./_components/aiEditorI18n";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import SubscriptionLock from "./_components/SubscriptionLock";
import GenerationSettings from "./_components/GenerationSettings";
import { planEditingGuides } from "./_components/editingGuides";
import PhotoPreviewArea from "./_components/PhotoPreviewArea";
import QrCodeSidebar from "./_components/QrCodeSidebar";
import RecentGenerations from "./_components/RecentGenerations";
import ImagePreviewModal from "./_components/ImagePreviewModal";
import GeneratedResultPanel, { GeneratedResultItem, PrintSession } from "./_components/GeneratedResultPanel";
import AiPrintStudioModal from "./_components/AiPrintStudioModal";
import { buildPrintStudioPayload, printSinglePhoto } from "./_components/photoExport";
import { deletePrintSession, getPrintSession, listPrintSessions, savePrintSession, type PrintSessionMeta, type PrintSessionSnapshot } from "./_components/printSessionStore";
import { centerCrop, makeAspectCrop } from "react-image-crop";
import CropStage from "./_components/CropStage";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, Image as ImageIcon, RotateCw, Loader2 } from "lucide-react";
import { getClientSession } from "@/lib/clientAuth";
import { CLOTHING_NAMES, CLOTHING_STYLES } from "./_components/clothingStyles";
import ConfirmDeleteModal from "./_components/ConfirmDeleteModal";
import { AiEditorFetchError, getCachedAiEditorGenerations, refreshAiEditorGenerations, setCachedAiEditorGenerations } from "./_components/aiEditorData";
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
    const EXPORT_DPI = 300;
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
        const widthPx = physical.unit === "in"
            ? Math.max(1, Math.round(physical.width * EXPORT_DPI))
            : Math.max(1, Math.round((physical.width / 25.4) * EXPORT_DPI));
        const heightPx = physical.unit === "in"
            ? Math.max(1, Math.round(physical.height * EXPORT_DPI))
            : Math.max(1, Math.round((physical.height / 25.4) * EXPORT_DPI));
        return {
            ...physical,
            widthPx,
            heightPx,
            dpi: EXPORT_DPI,
        };
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
        // Keep only the serialized image data; release the large canvas bitmap now.
        const dataUrl = transparentBackground
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", 0.95);
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
                    croppedImageUrl = rotatedCanvas.toDataURL("image/jpeg", 0.95);
                }
                else {
                    croppedImageUrl = sourceCanvas.toDataURL("image/jpeg", 0.95);
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
                ? { ...prev, ...(savedItem || {}), url: finalUrl }
                : prev);
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
            "IDENTITY LOCK (highest priority, above every other instruction): Each person's face must remain exactly the same real person. Keep the exact face shape, jaw, cheeks, forehead, eyebrows, eyes and eye shape, nose, lips, teeth, ears, skin tone and skin texture, moles, scars, marks, facial hair, hairline and hairstyle, and apparent age. Do NOT beautify, slim, smooth, whiten, enlarge, sharpen, age, or re-draw any face. Do NOT average, blend, or swap features between the two people. Do NOT create a generic or idealized face. If you must choose between a nicer-looking result and an identical face, choose the identical face. Both faces must be clearly recognizable as the people in their own photos.",
            "POSE AND CAMERA: classic passport-studio pose for BOTH people. Sitting upright with straight backs, shoulders square to the camera and level, necks long and relaxed, heads perfectly straight with no tilt, turn, or lean, chin level, eyes open and looking directly into the lens, natural neutral expression with the mouth closed (a very slight natural smile at most). If a person's original photo is tilted, turned, or leaning, re-pose only the head and body to face the camera straight while keeping the face identical. The camera is at eye level, shot with a long portrait lens (about 85mm equivalent), no wide-angle distortion.",
            "FRAMING: Person A is centered in the left half and Person B is centered in the right half, sitting close together so their shoulders almost touch (a very slight overlap of shoulders is fine) with no faces overlapping or hidden. Both people are at exactly the same scale, with their eyes on the same horizontal line and the tops of their heads at the same height, with a small even headroom above. Show each person from the top of the head down to the upper chest. Both are fully inside the frame with nothing cut off.",
            backgroundRule,
            "LIGHTING: soft, even, frontal studio lighting on both faces, identical color temperature and exposure for both people, no harsh shadows on faces, no shadow cast on the backdrop, no color cast. Natural skin tones, sharp focus, realistic DSLR photo quality.",
            `CLOTHING: Person A (left): ${describeClothing(payload.leftClothing, payload.leftClothingColor)}. Person B (right): ${describeClothing(payload.rightClothing, payload.rightClothingColor)}.`,
            "STRICTLY FORBIDDEN: extra people, text, letters, logos, watermarks, frames, borders, dividing lines, props, jewelry or accessories that are not in the original photos, changed hair or hijab/head covering, changed face, changed skin tone, cartoon or painted or AI-art look, and any stylization.",
            "BEFORE ANSWERING, silently verify: (1) exactly one image with both people in the same frame; (2) Person A is left and Person B is right; (3) both faces are identical to their own photos; (4) both sit upright facing the camera at the same size and height; (5) one uniform backdrop fills the whole canvas with no strip or seam; (6) clothing matches the instructions. Fix anything that fails before you answer.",
        ];
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

        const instructions = [
            flags.restoration
                ? hasSelectedPhotoSize
                    ? "Restore the provided photograph, keeping its original composition, and make the result suitable for a professional ID/passport-style photo."
                    : "Restore the provided photograph, keeping its original composition and aspect ratio."
                : hasSelectedPhotoSize
                    ? "Edit the provided portrait photo for a professional ID/passport-style result."
                    : "Edit the provided image naturally, preserving its original composition and aspect ratio unless the requested edits require a change.",
            flags.colorChange || flags.restoration
                ? "Preserve the person's facial identity, facial proportions, hair, and natural features as faithfully as possible. Keep skin tones natural and believable for the person; only the color adjustments requested below may change the overall tint."
                : "Preserve the person's facial identity, facial proportions, skin tone, hair, and natural features as faithfully as possible.",
            flags.restoration
                ? "Do not add extra people, duplicate facial features, text, logos, frames, borders, or watermarks. Keep every person who is already in the photo."
                : "Do not add extra people, duplicate facial features, text, logos, frames, borders, or watermarks.",
            hasSelectedPhotoSize && !(flags.restoration && !flags.posePreset)
                ? "Keep the person centered and facing the camera unless the requested edit explicitly changes the head angle."
                : "Preserve the original framing, subject placement, pose, and camera angle unless the requested edit explicitly requires a change.",
            "Make only the requested edits and avoid unnecessary changes to the person's face.",
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
            instructions.push(`Change only the visible clothing to ${clothingPrompt}, professionally styled, in ${colorName}. Keep the face, hair, ears, neck, body proportions, and pose natural. Make the clothing edges realistic and properly fitted to the body.`);
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
            : canvas.toDataURL("image/jpeg", 0.95);
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
        const timeoutId = window.setTimeout(() => controller.abort(), 180000);

        try {
            prompt = buildAiEditingPrompt(payload);
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

            const response = await fetch("/api/image-generate", {
                method: "POST",
                body: formData,
                signal: controller.signal,
                cache: "no-store",
            });
            result = await response.json().catch(() => null);
            if (!response.ok || !result?.success || typeof result.image !== "string") {
                if (response.status === 403 && result?.code === "SUBSCRIPTION_REQUIRED") {
                    window.dispatchEvent(new Event("sohozkaj:subscription-required"));
                    throw new Error("SUBSCRIPTION_REQUIRED");
                }
                const message = result?.error || `AI image editing failed (${response.status}).`;
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
                throw new Error("AI image editing timed out. Please try again with a smaller photo.");
            }
            throw error;
        }
        finally {
            window.clearTimeout(timeoutId);
            controller.abort();
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
                const dualDocData = {
                    url: combinedUrl,
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
                    setResultItem({ ...dualDocData, ...updatedItem } as GeneratedResultItem);
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
                    setResultItem({ ...dualDocData, ...(createdItem || {}) } as GeneratedResultItem);
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
            const newDocData = {
                url: generatedUrl,
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
                setResultItem({ ...newDocData, ...updatedItem } as GeneratedResultItem);
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
                setResultItem({ ...newDocData, ...(createdItem || {}) } as GeneratedResultItem);
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

      {showCropModal && (<div className="fixed inset-0 z-[999] bg-[#0c1017] flex flex-col justify-between overflow-hidden">
          <style>{`
        .sebalagbe-crop-canvas .ReactCrop__crop-selection {
          border: 2px solid #ffffff !important;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.18) !important;
          cursor: move;
          touch-action: none;
        }
        .sebalagbe-crop-canvas .ReactCrop__drag-handle {
          display: block !important;
          opacity: 1 !important;
          width: 16px !important;
          height: 16px !important;
          border: 2px solid #ffffff !important;
          border-radius: 3px !important;
          background: #2563eb !important;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.45), 0 2px 7px rgba(0, 0, 0, 0.25) !important;
          touch-action: none;
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
      `}</style>
          {isCropping && (<div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#059669]"/>
              <p className="text-base font-medium tracking-wide"><AiT>{"Saving..."}</AiT></p>
            </div>)}

          <div className="h-14 bg-[#FBF6E8] flex items-center justify-between pl-6 pr-0 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <span className="bg-[#D42020] text-white p-1 rounded-lg">
                <ImageIcon size={16}/>
              </span>
              <h2 className="text-base font-semibold text-[#3B2F1E]"><AiT>{"Crop & Rotate Image\n              "}</AiT></h2>
            </div>
            <button onClick={() => {
                if (isCropping)
                    return;
                if (tempImageForCrop?.startsWith("blob:"))
                    URL.revokeObjectURL(tempImageForCrop);
                setTempImageForCrop(null);
                setShowCropModal(false);
            }} className="h-14 w-16 bg-[#D42020] text-white flex items-center justify-center cursor-pointer hover:bg-[#AE1717] transition">
              <X size={18}/>
            </button>
          </div>

          <div className="bg-[#151c28] text-[#D8C9A6] text-sm py-2 text-center border-b border-[#5A4A32] shrink-0 px-2">
            <AiT>{selectedSize
                ? "Adjust the crop area to frame the subject for your selected photo size."
                : "Adjust the crop freely. No fixed photo size is selected."}</AiT>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto relative bg-[#0c1017]">
            <div className="w-full h-full flex items-center justify-center">
              <CropStage crop={crop} aspect={isDualMode ? 45 / 55 : getSelectedTargetAspect()} imgRef={imgRef} src={tempImageForCrop || undefined} alt={t("Crop Preview")} zoom={zoom} rotate={rotate} onImageLoad={handleCropImageLoad} onCommit={setCompletedCrop}/>
            </div>
          </div>

          <div className="h-16 bg-[#FBF6E8] border-t border-[#E3D6B8] flex items-center justify-between pl-4 sm:pl-6 pr-0 shrink-0 shadow-lg">
            <div className="flex items-center gap-1">
              <div className="flex items-center rounded-lg overflow-hidden shadow-sm">
                <button onClick={() => setZoom((prev) => Math.max(prev - 10, 100))} disabled={isCropping} className="bg-[#059669] text-white px-3 py-2 text-base font-bold cursor-pointer hover:bg-[#047857] transition disabled:opacity-50"><AiT>{"-\n                "}</AiT></button>
                <div className="bg-[#FBF6E8] text-[#3B2F1E] font-semibold text-sm px-3 py-2">
                  {zoom}<AiT>{"%\n                "}</AiT></div>
                <button onClick={() => setZoom((prev) => Math.min(prev + 10, 300))} disabled={isCropping} className="bg-[#059669] text-white px-3 py-2 text-base font-bold cursor-pointer hover:bg-[#047857] transition disabled:opacity-50"><AiT>{"+\n                "}</AiT></button>
              </div>
              <button onClick={() => setRotate((prev) => (prev + 90) % 360)} disabled={isCropping} className="ml-2 bg-[#059669] text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 cursor-pointer hover:bg-[#047857] transition disabled:opacity-50">
                <RotateCw size={14}/><AiT>{"Rotate\n              "}</AiT></button>
            </div>

            <div className="flex items-center gap-3 h-full">
              <button onClick={() => {
                if (isCropping)
                    return;
                if (tempImageForCrop?.startsWith("blob:"))
                    URL.revokeObjectURL(tempImageForCrop);
                setTempImageForCrop(null);
                setShowCropModal(false);
            }} disabled={isCropping} className="bg-[#F3E9D2] text-[#5A4A32] px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-[#E3D6B8] transition disabled:opacity-50"><AiT>{"Cancel\n              "}</AiT></button>
              <button onClick={() => handleConfirmCrop(imgRef.current)} disabled={isCropping} className="h-16 bg-[#059669] text-white px-6 text-sm flex items-center gap-2 cursor-pointer hover:bg-[#047857] transition font-semibold disabled:opacity-50">
                {isCropping ? (<>
                    <Loader2 size={16} className="animate-spin"/><AiT>{"Saving...\n                  "}</AiT></>) : (<>
                    <Check size={16}/><AiT>{"Crop\n                  "}</AiT></>)}
              </button>
            </div>
          </div>
        </div>)}

      <AiPrintStudioModal open={!!printSession || !!bulkPrintSources?.length} image={bulkPrintSources?.[0]?.image ?? printSession?.image ?? null} preset={bulkPrintSources?.[0]?.preset ?? printSession?.preset ?? null} images={bulkPrintSources ?? undefined} recentImages={recentPrintImages} onResolveRecent={resolveRecentForPrint} onSaveSession={handleSavePrintSession} initialSnapshot={savedSnapshot} onClose={() => { setPrintSession(null); setBulkPrintSources(null); setSavedSnapshot(null); setActiveSavedId(null); }} onPrintSingle={!bulkPrintSources && resultItem ? async () => {
        try {
            await printSinglePhoto(resultItem);
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Could not print this image.");
        }
    } : undefined}/>

      <ImagePreviewModal image={previewModalImage} onClose={() => { setPreviewModalImage(null); setPreviewStartWithEdit(false); }} onDelete={handleDeleteImage} onRegenerate={handleRegenerateFromModal} onSaveImage={handleSaveEditedImage} startWithEdit={previewStartWithEdit}/>

      <div className="flex-1 flex flex-col items-center p-2 sm:p-4 xl:min-h-0 xl:overflow-hidden xl:px-4 xl:py-3">
        <div className="flex flex-col xl:flex-row w-full max-w-[1400px] xl:max-w-none gap-4 items-center xl:items-stretch xl:flex-1 xl:min-h-0">
          <div className="w-full xl:w-auto flex flex-col [&>*]:flex-1 xl:min-h-0 xl:[&>*]:min-h-0">
            <GenerationSettings photoSizes={photoSizes} selectedSize={selectedSize} handleSizeClick={handleSizeClick} showVisaPopup={showVisaPopup} setShowVisaPopup={setShowVisaPopup} visaSizesList={visaSizesList} selectedVisaSize={selectedVisaSize} setSelectedVisaSize={setSelectedVisaSize} setSelectedSize={setSelectedSize} isDualMode={isDualMode} exitDualMode={exitDualMode} backgroundColors={backgroundColors} selectedBg={selectedBg} setSelectedBg={setSelectedBg} setShowColorPicker={setShowColorPicker} showColorPicker={showColorPicker} customBgColor={customBgColor} setCustomBgColor={setCustomBgColor} selectedClothing={selectedClothing} setSelectedClothing={handleClothingSelectionChange} selectedClothingColor={selectedClothingColor} setSelectedClothingColor={setSelectedClothingColor} onEditingGuidesChange={handleEditingGuidesChange} clearCustomInstructionSignal={customInstructionClearToken} onResetSettings={handleResetSettings} leftClothing={leftClothing} setLeftClothing={setLeftClothing} rightClothing={rightClothing} setRightClothing={setRightClothing} leftClothingColor={leftClothingColor} setLeftClothingColor={setLeftClothingColor} rightClothingColor={rightClothingColor} setRightClothingColor={setRightClothingColor} colorPickerRef={colorPickerRef} visaPopupRef={visaPopupRef} onGenerate={handleGeneratePhoto} isGenerating={isGenerating}/>
          </div>

          <div className="w-full xl:flex-1 flex flex-col [&>*]:flex-1 xl:min-h-0 xl:[&>*]:min-h-0">
            <div className="flex flex-col xl:flex-row gap-3 xl:min-h-0">
              {/* Photo preview (kept mounted, hidden while the print section is open) */}
              <div className="flex flex-col flex-1 min-w-0 xl:min-h-0 [&>*]:flex-1 xl:[&>*]:min-h-0">
                <PhotoPreviewArea isDualMode={isDualMode} uploadedImage={uploadedImage} setUploadedImage={setUploadedImage} leftImage={leftImage} setLeftImage={setLeftImage} rightImage={rightImage} setRightImage={setRightImage} triggerUpload={triggerUpload} enableDualMode={enableDualMode} exitDualMode={exitDualMode} activeBoxInfo={getCurrentBoxDimensions()} currentBgColorValue={getSelectedBgColorValue()} isGenerating={isGenerating} isDeleting={isDeleting} originalImageForDual={originalImageForDual} setOriginalImageForDual={setOriginalImageForDual} isDualPreviewActive={isDualPreviewActive} setIsDualPreviewActive={setIsDualPreviewActive} dualResultImage={dualResultImage} setDualResultImage={setDualResultImage}/>
              </div>
              {/* Options appear right beside the generated photo */}
              {resultItem && !printSession && !bulkPrintSources && (<div className="flex justify-center xl:block xl:shrink-0">
                  <GeneratedResultPanel item={resultItem} onClose={() => setResultItem(null)} onEdit={(item) => { setPreviewStartWithEdit(true); setPreviewModalImage(item); }} onDelete={handleDeleteImage} onPrint={(session) => { setBulkPrintSources(null); setPrintSession(session); }}/>
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

                <RecentGenerations generations={recentList} onImageClick={(img) => { setPreviewStartWithEdit(false); setPreviewModalImage(img); }} onBulkPrint={handleBulkPrint} isLoading={isFetching} savedSessions={savedSessions} onOpenSaved={handleOpenSavedSession} onDeleteSaved={handleDeleteSavedSession}/>
      </div>
      <ConfirmDeleteModal open={!!deleteTarget} imageUrl={deleteTarget?.url} onCancel={() => setDeleteTarget(null)} onConfirm={() => performDeleteImage(deleteTarget)}/>
      </div>);
}
