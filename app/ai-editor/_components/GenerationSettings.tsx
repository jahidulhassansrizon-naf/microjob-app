"use client";

import React from "react";
import {
  RefreshCw,
  Sparkles,
  User,
  Check,
  Palette,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";

export interface PhotoSizeOption {
  id: string;
  label: string;
  tooltip?: string;
}

export interface VisaSizeOption {
  label: string;
}

export interface BgColorOption {
  type?: string;
  className?: string;
}

export interface GenerationSettingsProps {
  photoSizes?: PhotoSizeOption[];
  selectedSize?: string;
  handleSizeClick?: (id: string) => void;
  showVisaPopup?: boolean;
  setShowVisaPopup?: (show: boolean) => void;
  visaSizesList?: VisaSizeOption[];
  selectedVisaSize?: string;
  setSelectedVisaSize?: (size: string) => void;
  setSelectedSize?: (size: string) => void;
  isDualMode?: boolean;
  exitDualMode?: () => void;
  backgroundColors?: BgColorOption[];
  selectedBg?: number;
  setSelectedBg?: (bg: number) => void;
  setShowColorPicker?: React.Dispatch<React.SetStateAction<boolean>>;
  showColorPicker?: boolean;
  customBgColor?: string;
  setCustomBgColor?: (color: string) => void;
  selectedClothing?: number;
  setSelectedClothing?: (clothing: number) => void;
  leftClothing?: number;
  setLeftClothing?: (clothing: number) => void;
  rightClothing?: number;
  setRightClothing?: (clothing: number) => void;
  colorPickerRef?: React.RefObject<HTMLDivElement | null>;
  visaPopupRef?: React.RefObject<HTMLDivElement | null>;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export default function GenerationSettings({
  photoSizes = [],
  selectedSize = "",
  handleSizeClick = () => {},
  showVisaPopup = false,
  setShowVisaPopup = () => {},
  visaSizesList = [],
  selectedVisaSize = "",
  setSelectedVisaSize = () => {},
  setSelectedSize = () => {},
  isDualMode = false,
  exitDualMode = () => {},
  backgroundColors = [],
  selectedBg = 0,
  setSelectedBg = () => {},
  setShowColorPicker = () => {},
  showColorPicker = false,
  customBgColor = "#FFFFFF",
  setCustomBgColor = () => {},
  selectedClothing = 0,
  setSelectedClothing = () => {},
  leftClothing = 0,
  setLeftClothing = () => {},
  rightClothing = 0,
  setRightClothing = () => {},
  colorPickerRef,
  visaPopupRef,
  onGenerate = () => {},
  isGenerating = false,
}: GenerationSettingsProps) {
  return (
    <div className="w-full max-w-full lg:w-[320px] bg-white rounded-2xl p-4 shadow-sm overflow-y-auto max-h-none lg:max-h-[calc(100vh-100px)] flex flex-col justify-between relative shrink-0">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm text-gray-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
            Generation settings
          </span>
        </div>

        {/* PHOTO SIZE SECTION */}
        <div className="mb-6 relative" ref={visaPopupRef}>
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>PHOTO SIZE</span>
            <RefreshCw
              size={14}
              className="cursor-pointer text-orange-500 hover:rotate-180 transition-transform duration-300"
            />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-2">
            {photoSizes.map((size) => {
              const isActive = selectedSize === size.id;
              return (
                <button
                  key={size.id}
                  onClick={() => handleSizeClick(size.id)}
                  title={size.tooltip}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] relative transition-all cursor-pointer ${
                    isActive
                      ? "border-orange-500 bg-orange-50/50 text-orange-600 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="w-6 h-6 mb-1 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                    <ImageIcon size={14} />
                  </div>
                  <span className="truncate max-w-full">{size.label}</span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                      <Check size={8} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showVisaPopup && (
            <div className="absolute left-0 top-[85px] w-full max-w-[300px] bg-white border-2 border-orange-400 rounded-2xl shadow-xl p-4 z-50">
              <h4 className="text-xs font-semibold text-gray-800 mb-3">
                Visa Photo Size
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {visaSizesList.map((vItem, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedVisaSize(vItem.label);
                      setSelectedSize("Visa");
                      setShowVisaPopup(false);
                      if (isDualMode) exitDualMode();
                    }}
                    className={`py-2 px-1 text-[11px] rounded-lg border text-center transition-all cursor-pointer ${
                      selectedVisaSize === vItem.label &&
                      selectedSize === "Visa"
                        ? "border-orange-500 bg-orange-50 text-orange-600 font-medium"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {vItem.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BACKGROUND SECTION */}
        <div className="mb-6 relative" ref={colorPickerRef}>
          <div className="text-xs text-gray-500 mb-2">BACKGROUND</div>
          <div className="grid grid-cols-4 gap-2">
            {backgroundColors.map((bg, idx) => {
              const isSelected = selectedBg === idx;
              if (bg.type === "custom") {
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedBg(idx);
                      setShowColorPicker((prev) => !prev);
                    }}
                    style={{ backgroundColor: customBgColor }}
                    className={`h-9 rounded-xl relative flex items-center justify-center transition-transform hover:scale-105 shadow-inner cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-orange-500 ring-offset-2"
                        : "border border-gray-200"
                    }`}
                  >
                    <Palette size={16} className="text-white drop-shadow-md" />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                        <Check size={8} />
                      </span>
                    )}
                  </button>
                );
              }
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedBg(idx);
                    setShowColorPicker(false);
                  }}
                  className={`h-9 rounded-xl ${bg.className || ""} relative flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                    isSelected ? "ring-2 ring-orange-500 ring-offset-2" : ""
                  }`}
                >
                  {isSelected && (
                    <span className="absolute bg-orange-500 text-white rounded-full p-0.5">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showColorPicker && (
            <div className="absolute left-0 top-[90px] w-full max-w-[260px] bg-white border-2 border-orange-400 rounded-2xl shadow-xl p-4 z-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-gray-800">
                  Custom Background Color
                </span>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-700 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CLOTHING STYLE SECTION */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>CLOTHING STYLE</span>
            <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">
              14/14
            </span>
          </div>
          {!isDualMode ? (
            <div className="grid grid-cols-5 gap-2">
              {[...Array(10)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedClothing(idx)}
                  className={`h-11 rounded-xl border flex items-center justify-center relative bg-gray-50 cursor-pointer transition-all hover:bg-gray-100 ${
                    selectedClothing === idx
                      ? "border-orange-500 ring-1 ring-orange-500 bg-orange-50/20"
                      : "border-gray-200"
                  }`}
                >
                  <User
                    size={18}
                    className={
                      selectedClothing === idx
                        ? "text-orange-500"
                        : "text-gray-400"
                    }
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium text-gray-600 mb-1.5">
                  Left Person
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(10)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLeftClothing(idx)}
                      className={`h-10 rounded-xl border flex items-center justify-center relative bg-gray-50 cursor-pointer transition-all hover:bg-gray-100 ${
                        leftClothing === idx
                          ? "border-orange-500 ring-1 ring-orange-500 bg-orange-50/20"
                          : "border-gray-200"
                      }`}
                    >
                      <User
                        size={16}
                        className={
                          leftClothing === idx
                            ? "text-orange-500"
                            : "text-gray-400"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-600 mb-1.5">
                  Right Person
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(10)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRightClothing(idx)}
                      className={`h-10 rounded-xl border flex items-center justify-center relative bg-gray-50 cursor-pointer transition-all hover:bg-gray-100 ${
                        rightClothing === idx
                          ? "border-orange-500 ring-1 ring-orange-500 bg-orange-50/20"
                          : "border-gray-200"
                      }`}
                    >
                      <User
                        size={16}
                        className={
                          rightClothing === idx
                            ? "text-orange-500"
                            : "text-gray-400"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* EXTRA EDITING GUIDE */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>EXTRA EDITING GUIDE</span>
            <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">
              7/22
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
            {[
              "Glow & Makeup",
              "Smooth Skin",
              "Brighten Image",
              "Studio Lighting",
              "Straighten Head",
              "Keep Marks",
              "Lipstick",
              "Custom Instruction",
            ].map((item, idx) => (
              <button
                key={idx}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-gray-200 text-[9px] text-center text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Sparkles size={14} className="mb-1 text-gray-400" />
                <span className="leading-tight">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GENERATE PHOTO BUTTON AT THE BOTTOM */}
      <div className="pt-2 mt-auto">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full font-medium py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 ${
            isGenerating
              ? "bg-amber-400 text-white cursor-not-allowed opacity-90"
              : "bg-[#f59e0b] hover:bg-[#d97706] text-white cursor-pointer active:scale-[0.98]"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating Photo...</span>
            </>
          ) : (
            <span>Generate Photo</span>
          )}
        </button>
      </div>
    </div>
  );
}
