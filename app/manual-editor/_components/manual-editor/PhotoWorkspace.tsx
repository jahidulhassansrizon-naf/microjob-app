"use client";
import {
  FlipHorizontal2,
  Image as ImageIcon,
  Maximize2,
  RotateCcw,
  RotateCw,
  Upload,
  ZoomIn,
  ZoomOut,
  ArrowLeftRight,
  X,
} from "lucide-react";
import { useManualEditor } from "./EditorProvider";
import CropEditor from "./CropEditor";

export default function PhotoWorkspace() {
  const {
    activePhoto,
    dualPhotos,
    activeDualSlot,
    setActiveDualSlot,
    swapDualPhotos,
    openFilePicker,
    fileInputRef,
    handleFileInput,
    handleDrop,
    setIsDragging,
    uploadError,
    isDragging,
    activeBackground,
    currentPreset,
    photoMode,
    zoom,
    setZoom,
    rotation,
    setRotation,
    flipX,
    setFlipX,
    removeActivePhoto,
    sharp,
    filterString,
  } = useManualEditor();

  const transform = `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scale(${zoom / 100})`;

  // Sharpness matrix calculation
  const k = (sharp / 100) * 0.8;
  const kernelMatrix = `0 ${-k} 0 ${-k} ${1 + 4 * k} ${-k} 0 ${-k} 0`;

  return (
    <>
      {/* Dynamic SVG Filter for Sharpness */}
      <svg
        className="sr-only absolute w-0 h-0 pointer-events-none"
        aria-hidden="true"
      >
        <filter id="sharpness-filter">
          <feConvolveMatrix
            order="3"
            preserveAlpha="true"
            kernelMatrix={kernelMatrix}
          />
        </filter>
      </svg>

      <main className="lg:col-span-6 bg-[#1A1F2F] border border-gray-700/60 rounded-3xl p-5 md:p-6 flex flex-col items-center justify-center relative min-h-[520px] shadow-lg">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />
        {!activePhoto && photoMode !== "dual" ? (
          <div
            className={`max-w-md w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 bg-[#282E3B]/60 cursor-pointer transition ${
              isDragging
                ? "border-amber-400 ring-2 ring-amber-400/30"
                : "border-gray-600/70 hover:border-gray-500"
            }`}
            onClick={openFilePicker}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
          >
            <div className="w-12 h-12 rounded-full bg-gray-800/90 flex items-center justify-center text-gray-300 border border-gray-700">
              <ImageIcon size={22} />
            </div>
            <div>
              <h3 className="text-white text-base font-bold">
                {isDragging ? "Drop your photo here" : "Upload a Photo"}
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                Click or drag &amp; drop to upload
              </p>
              <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-[#1F242D] border border-gray-700 text-[11px] font-semibold text-gray-300">
                {currentPreset.label}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
            >
              <Upload size={14} /> Upload Photo
            </button>
            <div className="border border-gray-700 bg-[#1F242D] px-2.5 py-0.5 rounded-md text-[10px] font-mono text-gray-400">
              Ctrl+U
            </div>
            <p className="text-[9px] text-gray-500">
              JPG, PNG, WEBP • Max 10 MB
            </p>
          </div>
        ) : (
          <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
            {photoMode === "dual" ? (
              <>
                <div className="relative w-full max-w-[540px] aspect-[2/1] bg-black/20 rounded-2xl border border-white/10 p-3">
                  <div className="grid grid-cols-2 gap-3 w-full h-full">
                    {[0, 1].map((index) => {
                      const photo = dualPhotos[index as 0 | 1];
                      return (
                        <div
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDualSlot(index as 0 | 1);
                            // যদি স্লটে কোনো ছবি না থাকে, শুধুমাত্র তখনই ফাইল পিকার ওপেন হবে
                            if (!photo) {
                              openFilePicker();
                            }
                          }}
                          className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                            activeDualSlot === index
                              ? "border-amber-400 ring-2 ring-amber-400/30"
                              : "border-white/10 hover:border-white/30"
                          } bg-white flex items-center justify-center cursor-pointer`}
                        >
                          {photo ? (
                            <img
                              src={photo.url}
                              alt={`Photo ${index + 1}`}
                              className="max-w-full max-h-full object-contain pointer-events-none"
                              style={{ filter: filterString }}
                            />
                          ) : (
                            <div className="text-xs text-gray-400">
                              Empty slot
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDualSlot(0);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      activeDualSlot === 0
                        ? "bg-amber-500 text-gray-900 shadow-md"
                        : "bg-[#282E3B] text-white hover:bg-[#323948]"
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDualSlot(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      activeDualSlot === 1
                        ? "bg-amber-500 text-gray-900 shadow-md"
                        : "bg-[#282E3B] text-white hover:bg-[#323948]"
                    }`}
                  >
                    Right
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      swapDualPhotos();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#282E3B] hover:bg-[#323948] text-white text-xs font-black flex gap-2 items-center transition-all"
                  >
                    <ArrowLeftRight size={14} /> Swap
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFilePicker();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 text-xs font-black flex items-center gap-1 transition-all shadow-md"
                  >
                    <Upload size={14} />
                    Upload slot
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className="relative max-h-[400px] max-w-full overflow-hidden rounded-2xl border border-gray-700 shadow-xl"
                  style={{ backgroundColor: activeBackground }}
                >
                  <img
                    src={activePhoto!.url}
                    alt="Uploaded"
                    className="block max-h-[400px] max-w-full object-contain"
                    style={{
                      transform,
                      transformOrigin: "center",
                      filter: filterString,
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeActivePhoto}
                    className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setZoom(Math.max(25, zoom - 10))}
                    className="h-9 w-9 rounded-lg bg-[#282E3B] text-white flex items-center justify-center"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="h-9 px-3 rounded-lg bg-[#282E3B] text-white flex items-center text-xs font-black">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom(Math.min(300, zoom + 10))}
                    className="h-9 w-9 rounded-lg bg-[#282E3B] text-white flex items-center justify-center"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((rotation - 90 + 360) % 360)}
                    className="h-9 px-3 rounded-lg bg-[#282E3B] text-white text-xs font-black flex items-center gap-1"
                  >
                    <RotateCcw size={13} /> Rotate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="h-9 px-3 rounded-lg bg-[#282E3B] text-white text-xs font-black flex items-center gap-1"
                  >
                    <RotateCw size={13} /> Rotate
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipX(!flipX)}
                    className={`h-9 px-3 rounded-lg text-xs font-black flex items-center gap-1 ${
                      flipX
                        ? "bg-amber-500 text-gray-900"
                        : "bg-[#282E3B] text-white"
                    }`}
                  >
                    <FlipHorizontal2 size={13} /> Mirror
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(100);
                      setRotation(0);
                      setFlipX(false);
                    }}
                    className="h-9 px-3 rounded-lg bg-[#282E3B] text-white text-xs font-black flex items-center gap-1"
                  >
                    <Maximize2 size={13} /> Reset
                  </button>
                </div>
              </>
            )}
            {uploadError && (
              <div className="absolute bottom-3 left-4 right-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-center text-[10px] font-semibold text-red-200">
                {uploadError}
              </div>
            )}
          </div>
        )}
      </main>
      <CropEditor />
    </>
  );
}
