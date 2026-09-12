import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
  Trash2,
  Minus,
  Plus,
  RotateCcw,
  Check,
  Eye,
} from "lucide-react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export interface PhotoSignatureData {
  photoUrl: string | null;
  signatureUrl: string | null;
}

interface PhotoSignatureTabProps {
  formData?: PhotoSignatureData;
  onChange?: (field: keyof PhotoSignatureData, value: string | null) => void;
}

const defaultData: PhotoSignatureData = {
  photoUrl: null,
  signatureUrl: null,
};

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
      },
      aspect ?? 1,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const PhotoSignatureTab: React.FC<PhotoSignatureTabProps> = ({
  formData = defaultData,
  onChange,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeType, setActiveType] = useState<"photo" | "signature">("photo");
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);

  // React Crop States
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [zoom, setZoom] = useState<number>(1);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Handle File Selection
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "signature",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageSrc(reader.result as string);
        setActiveType(type);
        setAspect(undefined);
        setZoom(1);
        setModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;
    setCrop(centerAspectCrop(width, height, undefined));
  };

  // Set Presets
  const handlePresetChange = (type: "free" | "300x300" | "300x180") => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;

    if (type === "free") {
      setAspect(undefined);
      setCrop(centerAspectCrop(width, height, undefined));
    } else if (type === "300x300") {
      setAspect(1);
      setCrop(centerAspectCrop(width, height, 1));
    } else if (type === "300x180") {
      const newAspect = 300 / 180;
      setAspect(newAspect);
      setCrop(centerAspectCrop(width, height, newAspect));
    }
  };

  // Generate Cropped Image using Canvas
  const handleCropAndUse = async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const base64Image = canvas.toDataURL("image/jpeg", 0.9);
    if (onChange) {
      onChange(
        activeType === "photo" ? "photoUrl" : "signatureUrl",
        base64Image,
      );
    }
    setModalOpen(false);
  };

  const handleSkipCrop = () => {
    if (onChange && selectedImageSrc) {
      onChange(
        activeType === "photo" ? "photoUrl" : "signatureUrl",
        selectedImageSrc,
      );
    }
    setModalOpen(false);
  };

  const handleRemove = (type: "photo" | "signature") => {
    if (onChange) {
      onChange(type === "photo" ? "photoUrl" : "signatureUrl", null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
          <Upload className="w-4 h-4 stroke-[2.5]" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">Upload</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photo Upload Box */}
        <div className="border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-20 h-24 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
            {formData.photoUrl ? (
              <>
                <img
                  src={formData.photoUrl}
                  alt="Uploaded Photo"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImageSrc(formData.photoUrl);
                    setPreviewOpen(true);
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </>
            ) : (
              <ImageIcon className="w-5 h-5 text-amber-500/80" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Photo</span>
              {formData.photoUrl && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <Check className="w-3 h-3 stroke-[3]" /> Uploaded
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-400 font-medium">
              PNG, JPG or WEBP
            </p>

            <div className="flex items-center gap-2 pt-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-2xs">
                <Camera className="w-3.5 h-3.5 text-gray-500" />
                <span>
                  {formData.photoUrl ? "Change photo" : "Upload photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "photo")}
                  className="hidden"
                />
              </label>

              {formData.photoUrl && (
                <button
                  type="button"
                  onClick={() => handleRemove("photo")}
                  className="p-1.5 border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Signature Upload Box */}
        <div className="border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-28 h-16 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
            {formData.signatureUrl ? (
              <>
                <img
                  src={formData.signatureUrl}
                  alt="Uploaded Signature"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImageSrc(formData.signatureUrl);
                    setPreviewOpen(true);
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </>
            ) : (
              <ImageIcon className="w-5 h-5 text-amber-500/80" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Signature</span>
              {formData.signatureUrl && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <Check className="w-3 h-3 stroke-[3]" /> Uploaded
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-400 font-medium">
              PNG, JPG or WEBP
            </p>

            <div className="flex items-center gap-2 pt-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-2xs">
                <Camera className="w-3.5 h-3.5 text-gray-500" />
                <span>
                  {formData.signatureUrl ? "Change photo" : "Upload photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "signature")}
                  className="hidden"
                />
              </label>

              {formData.signatureUrl && (
                <button
                  type="button"
                  onClick={() => handleRemove("signature")}
                  className="p-1.5 border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                  title="Remove signature"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== PREVIEW MODAL (LIGHTBOX) ==================== */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 relative p-3 inline-block">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {previewImageSrc && (
              <div className="flex items-center justify-center">
                <img
                  src={previewImageSrc}
                  alt="Full Preview"
                  className="max-w-[85vw] max-h-[82vh] w-auto h-auto object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== CROP MODAL ==================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-[620px] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900">
                Crop {activeType === "photo" ? "photo" : "signature"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Toolbar: Preset & Zoom Controls */}
            <div className="px-6 pb-3 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 font-medium text-[11px]">
                  Preset
                </span>
                <button
                  type="button"
                  onClick={() => handlePresetChange("free")}
                  className={`px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    aspect === undefined
                      ? "bg-[#E88000] text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange("300x300")}
                  className={`px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    aspect === 1
                      ? "bg-[#E88000] text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  300×300
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange("300x180")}
                  className={`px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    aspect === 300 / 180
                      ? "bg-[#E88000] text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  300×180
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(2.5, prev + 0.1))}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="text-gray-400 hover:text-gray-600 ml-1 cursor-pointer"
                  title="Reset zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Image Crop Area */}
            <div className="px-6 py-5 flex flex-col items-center justify-center bg-[#F9FAFB] min-h-[360px] max-h-[420px] overflow-auto">
              {selectedImageSrc && (
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transition: "transform 0.1s ease-out",
                  }}
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                  >
                    <img
                      src={selectedImageSrc}
                      alt="Crop preview"
                      onLoad={onImageLoad}
                      style={{ maxHeight: "300px", display: "block" }}
                    />
                  </ReactCrop>
                </div>
              )}
            </div>

            {/* Helper Text & AI Button Row */}
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-100 bg-white">
              <p className="text-[11px] text-gray-400 font-medium">
                Drag the corners or edges to adjust the crop area.
              </p>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Make this photo professional</span>
              </button>
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-white border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkipCrop}
                className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              >
                Skip crop
              </button>
              <button
                type="button"
                onClick={handleCropAndUse}
                className="px-5 py-2 bg-[#E88000] text-white rounded-xl text-xs font-semibold hover:bg-[#d17300] transition-colors shadow-2xs cursor-pointer"
              >
                Crop & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoSignatureTab;
