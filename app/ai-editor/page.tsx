"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import GenerationSettings from "./_components/GenerationSettings";
import PhotoPreviewArea from "./_components/PhotoPreviewArea";
import QrCodeSidebar from "./_components/QrCodeSidebar";
import RecentGenerations from "./_components/RecentGenerations";
import ImagePreviewModal from "./_components/ImagePreviewModal";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, Image as ImageIcon, RotateCw, Loader2 } from "lucide-react";

export default function PhotoEditorPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);

  const [selectedSize, setSelectedSize] = useState("Passport");
  const [selectedBg, setSelectedBg] = useState(1);
  const [customBgColor, setCustomBgColor] = useState("#8B1E1E");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [selectedClothing, setSelectedClothing] = useState(-1);
  const [leftClothing, setLeftClothing] = useState(2);
  const [rightClothing, setRightClothing] = useState(2);
  const [selectedClothingColor, setSelectedClothingColor] = useState("#EF4444");
  const [editingGuides, setEditingGuides] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isDualMode, setIsDualMode] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [leftImage, setLeftImage] = useState<string | null>(null);
  const [rightImage, setRightImage] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);

  const [originalImageForDual, setOriginalImageForDual] = useState<
    string | null
  >(null);
  const [isDualPreviewActive, setIsDualPreviewActive] = useState(false);

  const [recentList, setRecentList] = useState<any[]>([]);
  const [previewModalImage, setPreviewModalImage] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const fetchUserGenerationsFromMongo = async () => {
    setIsFetching(true);
    try {
      const response = await fetch("/api/ai-generations?source=ai-editor", {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
        },
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error(result?.error || "Failed to load recent generations.");
      }

      setRecentList(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Error fetching AI generations from MongoDB:", error);
      setRecentList([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const hasTokenCookie = document.cookie
      .split("; ")
      .some((row) => row.startsWith("token="));
    const hasLocalToken = Boolean(localStorage.getItem("token"));
    const savedUserStr =
      localStorage.getItem("user") || localStorage.getItem("userData");

    if (!hasTokenCookie && !hasLocalToken && !savedUserStr) {
      router.replace("/login");
      return;
    }

    setAuthChecking(false);
    void fetchUserGenerationsFromMongo();
  }, [router]);

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

    const inchMatch = normalized.match(
      /(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*inch/i,
    );

    if (inchMatch) {
      return {
        width: Number(inchMatch[1]),
        height: Number(inchMatch[2]),
        unit: "in",
      };
    }

    const mmMatch = normalized.match(
      /(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm/i,
    );

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

    const widthPx =
      physical.unit === "in"
        ? Math.max(1, Math.round(physical.width * EXPORT_DPI))
        : Math.max(1, Math.round((physical.width / 25.4) * EXPORT_DPI));

    const heightPx =
      physical.unit === "in"
        ? Math.max(1, Math.round(physical.height * EXPORT_DPI))
        : Math.max(1, Math.round((physical.height / 25.4) * EXPORT_DPI));

    return {
      ...physical,
      widthPx,
      heightPx,
      dpi: EXPORT_DPI,
    };
  };

  const normalizeImageToExactPhysicalSize = async (
    imageSrc: string,
    sizeLabel: string,
    transparentBackground = false,
  ): Promise<{
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
      image.onerror = () =>
        reject(new Error("Could not load image for final size export."));
    });

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      throw new Error("Source image has invalid dimensions.");
    }

    const scale = Math.min(
      target.widthPx / sourceWidth,
      target.heightPx / sourceHeight,
    );

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
    } else {
      context.fillStyle = getSelectedBgColorValue();
      context.fillRect(0, 0, target.widthPx, target.heightPx);
    }

    context.drawImage(
      image,
      0,
      0,
      sourceWidth,
      sourceHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    );

    return {
      dataUrl: transparentBackground
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", 0.95),
      widthPx: target.widthPx,
      heightPx: target.heightPx,
      dpi: target.dpi,
    };
  };

  const backgroundColors = [
    {
      type: "preset",
      className: "bg-white border border-gray-200",
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

    if (
      selectedOption?.type === "custom" &&
      /^#[0-9A-F]{6}$/i.test(customBgColor)
    ) {
      return customBgColor.toUpperCase();
    }

    return selectedOption?.value || "#FFFFFF";
  };

  const isTransparentBackground = () =>
    backgroundColors[selectedBg]?.type === "transparent";

  const getCurrentSizeLabel = () => {
    if (selectedSize === "Visa") return selectedVisaSize;
    const found = photoSizes.find((p) => p.id === selectedSize);
    return found ? found.dims : "35×45 mm";
  };

  const getSelectedTargetAspect = (): number => {
    let sizeLabel = getCurrentSizeLabel();
    if (sizeLabel.includes("inch")) {
      return 1.0;
    }
    const match = sizeLabel.match(/(\d+)×(\d+)/);
    if (match) {
      const w = parseFloat(match[1]);
      const h = parseFloat(match[2]);
      return w / h;
    }
    return 35 / 45;
  };

  const getStyleFromAspect = (aspectStr: string) => {
    const [rawWidth, rawHeight] = aspectStr.split("/").map(Number);

    const ratio =
      Number.isFinite(rawWidth) && Number.isFinite(rawHeight) && rawHeight > 0
        ? rawWidth / rawHeight
        : 35 / 45;

    const maxWidth = 290;
    const maxHeight = 405;

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
      if (
        visaPopupRef.current &&
        !visaPopupRef.current.contains(event.target as Node)
      )
        setShowVisaPopup(false);
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      )
        setShowColorPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(() => setErrorMessage(null), 7000);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage(
        "Image is too large. Please choose an image under 12 MB.",
      );
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

  const uploadToCloudinary = async (imageData: string) => {
    if (!imageData) return null;
    if (/^https?:\/\//i.test(imageData)) return imageData;

    try {
      let uploadBody: BodyInit;
      let headers: HeadersInit | undefined;

      if (imageData.startsWith("blob:")) {
        const blobResponse = await fetch(imageData);
        if (!blobResponse.ok) {
          throw new Error("Could not read the temporary image.");
        }

        const blob = await blobResponse.blob();
        const file = new File(
          [blob],
          `sohozkaj-upload-${Date.now()}.${blob.type.includes("png") ? "png" : "jpg"}`,
          { type: blob.type || "image/jpeg" },
        );

        const formData = new FormData();
        formData.append("file", file);

        uploadBody = formData;
      } else {
        headers = { "Content-Type": "application/json" };
        uploadBody = JSON.stringify({ image: imageData });
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: uploadBody,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.url) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Image upload failed (${res.status}).`,
        );
      }

      return data.url as string;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Image upload failed.",
      );
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
        if (!sourceCtx) throw new Error("Could not create crop canvas.");

        sourceCtx.drawImage(
          imageEl,
          sourceX,
          sourceY,
          cropWidth,
          cropHeight,
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
        );

        if (rotate % 360 !== 0) {
          const rotatedCanvas = document.createElement("canvas");
          const quarterTurns = ((rotate % 360) + 360) % 360;
          const swap = quarterTurns === 90 || quarterTurns === 270;
          rotatedCanvas.width = swap ? sourceCanvas.height : sourceCanvas.width;
          rotatedCanvas.height = swap
            ? sourceCanvas.width
            : sourceCanvas.height;
          const rotatedCtx = rotatedCanvas.getContext("2d");
          if (!rotatedCtx) throw new Error("Could not create rotation canvas.");

          rotatedCtx.translate(
            rotatedCanvas.width / 2,
            rotatedCanvas.height / 2,
          );
          rotatedCtx.rotate((rotate * Math.PI) / 180);
          rotatedCtx.drawImage(
            sourceCanvas,
            -sourceCanvas.width / 2,
            -sourceCanvas.height / 2,
          );
          croppedImageUrl = rotatedCanvas.toDataURL("image/jpeg", 0.95);
        } else {
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
          reader.onload = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () =>
            reject(
              new Error("Could not convert the cropped image for preview."),
            );
          reader.readAsDataURL(blob);
        });

        if (!finalImageUrl) {
          throw new Error("Could not preserve the cropped image preview.");
        }
      }

      setOriginalImageForDual(finalImageUrl);
      setIsDualPreviewActive(false);

      if (activeTarget === "left") setLeftImage(finalImageUrl);
      else if (activeTarget === "right") setRightImage(finalImageUrl);
      else setUploadedImage(finalImageUrl);

      if (tempImageForCrop.startsWith("blob:")) {
        URL.revokeObjectURL(tempImageForCrop);
      }

      setShowCropModal(false);
      setTempImageForCrop(null);
    } catch (error) {
      console.error("Crop & Upload error:", error);
      setErrorMessage(
        "Could not process this image. Please try another image.",
      );
    } finally {
      setIsCropping(false);
    }
  };

  const triggerUpload = (target: string | null) => {
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
    }
  };

  const exitDualMode = (nextSize = "Passport") => {
    setIsDualMode(false);
    setSelectedSize(nextSize);
    setLeftImage(null);
    setRightImage(null);
    setActiveTarget(null);
    setIsDualPreviewActive(false);
  };

  const handleSizeClick = (sizeId: string) => {
    if (sizeId === "Visa") {
      setShowVisaPopup((prev) => !prev);
      return;
    }

    setShowVisaPopup(false);
    if (sizeId === "Dual") {
      enableDualMode();
      return;
    }

    if (isDualMode) {
      exitDualMode(sizeId);
      return;
    }

    setSelectedSize(sizeId);
  };

  const handleRegenerateFromModal = (imageItem: any) => {
    const realPhoto = imageItem.originalUrl || imageItem.url;
    setOriginalImageForDual(realPhoto);
    setUploadedImage(realPhoto);
    setIsDualPreviewActive(false);
    setRegeneratingId(imageItem.id);
    setPreviewModalImage(null);
  };

  const handleSaveEditedImage = async (
    updatedId: string,
    newImageUrl: string,
  ) => {
    if (!updatedId) return;

    try {
      let finalUrl = newImageUrl;
      if (newImageUrl.startsWith("data:")) {
        const uploaded = await uploadToCloudinary(newImageUrl);
        if (!uploaded) {
          throw new Error("Edited image upload failed. Please try again.");
        }
        finalUrl = uploaded;
      }

      const response = await fetch(
        `/api/ai-generations?id=${encodeURIComponent(updatedId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
          body: JSON.stringify({ url: finalUrl }),
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to save the edited image.");
      }

      const savedItem = result.data;

      setRecentList((prev) =>
        prev.map((item) =>
          item.id === updatedId
            ? { ...item, ...(savedItem || {}), url: finalUrl }
            : item,
        ),
      );

      setPreviewModalImage((prev: any) =>
        prev && prev.id === updatedId
          ? { ...prev, ...(savedItem || {}), url: finalUrl }
          : prev,
      );
    } catch (error) {
      console.error("Error updating edited image in MongoDB:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save the edited image.",
      );
      throw error;
    }
  };

  // =========================================================
  // LOCAL BACKEND URL CONFIGURATION
  // =========================================================
  // এটি সরাসরি লোকাল ব্যাকএন্ড পোর্টে পয়েন্ট করছে।
  // আপনার main.py যে পোর্টে চলবে (যেমন 8000), এখানে সেটি দেওয়া রয়েছে।
  const LOCAL_PYTHON_API_URL = "http://127.0.0.1:8000";

  const dataUrlToFile = async (
    dataUrl: string,
    filename: string,
  ): Promise<File> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return new File([blob], filename, {
      type: blob.type || "image/jpeg",
    });
  };

  const applyBackgroundColorToImage = async (
    imageBlob: Blob,
    backgroundColor: string,
  ): Promise<string> => {
    const objectUrl = URL.createObjectURL(imageBlob);

    try {
      const image = new Image();
      image.decoding = "async";
      image.src = objectUrl;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Could not load processed photo."));
      });

      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      if (!width || !height) {
        throw new Error("Processed photo has invalid dimensions.");
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create final image canvas.");
      }

      if (backgroundColor === "transparent") {
        context.clearRect(0, 0, width, height);
      } else {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, width, height);
      }

      context.drawImage(image, 0, 0, width, height);

      return backgroundColor === "transparent"
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", 0.95);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  // -----------------------------------------------------
  // LOCAL BACKEND ONLY GENERATION FLOW
  // -----------------------------------------------------
  const callGenerateApi = async (payload: Record<string, unknown>) => {
    const image = typeof payload.image === "string" ? payload.image : "";

    const bgColor =
      typeof payload.bgColor === "string"
        ? payload.bgColor
        : getSelectedBgColorValue();

    if (!image) {
      throw new Error("No source image was provided.");
    }

    const formData = new FormData();
    formData.append("file", await dataUrlToFile(image, "person.jpg"));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 120000);

    let response: Response;

    try {
      // শুধুমাত্র লোকাল ব্যাকএন্ডে রিকোয়েস্ট পাঠানো হচ্ছে
      response = await fetch(`${LOCAL_PYTHON_API_URL}/api/remove-background`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Background removal timed out. Please try again.");
      }
      // লোকাল সার্ভার বন্ধ থাকলে সরাসরি এই এরর দেখাবে, রেন্ডারে কোনোভাবেই যাবে না
      throw new Error(
        "Local backend server is not running or unreachable. Please start python backend at http://127.0.0.1:8000",
      );
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(
        message ||
          `Background removal failed on local server (${response.status}).`,
      );
    }

    const processedBlob = await response.blob();

    if (
      processedBlob.size === 0 ||
      (processedBlob.type && !processedBlob.type.startsWith("image/"))
    ) {
      throw new Error("Background removal returned an invalid image response.");
    }

    const transparentBackground =
      payload.transparentBackground === true || bgColor === "transparent";

    const backgroundAppliedDataUrl = await applyBackgroundColorToImage(
      processedBlob,
      transparentBackground ? "transparent" : bgColor,
    );

    const normalized = await normalizeImageToExactPhysicalSize(
      backgroundAppliedDataUrl,
      typeof payload.size === "string" ? payload.size : getCurrentSizeLabel(),
      transparentBackground,
    );

    const cloudUrl = await uploadToCloudinary(normalized.dataUrl);

    if (!cloudUrl) {
      throw new Error(
        "Generated photo could not be uploaded to Cloudinary, so it was not saved. Please try again.",
      );
    }

    return cloudUrl;
  };

  const handleGeneratePhoto = async () => {
    setErrorMessage(null);

    if (isDualMode) {
      if (!leftImage || !rightImage) {
        setErrorMessage("Dual mode needs both left and right photos.");
        return;
      }
    } else if (!uploadedImage) {
      setErrorMessage("Upload a photo before generating.");
      return;
    }

    setIsGenerating(true);

    try {
      const currentSizeLabel = getCurrentSizeLabel();
      const currentBgHex = getSelectedBgColorValue();
      const transparentBackground = isTransparentBackground();
      const exactExport = getExactExportDimensions(currentSizeLabel);

      const basePayload = {
        size: currentSizeLabel,
        sizeType: selectedSize,
        bgColor: currentBgHex,
        transparentBackground,
        clothing: selectedClothing,
        clothingColor: selectedClothingColor,
        editingGuides,
        widthPx: exactExport.widthPx,
        heightPx: exactExport.heightPx,
        dpi: exactExport.dpi,
      };

      if (isDualMode) {
        const [leftGenerated, rightGenerated] = await Promise.all([
          callGenerateApi({
            ...basePayload,
            image: leftImage!,
            side: "left",
            clothing: leftClothing,
          }),
          callGenerateApi({
            ...basePayload,
            image: rightImage!,
            side: "right",
            clothing: rightClothing,
          }),
        ]);

        setLeftImage(leftGenerated);
        setRightImage(rightGenerated);
        setOriginalImageForDual(leftImage);

        const docs = [
          {
            url: leftGenerated,
            originalUrl: leftImage,
            size: currentSizeLabel,
            sizeType: selectedSize,
            widthPx: exactExport.widthPx,
            heightPx: exactExport.heightPx,
            dpi: exactExport.dpi,
            bgColor: currentBgHex,
            clothingStyle: `Style ${leftClothing}`,
            clothingColor: selectedClothingColor,
            editingGuides,
            side: "left",
            source: "ai-editor",
          },
          {
            url: rightGenerated,
            originalUrl: rightImage,
            size: currentSizeLabel,
            sizeType: selectedSize,
            widthPx: exactExport.widthPx,
            heightPx: exactExport.heightPx,
            dpi: exactExport.dpi,
            bgColor: currentBgHex,
            clothingStyle: `Style ${rightClothing}`,
            clothingColor: selectedClothingColor,
            editingGuides,
            side: "right",
            source: "ai-editor",
          },
        ];

        const response = await fetch("/api/ai-generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
          body: JSON.stringify(docs),
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Failed to save generated photos.");
        }

        const createdItems = Array.isArray(result.data) ? result.data : [];
        setRecentList((prev) => [...createdItems, ...prev]);
        return;
      }

      const rawImage = uploadedImage!;

      const generatedUrl = await callGenerateApi({
        ...basePayload,
        image: rawImage,
      });

      const finalOriginal = originalImageForDual || rawImage;
      setOriginalImageForDual(finalOriginal);
      setUploadedImage(generatedUrl);
      setIsDualPreviewActive(false);

      const newDocData = {
        url: generatedUrl,
        originalUrl: finalOriginal,
        size: currentSizeLabel,
        sizeType: selectedSize,
        widthPx: exactExport.widthPx,
        heightPx: exactExport.heightPx,
        dpi: exactExport.dpi,
        bgColor: currentBgHex,
        clothingStyle: `Style ${selectedClothing}`,
        clothingColor: selectedClothingColor,
        editingGuides,
        side: "single",
        source: "ai-editor",
      };

      if (regeneratingId) {
        const response = await fetch(
          `/api/ai-generations?id=${encodeURIComponent(regeneratingId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            credentials: "include",
            body: JSON.stringify(newDocData),
          },
        );

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || "Failed to update the generated photo.",
          );
        }

        const updatedItem = result.data || {
          id: regeneratingId,
          ...newDocData,
        };

        setRecentList((prev) =>
          prev.map((item) =>
            item.id === regeneratingId ? { ...item, ...updatedItem } : item,
          ),
        );
      } else {
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
      }
    } catch (error) {
      console.error("Generation error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not generate the photo. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteImage = async (imageToDelete: any) => {
    if (!imageToDelete) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this photo?",
    );
    if (!confirmDelete) return;

    setPreviewModalImage(null);
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      if (!imageToDelete.id) {
        throw new Error("This generated photo does not have a valid ID.");
      }

      const deleteRes = await fetch(
        `/api/ai-generations?id=${encodeURIComponent(String(imageToDelete.id))}`,
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
          },
          credentials: "include",
        },
      );

      const deleteResult = await deleteRes.json().catch(() => null);
      if (!deleteRes.ok || !deleteResult?.success) {
        throw new Error(
          deleteResult?.error || "Failed to delete the generated photo.",
        );
      }

      setRecentList((prevList) =>
        prevList.filter(
          (item) =>
            item.id !== imageToDelete.id && item.url !== imageToDelete.url,
        ),
      );
    } catch (error) {
      console.error("Error deleting image:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete the image. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetSettings = () => {
    setSelectedSize("Passport");
    setSelectedVisaSize("35×45 mm");
    setSelectedBg(1);
    setCustomBgColor("#8B1E1E");
    setSelectedClothing(-1);
    setSelectedClothingColor("#EF4444");
    setLeftClothing(2);
    setRightClothing(2);
    setEditingGuides([]);
    setLeftImage(null);
    setRightImage(null);
    setOriginalImageForDual(null);
    setIsDualPreviewActive(false);
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

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#f3efe6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3efe6] flex flex-col relative select-none">
      <DashboardNavbar />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {errorMessage && (
        <div className="fixed left-1/2 top-20 z-[1100] -translate-x-1/2 max-w-[min(92vw,720px)] rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-xl">
          {errorMessage}
        </div>
      )}

      {showCropModal && (
        <div className="fixed inset-0 z-[999] bg-[#0c1017] flex flex-col justify-between overflow-hidden">
          {isCropping && (
            <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#00A859]" />
              <p className="text-sm font-medium tracking-wide">Saving...</p>
            </div>
          )}

          <div className="h-14 bg-white flex items-center justify-between pl-6 pr-0 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <span className="bg-orange-500 text-white p-1 rounded-lg">
                <ImageIcon size={16} />
              </span>
              <h2 className="text-sm font-semibold text-gray-800">
                Crop & Rotate Image
              </h2>
            </div>
            <button
              onClick={() => {
                if (isCropping) return;
                if (tempImageForCrop?.startsWith("blob:"))
                  URL.revokeObjectURL(tempImageForCrop);
                setTempImageForCrop(null);
                setShowCropModal(false);
              }}
              className="h-14 w-16 bg-[#E81123] text-white flex items-center justify-center cursor-pointer hover:bg-red-700 transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="bg-[#151c28] text-gray-300 text-xs py-2 text-center border-b border-gray-800 shrink-0 px-2">
            For passport size photos, center your face in the crop area — this
            gives the best result.
          </div>

          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto relative bg-[#0c1017]">
            <div className="w-full h-full flex items-center justify-center">
              <ReactCrop
                crop={crop}
                aspect={isDualMode ? 45 / 55 : getSelectedTargetAspect()}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-[70vh]"
              >
                <img
                  ref={imgRef}
                  src={tempImageForCrop || undefined}
                  alt="Crop Preview"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotate}deg)`,
                    transition: "transform 0.2s ease-in-out",
                  }}
                  className="max-h-[70vh] object-contain select-none"
                />
              </ReactCrop>
            </div>
          </div>

          <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-between pl-4 sm:pl-6 pr-0 shrink-0 shadow-lg">
            <div className="flex items-center gap-1">
              <div className="flex items-center rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={() => setZoom((prev) => Math.max(prev - 10, 100))}
                  disabled={isCropping}
                  className="bg-[#00A859] text-white px-3 py-2 text-sm font-bold cursor-pointer hover:bg-green-700 transition disabled:opacity-50"
                >
                  -
                </button>
                <div className="bg-white text-gray-900 font-semibold text-xs px-3 py-2">
                  {zoom}%
                </div>
                <button
                  onClick={() => setZoom((prev) => Math.min(prev + 10, 300))}
                  disabled={isCropping}
                  className="bg-[#00A859] text-white px-3 py-2 text-sm font-bold cursor-pointer hover:bg-green-700 transition disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => setRotate((prev) => (prev + 90) % 360)}
                disabled={isCropping}
                className="ml-2 bg-[#00A859] text-white px-3 py-2 rounded-lg text-xs flex items-center gap-1 cursor-pointer hover:bg-green-700 transition disabled:opacity-50"
              >
                <RotateCw size={14} /> Rotate
              </button>
            </div>

            <div className="flex items-center gap-3 h-full">
              <button
                onClick={() => {
                  if (isCropping) return;
                  if (tempImageForCrop?.startsWith("blob:"))
                    URL.revokeObjectURL(tempImageForCrop);
                  setTempImageForCrop(null);
                  setShowCropModal(false);
                }}
                disabled={isCropping}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs cursor-pointer hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmCrop(imgRef.current)}
                disabled={isCropping}
                className="h-16 bg-[#00A859] text-white px-6 text-xs flex items-center gap-2 cursor-pointer hover:bg-green-700 transition font-semibold disabled:opacity-50"
              >
                {isCropping ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Crop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImagePreviewModal
        image={previewModalImage}
        onClose={() => setPreviewModalImage(null)}
        onDelete={handleDeleteImage}
        onRegenerate={handleRegenerateFromModal}
        onSaveImage={handleSaveEditedImage}
      />

      <div className="flex-1 flex flex-col items-center p-2 sm:p-4">
        <div className="flex flex-col xl:flex-row w-full max-w-[1400px] gap-4 items-center xl:items-stretch">
          <div className="w-full xl:w-auto flex flex-col [&>*]:flex-1">
            <GenerationSettings
              photoSizes={photoSizes}
              selectedSize={selectedSize}
              handleSizeClick={handleSizeClick}
              showVisaPopup={showVisaPopup}
              setShowVisaPopup={setShowVisaPopup}
              visaSizesList={visaSizesList}
              selectedVisaSize={selectedVisaSize}
              setSelectedVisaSize={setSelectedVisaSize}
              setSelectedSize={setSelectedSize}
              isDualMode={isDualMode}
              exitDualMode={exitDualMode}
              backgroundColors={backgroundColors}
              selectedBg={selectedBg}
              setSelectedBg={setSelectedBg}
              setShowColorPicker={setShowColorPicker}
              showColorPicker={showColorPicker}
              customBgColor={customBgColor}
              setCustomBgColor={setCustomBgColor}
              selectedClothing={selectedClothing}
              setSelectedClothing={setSelectedClothing}
              selectedClothingColor={selectedClothingColor}
              setSelectedClothingColor={setSelectedClothingColor}
              onEditingGuidesChange={handleEditingGuidesChange}
              onResetSettings={handleResetSettings}
              leftClothing={leftClothing}
              setLeftClothing={setLeftClothing}
              rightClothing={rightClothing}
              setRightClothing={setRightClothing}
              colorPickerRef={colorPickerRef}
              visaPopupRef={visaPopupRef}
              onGenerate={handleGeneratePhoto}
              isGenerating={isGenerating}
            />
          </div>

          <div className="w-full xl:flex-1 flex flex-col [&>*]:flex-1">
            <PhotoPreviewArea
              isDualMode={isDualMode}
              uploadedImage={uploadedImage}
              setUploadedImage={setUploadedImage}
              leftImage={leftImage}
              setLeftImage={setLeftImage}
              rightImage={rightImage}
              setRightImage={setRightImage}
              triggerUpload={triggerUpload}
              enableDualMode={enableDualMode}
              exitDualMode={exitDualMode}
              activeBoxInfo={getCurrentBoxDimensions()}
              currentBgColorValue={getSelectedBgColorValue()}
              isGenerating={isGenerating}
              isDeleting={isDeleting}
              originalImageForDual={originalImageForDual}
              setOriginalImageForDual={setOriginalImageForDual}
              isDualPreviewActive={isDualPreviewActive}
              setIsDualPreviewActive={setIsDualPreviewActive}
            />
          </div>

          <div className="w-full xl:w-auto flex flex-col [&>*]:flex-1">
            <QrCodeSidebar
              uploadUrl={
                typeof window !== "undefined"
                  ? `${window.location.origin}${window.location.pathname}`
                  : ""
              }
            />
          </div>
        </div>

        <RecentGenerations
          generations={recentList}
          onImageClick={(img) => setPreviewModalImage(img)}
          isLoading={isFetching}
        />
      </div>
    </div>
  );
}
