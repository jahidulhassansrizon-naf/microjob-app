"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Crop as CropIcon,
  Star,
  Share2,
  ArrowLeft,
  RotateCcw,
  Image as ImageIcon,
  CreditCard,
  Download,
  Upload,
} from "lucide-react";

// Canvas helper function to generate cropped image
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  format: string,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY,
  );

  let mimeType = "image/jpeg";
  if (format === "PNG") mimeType = "image/png";
  if (format === "WebP") mimeType = "image/webp";
  if (format === "AVIF") mimeType = "image/avif";

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      mimeType,
      0.95,
    );
  });
}

const getNumericAspectRatio = (val: string): number | undefined => {
  switch (val) {
    case "1:1":
      return 1;
    case "4:3":
      return 4 / 3;
    case "16:9":
      return 16 / 9;
    case "3:2":
      return 3 / 2;
    case "free":
    default:
      return undefined;
  }
};

export default function CropImage() {
  const [aspectRatio, setAspectRatio] = useState<string>("free");
  const [outputFormat, setOutputFormat] = useState<string>("JPG");
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "");
    });
    reader.readAsDataURL(file);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith("image/")) {
          handleFile(file);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const numericAspect = getNumericAspectRatio(aspectRatio);

    const newCrop = numericAspect
      ? centerCrop(
          makeAspectCrop(
            { unit: "%", width: 85 },
            numericAspect,
            width,
            height,
          ),
          width,
          height,
        )
      : { unit: "%" as const, x: 5, y: 5, width: 90, height: 90 };

    setCrop(newCrop);
  };

  const handleAspectRatioChange = (ratioVal: string) => {
    setAspectRatio(ratioVal);
    const numericAspect = getNumericAspectRatio(ratioVal);

    if (imgRef.current) {
      const { width, height } = imgRef.current;
      if (numericAspect) {
        const newCrop = centerCrop(
          makeAspectCrop(
            { unit: "%", width: 80 },
            numericAspect,
            width,
            height,
          ),
          width,
          height,
        );
        setCrop(newCrop);
      } else {
        setCrop({ unit: "%", x: 10, y: 10, width: 80, height: 80 });
      }
    }
  };

  const handleDownload = async () => {
    if (
      !imgRef.current ||
      !completedCrop ||
      !completedCrop.width ||
      !completedCrop.height
    )
      return;

    const blob = await getCroppedImg(
      imgRef.current,
      completedCrop,
      outputFormat,
    );
    if (!blob) return;

    const previewUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = previewUrl;
    const ext =
      outputFormat.toLowerCase() === "jpg" ? "jpg" : outputFormat.toLowerCase();
    link.download = `cropped-image.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(previewUrl);
  };

  const handleReset = () => {
    setAspectRatio("free");
    setOutputFormat("JPG");
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      id="crop-image-tool"
      className="w-full space-y-5 text-[#0F172A] font-sans"
    >
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        :where(#crop-image-tool) a[href],
        :where(#crop-image-tool) button:not(:disabled),
        :where(#crop-image-tool) label:has(input[type="file"]),
        :where(#crop-image-tool) summary,
        :where(#crop-image-tool) select,
        :where(#crop-image-tool) input[type="color"],
        :where(#crop-image-tool) input[type="range"],
        :where(#crop-image-tool) input[type="checkbox"],
        :where(#crop-image-tool) input[type="radio"],
        :where(#crop-image-tool) input[type="file"] {
          cursor: pointer;
        }

        :where(#crop-image-tool) button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={onSelectFile}
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Sohoj Tools</span>
        </Link>
        <span>/</span>
        <span>Image Tools</span>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">Crop Image</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0 border border-sky-100">
            <CropIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F172A]">Crop Image</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Trim images to the area you need — free or fixed aspect ratios,
              all in your browser.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Star size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side Controls Panel (Sticky) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-5 self-start">
          {/* Aspect Ratio Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]">Aspect ratio</h2>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Free", value: "free" },
                { label: "1:1", value: "1:1" },
                { label: "4:3", value: "4:3" },
                { label: "16:9", value: "16:9" },
                { label: "3:2", value: "3:2" },
              ].map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    aspectRatio === ratio.value
                      ? "border-sky-500 bg-sky-50/40 text-sky-600 font-bold shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="w-4 h-4 border border-current rounded-xs flex items-center justify-center text-[8px]">
                    {ratio.value === "free" ? "..." : ratio.label.charAt(0)}
                  </div>
                  <span className="text-[10px]">{ratio.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Output Format Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#0F172A]">Output format</h2>
            <div className="grid grid-cols-4 gap-2">
              {["JPG", "PNG", "WebP", "AVIF"].map((format) => (
                <button
                  key={format}
                  onClick={() => setOutputFormat(format)}
                  className={`py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    outputFormat === format
                      ? "border-sky-500 bg-sky-50/40 text-sky-600 font-bold shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[10px] font-bold">{format}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:text-[#0F172A] text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              onClick={handleDownload}
              disabled={!imgSrc || !completedCrop?.width}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                imgSrc && completedCrop?.width
                  ? "bg-sky-500 text-white hover:bg-sky-600 cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Download size={14} /> Crop & Download
            </button>
          </div>
        </div>

        {/* Right Side Crop Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-[#0F172A]">Crop preview</h2>
              <div className="flex items-center gap-2">
                {imgSrc && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] bg-sky-50 text-sky-600 hover:bg-sky-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                  >
                    <Upload size={12} /> Change Image
                  </button>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    imgSrc
                      ? "bg-emerald-50 text-emerald-600 font-semibold"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {imgSrc ? "Ready" : "Empty"}
                </span>
              </div>
            </div>

            {/* Dropzone or Crop Area */}
            {!imgSrc ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-2xl p-10 min-h-[360px] flex flex-col items-center justify-center flex-1 text-center my-1 cursor-pointer transition-all ${
                  isDragging
                    ? "bg-sky-50/80 border-sky-400 scale-[0.99]"
                    : "bg-[#F8FAFC] border-gray-200 hover:border-sky-300 hover:bg-sky-50/20"
                }`}
              >
                <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mb-3">
                  <ImageIcon size={28} />
                </div>
                <span className="text-xs font-bold text-[#0F172A] block">
                  Click or drag an image here
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Drag the crop handles to select the area you want to keep.
                </span>
                <span className="text-[10px] text-gray-400 mt-4 font-medium">
                  Or press Ctrl+V to paste a copied image
                </span>
              </div>
            ) : (
              <div className="flex-1 bg-[#F8FAFC] border border-gray-100 rounded-2xl p-3 flex items-center justify-center min-h-[360px]">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={getNumericAspectRatio(aspectRatio)}
                  className="max-w-full max-h-[360px]"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Source"
                    onLoad={onImageLoad}
                    className="max-h-[360px] w-auto max-w-full object-contain rounded-lg block mx-auto"
                  />
                </ReactCrop>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#0F172A]">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/image-size-reducer"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-sky-500 transition-colors">
                Image Size Reducer
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Shrink JPG, PNG, and WebP photos in your browser — quality stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/nid-joiner"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-sky-500 transition-colors">
                NID Joiner
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Turn NID card front and back photos into a clean A4 PDF — all in
                your browser.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/remove-background"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0"></div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-sky-500 transition-colors">
                Remove Background
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Erase portrait, product, or logo backgrounds in your browser —
                download a transparent PNG.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
