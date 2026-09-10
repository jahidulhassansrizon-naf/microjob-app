"use client";

import React, { useState, useRef, useEffect } from "react";
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
  query,
  orderBy,
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
  const [selectedSize, setSelectedSize] = useState("Passport");
  const [selectedBg, setSelectedBg] = useState(1);
  const [customBgColor, setCustomBgColor] = useState("#8B1E1E");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [selectedClothing, setSelectedClothing] = useState(2);
  const [leftClothing, setLeftClothing] = useState(2);
  const [rightClothing, setRightClothing] = useState(2);

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

  useEffect(() => {
    const savedUserStr =
      localStorage.getItem("user") || localStorage.getItem("userData");
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
      }
    } else {
      setIsFetching(false);
    }
  }, []);

  const fetchUserGenerationsFromFirebase = async (userId: string) => {
    setIsFetching(true);
    try {
      const generationsRef = collection(db, "users", userId, "generations");
      const q = query(generationsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const loadedList = querySnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

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
    if (selectedBg === 7) return customBgColor;
    return backgroundColors[selectedBg]?.value || "#FFFFFF";
  };

  const getCurrentSizeLabel = () => {
    if (selectedSize === "Visa") return selectedVisaSize;
    const found = photoSizes.find((p) => p.id === selectedSize);
    return found ? found.dims : "35×45 mm";
  };

  // সিলেক্ট করা সাইজের একজ্যাক্ট Aspect Ratio বের করার লজিক
  const getSelectedTargetAspect = (): number => {
    let sizeLabel = getCurrentSizeLabel(); // e.g. "33×48 mm" or "2×2 inch"
    if (sizeLabel.includes("inch")) {
      return 1.0; // 2x2 inch = 1:1
    }
    const match = sizeLabel.match(/(\d+)×(\d+)/);
    if (match) {
      const w = parseFloat(match[1]);
      const h = parseFloat(match[2]);
      return w / h;
    }
    return 35 / 45;
  };

  // Canvas দিয়ে ছবিটিকে কেন্দ্র রেখে একজ্যাক্ট Aspect Ratio তে ক্রপ ও রি-সাইজ করার ফাংশন
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
    switch (aspectStr) {
      case "45/55":
        return { width: "290px", height: "354px" };
      case "25/30":
        return { width: "270px", height: "324px" };
      case "1/1":
        return { width: "320px", height: "320px" };
      case "40/60":
        return { width: "270px", height: "405px" };
      case "50/70":
        return { width: "280px", height: "392px" };
      case "33/48":
        return { width: "280px", height: "407px" };
      case "36/47":
        return { width: "290px", height: "378px" };
      case "38/48":
        return { width: "290px", height: "366px" };
      case "50/60":
        return { width: "300px", height: "360px" };
      case "40/50":
        return { width: "290px", height: "362px" };
      case "50/50":
        return { width: "310px", height: "310px" };
      case "35/50":
        return { width: "280px", height: "400px" };
      case "35/45":
      default:
        return { width: "290px", height: "372px" };
    }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempImageForCrop(imageUrl);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setZoom(100);
      setRotate(0);
      setShowCropModal(true);
      setRegeneratingId(null);
    }
    e.target.value = "";
  };

  const uploadToCloudinary = async (imageData: string) => {
    if (!imageData || imageData.startsWith("http")) return imageData;
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
    }
    return null;
  };

  const handleConfirmCrop = async (imageEl: HTMLImageElement | null) => {
    if (!tempImageForCrop) {
      setShowCropModal(false);
      return;
    }

    setIsCropping(true);

    try {
      let croppedImageUrl = tempImageForCrop;

      if (completedCrop && imageEl) {
        const canvas = document.createElement("canvas");
        const scaleX = imageEl.naturalWidth / imageEl.width;
        const scaleY = imageEl.naturalHeight / imageEl.height;

        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(
            imageEl,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }

        croppedImageUrl = canvas.toDataURL("image/jpeg");
      }

      const uploadedOriginalUrl = await uploadToCloudinary(croppedImageUrl);
      const finalOrig = uploadedOriginalUrl || croppedImageUrl;

      setOriginalImageForDual(finalOrig);
      setIsDualPreviewActive(false);

      if (activeTarget === "left") setLeftImage(croppedImageUrl);
      else if (activeTarget === "right") setRightImage(croppedImageUrl);
      else setUploadedImage(croppedImageUrl);

      setShowCropModal(false);
      setTempImageForCrop(null);
    } catch (error) {
      console.error("Crop & Upload error:", error);
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
    if (uploadedImage && !leftImage) setLeftImage(uploadedImage);
  };

  const exitDualMode = () => {
    setIsDualMode(false);
    setSelectedSize("Passport");
    setLeftImage(null);
    setRightImage(null);
  };

  const handleSizeClick = (sizeId: string) => {
    if (sizeId === "Visa") setShowVisaPopup((prev) => !prev);
    else {
      setShowVisaPopup(false);
      setSelectedSize(sizeId);
      if (sizeId === "Dual") enableDualMode();
      else if (isDualMode) exitDualMode();
    }
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
        if (uploaded) finalUrl = uploaded;
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
    }
  };

  // জেনারেট করার সময় সিলেক্টেড সাইজ অনুযায়ী ইমেজটিকে প্রপারলি ক্রপ করার হ্যান্ডলার
  const handleGeneratePhoto = async () => {
    const rawImage = uploadedImage || leftImage || originalImageForDual;
    if (!rawImage) return;

    setIsGenerating(true);

    try {
      // ১. সিলেক্টেড সাইজের Aspect Ratio বের করা
      const targetAspect = getSelectedTargetAspect();

      // ২. ইমেজকে একজ্যাক্ট সাইজ/রেশিওতে Canvas দিয়ে ক্রপ করা
      const processedImage = await cropImageToExactRatio(
        rawImage,
        targetAspect,
      );

      let newGeneratedImageUrl = processedImage;

      if (!originalImageForDual) {
        setOriginalImageForDual(rawImage);
      }

      const currentSizeLabel = getCurrentSizeLabel();
      const currentBgHex = getSelectedBgColorValue();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: processedImage, // একজ্যাক্ট ক্রপ হওয়া ইমেজ যাচ্ছে
          size: currentSizeLabel,
          bgColor: currentBgHex,
          clothing: selectedClothing,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data?.url) {
          newGeneratedImageUrl = data.url;
        }
      }

      const finalOriginal = originalImageForDual || rawImage;

      setUploadedImage(newGeneratedImageUrl);
      setIsDualPreviewActive(false);

      if (currentUser?.id) {
        const newDocData = {
          url: newGeneratedImageUrl,
          originalUrl: finalOriginal,
          size: currentSizeLabel,
          bgColor: currentBgHex,
          clothingStyle: `Style ${selectedClothing}`,
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

    try {
      if (imageToDelete.url) {
        await fetch("/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: imageToDelete.url }),
        });
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
      alert("Failed to delete the image. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

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
              onClick={() => !isCropping && setShowCropModal(false)}
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
                onClick={() => !isCropping && setShowCropModal(false)}
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
            <QrCodeSidebar />
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
