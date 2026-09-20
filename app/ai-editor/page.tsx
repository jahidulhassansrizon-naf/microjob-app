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

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBP4aCuTWTrzmwEfSBrJO3v7Wwl9IKZiW8",
  authDomain: "sohozkaj-db.firebaseapp.com",
  projectId: "sohozkaj-db",
  storageBucket: "sohozkaj-db.firebasestorage.app",
  messagingSenderId: "664339778822",
  appId: "1:664339778822:web:e6cdf50a427fce962d2287",
  measurementId: "G-Y62R472CHB",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

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
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // Authentication Check
  useEffect(() => {
    const hasTokenCookie = document.cookie
      .split("; ")
      .some((row) => row.startsWith("token="));
    const savedUserStr =
      localStorage.getItem("user") || localStorage.getItem("userData");

    // যদি কুকিতে টোকেন এবং লোকালস্টোরেজে ইউজার কোনোটিই না থাকে, তবে /login এ রিডাইরেক্ট করবে
    if (!hasTokenCookie && !savedUserStr) {
      router.replace("/login");
      return;
    }

    if (savedUserStr) {
      try {
        const parsedUser = JSON.parse(savedUserStr);
        setCurrentUser(parsedUser);
        if (parsedUser?.id) {
          fetchUserGenerationsFromFirebase(parsedUser.id);
        } else {
          setIsFetching(false);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
        setIsFetching(false);
        router.replace("/login");
        return;
      }
    } else {
      setIsFetching(false);
    }
    setAuthChecking(false);
  }, [router]);

  const fetchUserGenerationsFromFirebase = async (userId: string) => {
    setIsFetching(true);
    try {
      const generationsRef = collection(db, "users", userId, "generations");
      const querySnapshot = await getDocs(generationsRef);

      const loadedList = querySnapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
        .sort((a: any, b: any) => {
          const toMs = (value: any) => {
            if (!value) return 0;
            if (typeof value?.toMillis === "function") return value.toMillis();
            if (value?.seconds) return value.seconds * 1000;
            const parsed = Date.parse(String(value));
            return Number.isNaN(parsed) ? 0 : parsed;
          };
          return toMs(b.createdAt) - toMs(a.createdAt);
        });

      setRecentList(loadedList);
    } catch (error) {
      console.error("Error fetching user generations from Firebase:", error);
    } finally {
      setIsFetching(false);
    }
  };

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

  // =========================================================
  // Production print sizing
  // =========================================================
  // All generated/downloaded photos are standardized at 300 DPI.
  // The selected physical dimensions are converted to deterministic
  // pixel dimensions so the output file is ready for real printing.
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

    // Dual Mode does not have one physical dimension in the UI.
    // Use the editor's primary portrait standard for the actual export.
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

    // IMPORTANT: Selecting a physical size must never crop the person's photo.
    // The whole source image is fitted inside the exact-size output canvas.
    // Extra space is left as background, and the photo is anchored to the
    // bottom of the target canvas to match the print-ready reference layout.
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

    context.fillStyle = getSelectedBgColorValue();
    context.fillRect(0, 0, target.widthPx, target.heightPx);

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
      dataUrl: canvas.toDataURL("image/jpeg", 0.95),
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
    { type: "custom", className: "", value: "" },
  ];

  const getSelectedBgColorValue = () => {
    if (selectedBg === 7 && /^#[0-9A-F]{6}$/i.test(customBgColor)) {
      return customBgColor.toUpperCase();
    }
    return backgroundColors[selectedBg]?.value || "#FFFFFF";
  };

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

  const cropImageToExactRatio = (
    imageSrc: string,
    targetAspect: number,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let cropWidth = img.width;
        let cropHeight = img.height;
        const currentAspect = img.width / img.height;

        if (currentAspect > targetAspect) {
          cropWidth = img.height * targetAspect;
        } else {
          cropHeight = img.width / targetAspect;
        }

        const startX = (img.width - cropWidth) / 2;
        const startY = (img.height - cropHeight) / 2;

        canvas.width = Math.round(cropWidth);
        canvas.height = Math.round(cropHeight);

        if (ctx) {
          ctx.drawImage(
            img,
            startX,
            startY,
            cropWidth,
            cropHeight,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = () => resolve(imageSrc);
    });
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

      // Convert blob: URLs to real image data before sending them to the
      // server. Sending a blob URL string directly cannot be decoded by the
      // Next.js upload route.
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
        // data:image/... URLs are handled by the JSON branch of /api/upload.
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

        // Apply the user's rotation to the final cropped result so Rotate is not cosmetic-only.
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

      // Always use a stable image URL in the preview state.
      // The old code stored the temporary blob URL in uploadedImage/leftImage/rightImage
      // and then immediately revoked that blob URL, which caused the browser to show a
      // broken-image icon after clicking Crop.
      const uploadedOriginalUrl = await uploadToCloudinary(croppedImageUrl);

      let finalImageUrl = uploadedOriginalUrl || croppedImageUrl;

      // If Cloudinary upload fails and croppedImageUrl is still a blob URL, convert it
      // to a data URL before revoking the temporary object URL. This guarantees that
      // the preview never points to a revoked blob URL.
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

      // Use the same stable URL for every preview target.
      if (activeTarget === "left") setLeftImage(finalImageUrl);
      else if (activeTarget === "right") setRightImage(finalImageUrl);
      else setUploadedImage(finalImageUrl);

      // Safe now: no preview state depends on the temporary blob URL.
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
    if (!currentUser?.id || !updatedId) return;

    try {
      let finalUrl = newImageUrl;
      if (newImageUrl.startsWith("data:")) {
        const uploaded = await uploadToCloudinary(newImageUrl);
        if (!uploaded)
          throw new Error("Edited image upload failed. Please try again.");
        finalUrl = uploaded;
      }

      const docRef = doc(db, "users", currentUser.id, "generations", updatedId);
      await setDoc(docRef, { url: finalUrl }, { merge: true });

      setRecentList((prev) =>
        prev.map((item) =>
          item.id === updatedId ? { ...item, url: finalUrl } : item,
        ),
      );

      setPreviewModalImage((prev: any) =>
        prev && prev.id === updatedId ? { ...prev, url: finalUrl } : prev,
      );
    } catch (error) {
      console.error("Error updating edited image in Firestore:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save the edited image.",
      );
      throw error;
    }
  };

  const PYTHON_API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_PYTHON_API_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  const GEMINI_UNAVAILABLE_MESSAGE =
    "Clothing Try-On is temporarily unavailable because our paid AI API quota has ended. Please wait—we will bring it back soon.";

  const isCloudinaryUrl = (value: unknown): value is string => {
    if (typeof value !== "string") return false;
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname === "res.cloudinary.com" &&
        url.pathname.includes("/image/upload/")
      );
    } catch {
      return false;
    }
  };

  const checkGeminiAvailability = async (): Promise<boolean> => {
    if (!PYTHON_API_BASE_URL) return false;

    try {
      const response = await fetch(`${PYTHON_API_BASE_URL}/api/gemini-status`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return false;

      const data = await response.json().catch(() => null);
      return data?.enabled === true;
    } catch {
      return false;
    }
  };

  const CLOTHING_RECOLOR_PALETTE: Record<number, string[]> = {
    0: [
      "#A0B7D8",
      "#6F86AE",
      "#EEEEEE",
      "#ADC2E6",
      "#F4F4F4",
      "#C5D4F3",
      "#F6F6F6",
      "#FBFBFB",
      "#A5BEEA",
      "#DDE8FB",
    ],
    1: ["#E53935"],
    2: [
      "#A0B7D8",
      "#6F86AE",
      "#171D2D",
      "#243056",
      "#ADC2E6",
      "#262D3F",
      "#161D33",
    ],
    3: [
      "#A0B7D8",
      "#6F86AE",
      "#171D2D",
      "#243056",
      "#ADC2E6",
      "#0D1426",
      "#161D33",
      "#272F49",
      "#B7CDED",
      "#9AB6D8",
      "#C7D8FF",
      "#97AED3",
      "#AABDE2",
      "#DEE9FF",
      "#C4D5F7",
    ],
    4: ["#6F0D0C", "#951C1E", "#1B0B0C"],
    5: [
      "#121212",
      "#8D0307",
      "#0F0F0E",
      "#8C0005",
      "#0A0B0A",
      "#A23034",
      "#A63B3E",
      "#8E050A",
      "#0A0A0A",
      "#A83D41",
      "#131311",
      "#080806",
      "#930F14",
      "#050505",
      "#050605",
      "#A12E32",
      "#040403",
      "#A43639",
      "#131211",
      "#070706",
    ],
    6: ["#EAEAEA", "#D6D6D6"],
    7: ["#6F0D0C", "#951C1E"],
    8: ["#243056", "#3B5BDB"],
    9: ["#AED3FF", "#91C2F2", "#1A5B87", "#3776AA", "#D4ECFF", "#2E81AF"],
    10: ["#444A51", "#383D44", "#1C222B", "#080C14", "#20252B", "#DAE1E5"],
    11: ["#B969FF", "#5C5CFF", "#CB83FF"],
    12: ["#3131DB", "#3B3BEA", "#5C5CFF", "#4E4EF9"],
    13: [
      "#A7A9AB",
      "#3776AA",
      "#2F3033",
      "#AED3FF",
      "#134B70",
      "#D8D8D8",
      "#6FA6DD",
    ],
  };

  const clampValue = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const hexToRgb = (hex: string) => {
    const clean = hex.replace("#", "").trim();
    const normalized =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;

    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (value: number) =>
      Math.round(clampValue(value, 0, 255))
        .toString(16)
        .padStart(2, "0");

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    if (delta !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
    }

    if (h < 0) h += 360;

    return { h, s, l };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    return {
      r: (r + m) * 255,
      g: (g + m) * 255,
      b: (b + m) * 255,
    };
  };

  const recolorSvg = (
    svg: string,
    clothingIndex: number,
    targetColor: string,
  ) => {
    const palette = CLOTHING_RECOLOR_PALETTE[clothingIndex] || [];

    if (!palette.length) return svg;

    const target = hexToRgb(targetColor);
    const targetHsl = rgbToHsl(target.r, target.g, target.b);

    let result = svg;

    for (const sourceColor of palette) {
      const source = hexToRgb(sourceColor);
      const sourceHsl = rgbToHsl(source.r, source.g, source.b);
      const saturation =
        targetHsl.s === 0 ? 0 : clampValue(targetHsl.s * 0.96, 0, 1);

      const replacement = rgbToHex(
        hslToRgb(targetHsl.h, saturation, clampValue(sourceHsl.l, 0.08, 0.97))
          .r,
        hslToRgb(targetHsl.h, saturation, clampValue(sourceHsl.l, 0.08, 0.97))
          .g,
        hslToRgb(targetHsl.h, saturation, clampValue(sourceHsl.l, 0.08, 0.97))
          .b,
      );

      const safeSource = sourceColor.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

      result = result.replace(new RegExp(safeSource, "gi"), replacement);
    }

    return result;
  };

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

  const renderClothingToPng = async (
    clothingIndex: number,
    clothingColor: string,
  ): Promise<File> => {
    const assetUrl = `/icons/clothing-${clothingIndex + 1}.svg`;

    const response = await fetch(assetUrl, {
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error(`Could not load clothing-${clothingIndex + 1}.svg`);
    }

    const originalSvg = await response.text();
    const coloredSvg = recolorSvg(originalSvg, clothingIndex, clothingColor);

    const svgBlob = new Blob([coloredSvg], {
      type: "image/svg+xml;charset=utf-8",
    });

    const objectUrl = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      image.decoding = "async";
      image.src = objectUrl;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(
            new Error(`Could not render clothing-${clothingIndex + 1}.svg`),
          );
      });

      const viewBoxMatch = coloredSvg.match(
        /viewBox=["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*["']/i,
      );

      const sourceWidth =
        viewBoxMatch && Number(viewBoxMatch[1]) > 0
          ? Number(viewBoxMatch[1])
          : image.naturalWidth || image.width || 800;

      const sourceHeight =
        viewBoxMatch && Number(viewBoxMatch[2]) > 0
          ? Number(viewBoxMatch[2])
          : image.naturalHeight || image.height || 800;

      const width = 800;
      const height = Math.max(
        1,
        Math.round(width * (sourceHeight / sourceWidth)),
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create clothing render canvas.");
      }

      context.clearRect(0, 0, width, height);

      context.drawImage(image, 0, 0, width, height);

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png", 1);
      });

      if (!pngBlob) {
        throw new Error("Could not convert clothing to PNG.");
      }

      return new File([pngBlob], `clothing-${clothingIndex + 1}.png`, {
        type: "image/png",
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
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

      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);

      context.drawImage(image, 0, 0, width, height);

      return canvas.toDataURL("image/jpeg", 0.95);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Could not read generated image."));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(new Error("Could not read generated image."));
      };
      reader.readAsDataURL(blob);
    });
  };

  const callGenerateApi = async (payload: Record<string, unknown>) => {
    const image = typeof payload.image === "string" ? payload.image : "";

    const bgColor =
      typeof payload.bgColor === "string"
        ? payload.bgColor
        : getSelectedBgColorValue();

    const clothingIndex = Number(payload.clothing ?? selectedClothing);

    if (!image) {
      throw new Error("No source image was provided.");
    }

    // No clothing selected: keep the existing local background-removal flow.
    if (
      !Number.isInteger(clothingIndex) ||
      clothingIndex < 0 ||
      clothingIndex > 13
    ) {
      const formData = new FormData();
      formData.append("file", await dataUrlToFile(image, "person.jpg"));

      const response = await fetch(
        `${PYTHON_API_BASE_URL}/api/remove-background`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(
          message || `Background removal failed (${response.status}).`,
        );
      }

      const processedBlob = await response.blob();
      const backgroundAppliedDataUrl = await applyBackgroundColorToImage(
        processedBlob,
        bgColor,
      );

      const normalized = await normalizeImageToExactPhysicalSize(
        backgroundAppliedDataUrl,
        typeof payload.size === "string" ? payload.size : getCurrentSizeLabel(),
      );

      const cloudUrl = await uploadToCloudinary(normalized.dataUrl);
      return cloudUrl || normalized.dataUrl;
    }

    // -----------------------------------------------------
    // REALISTIC GEMINI VIRTUAL TRY-ON
    // -----------------------------------------------------

    const personFile = await dataUrlToFile(image, "person.jpg");

    const clothingColor =
      typeof payload.clothingColor === "string"
        ? payload.clothingColor
        : selectedClothingColor;

    // The SVG is recolored first, then rendered as a PNG reference for Gemini.
    const clothingFile = await renderClothingToPng(
      clothingIndex,
      clothingColor,
    );

    const formData = new FormData();
    formData.append("person", personFile);
    formData.append("clothing", clothingFile);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      5 * 60 * 1000,
    );

    let response: Response;

    try {
      response = await fetch(`${PYTHON_API_BASE_URL}/api/gemini-tryon`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(
          "Gemini processing timed out after 5 minutes. Please try again.",
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const rawMessage = await response.text().catch(() => "");
      let message = rawMessage;

      try {
        const parsed = JSON.parse(rawMessage);
        message = parsed?.error || parsed?.message || rawMessage;
      } catch {
        // Plain-text backend error; keep it as-is.
      }

      const normalizedMessage = String(message || "").toLowerCase();
      const temporaryGeminiFailure =
        response.status === 401 ||
        response.status === 403 ||
        response.status === 429 ||
        response.status === 503 ||
        normalizedMessage.includes("api_key") ||
        normalizedMessage.includes("api key") ||
        normalizedMessage.includes("rate limit") ||
        normalizedMessage.includes("too many requests") ||
        normalizedMessage.includes("quota");

      throw new Error(
        temporaryGeminiFailure
          ? GEMINI_UNAVAILABLE_MESSAGE
          : message || `Gemini virtual try-on failed (${response.status}).`,
      );
    }

    const generatedBlob = await response.blob();

    if (
      generatedBlob.size === 0 ||
      (generatedBlob.type && !generatedBlob.type.startsWith("image/"))
    ) {
      throw new Error("Gemini returned an invalid or empty image response.");
    }

    const generatedDataUrl = await blobToDataUrl(generatedBlob);

    const normalized = await normalizeImageToExactPhysicalSize(
      generatedDataUrl,
      typeof payload.size === "string" ? payload.size : getCurrentSizeLabel(),
    );

    const cloudUrl = await uploadToCloudinary(normalized.dataUrl);

    return cloudUrl || normalized.dataUrl;
  };

  const handleGeneratePhoto = async () => {
    setErrorMessage(null);

    // Validate the source photos first so the user gets the correct message
    // before we check Gemini availability.
    if (isDualMode) {
      if (!leftImage || !rightImage) {
        setErrorMessage("Dual mode needs both left and right photos.");
        return;
      }
    } else if (!uploadedImage) {
      setErrorMessage("Upload a photo before generating.");
      return;
    }

    // No clothing selection always uses the normal local background-removal
    // pipeline. Gemini is never contacted in this case.
    const clothingSelected = isDualMode
      ? leftClothing >= 0 || rightClothing >= 0
      : selectedClothing >= 0;

    if (clothingSelected) {
      const geminiEnabled = await checkGeminiAvailability();
      if (!geminiEnabled) {
        setErrorMessage(GEMINI_UNAVAILABLE_MESSAGE);
        return;
      }
    }

    setIsGenerating(true);

    try {
      const currentSizeLabel = getCurrentSizeLabel();
      const currentBgHex = getSelectedBgColorValue();
      const exactExport = getExactExportDimensions(currentSizeLabel);

      const basePayload = {
        size: currentSizeLabel,
        sizeType: selectedSize,
        bgColor: currentBgHex,
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

        if (currentUser?.id) {
          const generationsRef = collection(
            db,
            "users",
            currentUser.id,
            "generations",
          );
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
              createdAt: serverTimestamp(),
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
              createdAt: serverTimestamp(),
            },
          ];

          const created = await Promise.all(
            docs.map((item) => addDoc(generationsRef, item)),
          );
          const now = new Date().toISOString();
          setRecentList((prev) => [
            ...created.map((docItem, index) => ({
              id: docItem.id,
              ...docs[index],
              createdAt: now,
            })),
            ...prev,
          ]);
        }
        return;
      }

      const rawImage = uploadedImage!;

      // Do NOT auto-crop the source just because the user selected a physical
      // photo size. Physical sizing is handled later by
      // normalizeImageToExactPhysicalSize(), which preserves the complete
      // source and anchors it to the bottom of the exact-size canvas.
      const generatedUrl = await callGenerateApi({
        ...basePayload,
        image: rawImage,
      });

      const finalOriginal = originalImageForDual || rawImage;
      setOriginalImageForDual(finalOriginal);
      setUploadedImage(generatedUrl);
      setIsDualPreviewActive(false);

      if (currentUser?.id) {
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
          createdAt: serverTimestamp(),
        };

        if (regeneratingId) {
          const docRef = doc(
            db,
            "users",
            currentUser.id,
            "generations",
            regeneratingId,
          );
          await setDoc(docRef, newDocData, { merge: true });

          setRecentList((prev) =>
            prev.map((item) =>
              item.id === regeneratingId
                ? {
                    ...item,
                    ...newDocData,
                    createdAt: new Date().toISOString(),
                  }
                : item,
            ),
          );
        } else {
          const generationsRef = collection(
            db,
            "users",
            currentUser.id,
            "generations",
          );
          const newDoc = await addDoc(generationsRef, newDocData);

          setRecentList((prev) => [
            {
              id: newDoc.id,
              ...newDocData,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
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
      // Only send actual Cloudinary assets to the Cloudinary delete route.
      // Data/blob/local preview URLs cannot be deleted from Cloudinary.
      if (isCloudinaryUrl(imageToDelete.url)) {
        const deleteRes = await fetch("/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: imageToDelete.url }),
        });

        if (!deleteRes.ok) {
          const data = await deleteRes.json().catch(() => null);
          throw new Error(
            data?.message || data?.error || "Cloud image deletion failed.",
          );
        }
      }

      if (currentUser?.id && imageToDelete.id) {
        const docRef = doc(
          db,
          "users",
          currentUser.id,
          "generations",
          imageToDelete.id,
        );
        await deleteDoc(docRef);
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
