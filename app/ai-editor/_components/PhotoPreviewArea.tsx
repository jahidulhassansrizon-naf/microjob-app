"use client";

import React from "react";
import { Upload, X, ArrowLeftRight, ImageIcon, RefreshCw } from "lucide-react";

export interface BoxInfo {
  text: string;
  style: { width: string; height: string };
}

interface PhotoPreviewAreaProps {
  isDualMode: boolean;
  uploadedImage: string | null;
  setUploadedImage: React.Dispatch<React.SetStateAction<string | null>>;
  leftImage: string | null;
  setLeftImage: React.Dispatch<React.SetStateAction<string | null>>;
  rightImage: string | null;
  setRightImage: React.Dispatch<React.SetStateAction<string | null>>;
  triggerUpload: (target: "single" | "left" | "right") => void;
  enableDualMode: () => void;
  exitDualMode: () => void;
  activeBoxInfo: BoxInfo;
  currentBgColorValue: string;
  isGenerating: boolean;
  isDeleting: boolean;
  originalImageForDual: string | null;
  setOriginalImageForDual: React.Dispatch<React.SetStateAction<string | null>>;
  isDualPreviewActive: boolean;
  setIsDualPreviewActive: React.Dispatch<React.SetStateAction<boolean>>;
}

function EmptyUploadBox({
  title,
  subtitle,
  onUpload,
}: {
  title: string;
  subtitle?: string;
  onUpload: () => void;
}) {
  return (
    <div className="flex h-full min-h-[250px] flex-col items-center justify-center bg-[#1a2234] p-4 text-center">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-400">
        <Upload size={18} />
      </div>
      <h3 className="mb-1 text-xs font-medium text-white">{title}</h3>
      {subtitle && (
        <p className="mb-3 text-[10px] leading-tight text-gray-400">
          {subtitle}
        </p>
      )}
      <button
        type="button"
        onClick={onUpload}
        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-[11px] font-medium text-white shadow-md transition hover:opacity-90 active:scale-95"
      >
        <Upload size={12} /> Upload Photo
      </button>
    </div>
  );
}

