"use client";

import React from "react";
import { Upload, X, ArrowLeftRight, ImageIcon } from "lucide-react";

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
}: any) {
  // 🚀 এডিটেড ফটো ডিলিট করে মূল অরিজিনাল ছবিতে ফেরত যাওয়ার হ্যান্ডলার
  const handleRemoveEditedKeepOriginal = () => {
    if (originalImageForDual) {
      setUploadedImage(originalImageForDual);
    }
    setOriginalImageForDual(null);
    setIsDualPreviewActive(false);
  };

  return (
    <div className="flex-1 bg-[#121826] rounded-2xl flex flex-col items-center justify-center p-6 relative shadow-lg overflow-y-auto max-h-[85vh]">
      {/* Loading Overlay */}
      {(isGenerating || isDeleting) && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 text-center rounded-2xl transition-all duration-300">
          <div className="relative mb-5 flex items-center justify-center">
            <div
              className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin ${
                isDeleting
                  ? "border-red-500/20 border-t-red-500"
                  : "border-orange-500/20 border-t-orange-500"
              }`}
            ></div>
          </div>

          <h3 className="text-white font-semibold text-base mb-1 tracking-wide">
            {isDeleting ? "Deleting Photo..." : "Generating Your Photo..."}
          </h3>
          <p className="text-gray-300 text-xs max-w-xs leading-relaxed">
            {isDeleting
              ? "Removing your photo, please wait..."
              : "Uploading & applying AI edits, please wait a moment"}
          </p>

          <div className="w-48 h-1.5 bg-gray-800 rounded-full mt-5 overflow-hidden border border-gray-700/50">
            <div
              className={`h-full rounded-full animate-[pulse_1s_infinite] ${
                isDeleting
                  ? "bg-gradient-to-r from-rose-500 to-red-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
            ></div>
          </div>
        </div>
      )}

      {!isDualMode ? (
        <div className="flex flex-col items-center justify-center gap-4">
          {/* 🚀 শুধুমাত্র Modal (পপআপ) থেকে "Regenerate" করলে (isDualPreviewActive === true) Real & Edited ২টা ছবিই দেখাবে */}
          {isDualPreviewActive && originalImageForDual ? (
            <div className="flex flex-col md:flex-row items-center gap-6 my-2">
              {/* 1️⃣ Real / Original Photo Card */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  Real Photo
                </span>
                <div
                  className="border-2 border-orange-500 rounded-2xl overflow-hidden relative shadow-2xl transition-all duration-300 ease-in-out"
                  style={{
                    width: activeBoxInfo.style.width,
                    height: activeBoxInfo.style.height,
                    backgroundColor: currentBgColorValue,
                  }}
                >
                  <img
                    src={originalImageForDual}
                    alt="Real Original Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none z-10">
                    {activeBoxInfo.text}
                  </div>
                </div>
              </div>

              {/* 2️⃣ Edited Photo Card */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Edited Photo
                </span>
                <div
                  className="border-2 border-emerald-500/80 rounded-2xl overflow-hidden relative shadow-2xl group bg-[#1a2234]"
                  style={{
                    width: activeBoxInfo.style.width,
                    height: activeBoxInfo.style.height,
                    backgroundColor: currentBgColorValue,
                  }}
                >
                  <img
                    src={uploadedImage || ""}
                    alt="Edited Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveEditedKeepOriginal}
                    className="absolute top-2 right-2 bg-gray-900/80 text-white p-1.5 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                    title="Remove edited photo & keep original"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none z-10">
                    {activeBoxInfo.text}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 🚀 মূল পেজে "Generate Photo" বাটনে যতবারই ক্লিক করা হোক, সবসময় সিঙ্গেল বক্স দেখাবে */
            <div
              className={`border-2 rounded-2xl flex flex-col items-center justify-center text-center relative transition-all duration-300 ease-in-out shadow-2xl overflow-hidden ${
                uploadedImage
                  ? "border-transparent p-0"
                  : "border-dashed border-gray-600 p-4 bg-[#1a2234]"
              }`}
              style={{
                width: activeBoxInfo.style.width,
                height: activeBoxInfo.style.height,
              }}
            >
              {uploadedImage ? (
                <div
                  className="relative w-full h-full flex items-center justify-center group"
                  style={{ backgroundColor: currentBgColorValue }}
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded / Edited Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      if (originalImageForDual) {
                        handleRemoveEditedKeepOriginal();
                      } else {
                        setUploadedImage(null);
                        setIsDualPreviewActive(false);
                        setOriginalImageForDual(null);
                      }
                    }}
                    className="absolute top-2 right-2 bg-gray-900/80 text-white p-1.5 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none z-10">
                    {activeBoxInfo.text}
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mb-2 text-gray-400">
                    <Upload size={18} />
                  </div>
                  <h3 className="text-white font-medium text-xs mb-1">
                    Upload a Photo
                  </h3>
                  <p className="text-gray-400 text-[10px] mb-3 leading-tight">
                    Click or scan QR code to upload <br />
                    <span className="text-orange-400 font-medium">
                      ({activeBoxInfo.text})
                    </span>
                  </p>
                  <button
                    onClick={() => triggerUpload("single")}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium px-3.5 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 shadow-md hover:opacity-90 transition cursor-pointer active:scale-95"
                  >
                    <Upload size={12} /> Upload Photo
                  </button>
                </>
              )}
            </div>
          )}

          {!isDualPreviewActive && (
            <div className="mt-2">
              <button
                onClick={enableDualMode}
                className="bg-gray-800/80 hover:bg-gray-800 text-gray-300 px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-gray-700 transition shadow-sm cursor-pointer hover:border-gray-600"
              >
                <ImageIcon size={14} className="text-orange-400" />
                Upload 2 separate images
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Dual Mode Upload Section */
        <div className="flex flex-col items-center">
          <div className="flex gap-4 mb-4">
            <div
              className={`w-[290px] h-[350px] border-2 rounded-2xl flex flex-col items-center justify-center text-center relative shadow-xl overflow-hidden ${
                leftImage
                  ? "border-transparent p-0"
                  : "border-dashed border-gray-600 p-4 bg-[#1a2234]"
              }`}
            >
              {leftImage ? (
                <div
                  className="relative w-full h-full flex items-center justify-center group"
                  style={{ backgroundColor: currentBgColorValue }}
                >
                  <img
                    src={leftImage}
                    alt="Left Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setLeftImage(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mb-2 text-gray-400">
                    <Upload size={18} />
                  </div>
                  <h3 className="text-white font-medium text-xs mb-1">
                    Upload left photo
                  </h3>
                  <button
                    onClick={() => triggerUpload("left")}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-medium px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow cursor-pointer hover:opacity-90 transition active:scale-95"
                  >
                    <Upload size={12} /> Upload Photo
                  </button>
                </>
              )}
            </div>

            <div
              className={`w-[290px] h-[350px] border-2 rounded-2xl flex flex-col items-center justify-center text-center relative shadow-xl overflow-hidden ${
                rightImage
                  ? "border-transparent p-0"
                  : "border-dashed border-gray-600 p-4 bg-[#1a2234]"
              }`}
            >
              {rightImage ? (
                <div
                  className="relative w-full h-full flex items-center justify-center group"
                  style={{ backgroundColor: currentBgColorValue }}
                >
                  <img
                    src={rightImage}
                    alt="Right Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setRightImage(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mb-2 text-gray-400">
                    <Upload size={18} />
                  </div>
                  <h3 className="text-white font-medium text-xs mb-1">
                    Upload right photo
                  </h3>
                  <button
                    onClick={() => triggerUpload("right")}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-medium px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow cursor-pointer hover:opacity-90 transition active:scale-95"
                  >
                    <Upload size={12} /> Upload Photo
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const temp = leftImage;
                setLeftImage(rightImage);
                setRightImage(temp);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-xl border border-gray-700 transition cursor-pointer hover:border-gray-500"
              title="Swap images"
            >
              <ArrowLeftRight size={16} />
            </button>
            <button
              onClick={exitDualMode}
              className="bg-gray-800/80 hover:bg-red-900/40 text-red-400 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 border border-red-900/50 transition cursor-pointer"
            >
              <X size={14} /> Exit dual mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