function PhotoCard({
  image,
  label,
  boxInfo,
  background,
  onRemove,
  showBorder = true,
}: {
  image: string | null;
  label: string;
  boxInfo: BoxInfo;
  background: string;
  onRemove: () => void;
  showBorder?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <span className="max-w-full truncate text-xs font-semibold uppercase tracking-wider text-gray-300">
        {label}
      </span>
      <div
        className={`relative overflow-hidden rounded-2xl shadow-2xl ${
          showBorder ? "border-2 border-gray-700" : ""
        }`}
        style={{
          width: "min(100%, 290px)",
          aspectRatio: `${parseFloat(boxInfo.style.width) || 290} / ${parseFloat(boxInfo.style.height) || 372}`,
          backgroundColor: background,
        }}
      >
        {image ? (
          <div className="group relative h-full w-full">
            <img
              src={image}
              alt={label}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${label}`}
              className="absolute right-2 top-2 z-10 rounded-full bg-gray-900/80 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100 cursor-pointer"
            >
              <X size={14} />
            </button>
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white backdrop-blur-sm">
              {boxInfo.text}
            </div>
          </div>
        ) : (
          <EmptyUploadBox
            title={`Upload ${label.toLowerCase()}`}
            onUpload={onRemove}
          />
        )}
      </div>
    </div>
  );
}

export default function PhotoPreviewArea({
  isDualMode,
  uploadedImage,
  setUploadedImage,
  leftImage,
  setLeftImage,
  rightImage,
  setRightImage,
  triggerUpload,
  enableDualMode,
  exitDualMode,
  activeBoxInfo,
  currentBgColorValue,
  isGenerating,
  isDeleting,
  originalImageForDual,
  setOriginalImageForDual,
  isDualPreviewActive,
  setIsDualPreviewActive,
}: PhotoPreviewAreaProps) {
  const handleRemoveSingle = () => {
    if (originalImageForDual && uploadedImage) {
      setUploadedImage(originalImageForDual);
      setOriginalImageForDual(null);
      setIsDualPreviewActive(false);
      return;
    }
    setUploadedImage(null);
    setOriginalImageForDual(null);
    setIsDualPreviewActive(false);
  };

  const cardStyle = {
    width: activeBoxInfo.style.width,
    maxWidth: "100%",
    aspectRatio: `${parseFloat(activeBoxInfo.style.width) || 290} / ${parseFloat(activeBoxInfo.style.height) || 372}`,
    height: "auto",
  } as React.CSSProperties;

  return (
    <div className="relative flex max-h-[85vh] min-h-[540px] flex-1 flex-col items-center justify-center overflow-y-auto rounded-2xl bg-[#121826] p-4 sm:p-6 shadow-lg">
      {(isGenerating || isDeleting) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-black/75 p-4 text-center backdrop-blur-md">
          <div
            className={`mb-5 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent ${isDeleting ? "border-red-500/20 border-t-red-500" : "border-orange-500/20 border-t-orange-500"}`}
          />
          <h3 className="mb-1 text-base font-semibold tracking-wide text-white">
            {isDeleting ? "Deleting Photo..." : "Generating Your Photo..."}
          </h3>
          <p className="max-w-xs text-xs leading-relaxed text-gray-300">
            {isDeleting
              ? "Removing your photo, please wait..."
              : "Uploading & applying AI edits, please wait a moment."}
          </p>
          <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full border border-gray-700/50 bg-gray-800">
            <div
              className={`h-full w-full animate-pulse rounded-full ${isDeleting ? "bg-red-500" : "bg-orange-500"}`}
            />
          </div>
        </div>
      )}

      {!isDualMode ? (
        <div className="flex w-full flex-col items-center justify-center gap-4">
          {isDualPreviewActive && originalImageForDual ? (
            <div className="grid w-full max-w-[760px] grid-cols-1 gap-6 md:grid-cols-2">
              <PhotoCard
                image={originalImageForDual}
                label="Real Photo"
                boxInfo={activeBoxInfo}
                background={currentBgColorValue}
                onRemove={() => setOriginalImageForDual(null)}
              />
              <PhotoCard
                image={uploadedImage}
                label="Edited Photo"
                boxInfo={activeBoxInfo}
                background={currentBgColorValue}
                onRemove={handleRemoveSingle}
              />
            </div>
          ) : (
            <div
              className={`relative overflow-hidden rounded-2xl shadow-2xl ${
                uploadedImage
                  ? "border-2 border-transparent"
                  : "border-2 border-dashed border-gray-600"
              }`}
              style={cardStyle}
            >
              {uploadedImage ? (
                <div
                  className="group relative h-full w-full"
                  style={{ backgroundColor: currentBgColorValue }}
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded or generated preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveSingle}
                    className="absolute right-2 top-2 z-10 rounded-full bg-gray-900/80 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100 cursor-pointer"
                    aria-label="Remove current photo"
                  >
                    <X size={14} />
                  </button>
                  <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white backdrop-blur-sm">
                    {activeBoxInfo.text}
                  </div>
                </div>
              ) : (
                <EmptyUploadBox
                  title="Upload a Photo"
                  subtitle={`Click or scan QR code to upload (${activeBoxInfo.text})`}
                  onUpload={() => triggerUpload("single")}
                />
              )}
            </div>
          )}

          {!isDualPreviewActive && (
            <button
              type="button"
              onClick={enableDualMode}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-2 text-xs text-gray-300 shadow-sm transition hover:border-gray-600 hover:bg-gray-800"
            >
              <ImageIcon size={14} className="text-orange-400" /> Upload 2
              separate images
            </button>
          )}
        </div>
      ) : (
        <div className="flex w-full max-w-[760px] flex-col items-center gap-5">
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-center text-xs font-semibold uppercase tracking-wider text-gray-300">
                Left Person
              </span>
              <div
                className="relative mx-auto w-full max-w-[290px] overflow-hidden rounded-2xl border-2 border-gray-700 shadow-xl"
                style={cardStyle}
              >
                {leftImage ? (
                  <div
                    className="group relative h-full w-full"
                    style={{ backgroundColor: currentBgColorValue }}
                  >
                    <img
                      src={leftImage}
                      alt="Left person"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setLeftImage(null)}
                      className="absolute right-2 top-2 z-10 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100 cursor-pointer"
                      aria-label="Remove left photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <EmptyUploadBox
                    title="Upload left photo"
                    onUpload={() => triggerUpload("left")}
                  />
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-center text-xs font-semibold uppercase tracking-wider text-gray-300">
                Right Person
              </span>
              <div
                className="relative mx-auto w-full max-w-[290px] overflow-hidden rounded-2xl border-2 border-gray-700 shadow-xl"
                style={cardStyle}
              >
                {rightImage ? (
                  <div
                    className="group relative h-full w-full"
                    style={{ backgroundColor: currentBgColorValue }}
                  >
                    <img
                      src={rightImage}
                      alt="Right person"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setRightImage(null)}
                      className="absolute right-2 top-2 z-10 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100 cursor-pointer"
                      aria-label="Remove right photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <EmptyUploadBox
                    title="Upload right photo"
                    onUpload={() => triggerUpload("right")}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLeftImage(rightImage);
                setRightImage(leftImage);
              }}
              className="cursor-pointer rounded-xl border border-gray-700 bg-gray-800 p-2 text-gray-300 transition hover:border-gray-500 hover:bg-gray-700"
              title="Swap images"
              aria-label="Swap images"
            >
              <ArrowLeftRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setLeftImage(null);
                setRightImage(null);
                exitDualMode();
              }}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-900/50 bg-gray-800/80 px-3.5 py-1.5 text-xs text-red-400 transition hover:bg-red-900/40"
            >
              <RefreshCw size={14} /> Exit dual mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
