"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  Star,
  Share,
  Upload,
  ChevronDown,
  Sparkles,
  Ban,
  Camera,
  Footprints,
  Video,
  VolumeX,
  PhoneOff,
  Flame,
  AlertTriangle,
  HeartPulse,
  LogOut,
  Power,
  Dog,
  Trash2,
  Megaphone,
  Bell,
  Droplet,
  Clock,
  RefreshCw,
  Home,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  Check,
  ShieldAlert,
  Car,
  Wifi,
  Users,
  Compass,
  ArrowRight,
  Sliders,
  X,
  Image as ImageIcon,
  Layers,
} from "lucide-react";

// Presets with mini icon indicators
const presetNotices = [
  { label: "No smoking", icon: "🚫", text: "এখানে ধূমপান করা সম্পূর্ণ নিষেধ" },
  {
    label: "No photography",
    icon: "🚫",
    text: "এখানে ছবি তোলা সম্পূর্ণ নিষেধ",
  },
  {
    label: "Shoes off",
    icon: "🚫",
    text: "অনুগ্ৰহ করে জুতা খুলে ভেতরে প্রবেশ করুন",
  },
  { label: "Trash here", icon: "🚮", text: "নির্দিষ্ট স্থানে ময়লা ফেলুন" },
  {
    label: "Phone silent",
    icon: "📵",
    text: "আপনার মোবাইল ফোনটি বন্ধ বা সাইলেন্ট রাখুন",
  },
  {
    label: "CCTV Area",
    icon: "📹",
    text: "সমগ্র এলাকা সিসিটিভি ক্যামেরার আওতাভুক্ত",
  },
];

// Pictograms list matching screenshot icons
const pictograms = [
  { id: "auto", name: "Auto", icon: Sparkles, isAuto: true },
  { id: "no-smoking", name: "No Smoking", icon: Ban },
  { id: "no-camera", name: "No Photo", icon: Camera },
  { id: "no-entry", name: "No Entry", icon: ShieldAlert },
  { id: "no-parking", name: "No Parking", icon: Car },
  { id: "shoes-off", name: "Shoes Off", icon: Footprints },
  { id: "cctv", name: "CCTV", icon: Video },
  { id: "no-sound", name: "Quiet", icon: VolumeX },
  { id: "no-phone", name: "No Phone", icon: PhoneOff },
  { id: "trash", name: "Trash", icon: Trash2 },
  { id: "no-horn", name: "No Horn", icon: VolumeX },
  { id: "no-food", name: "No Food", icon: Ban },
  { id: "warning", name: "Danger", icon: AlertTriangle },
  { id: "medical", name: "First Aid", icon: HeartPulse },
  { id: "exit", name: "Exit", icon: LogOut },
  { id: "power", name: "Power", icon: Power },
  { id: "fire", name: "Fire", icon: Flame },
  { id: "wifi", name: "WiFi", icon: Wifi },
  { id: "toilet", name: "Toilet", icon: Users },
  { id: "no-pets", name: "No Pets", icon: Dog },
  { id: "hand-wash", name: "Wash Hands", icon: Droplet },
  { id: "arrow", name: "Direction", icon: ArrowRight },
  { id: "time", name: "Time", icon: Clock },
];

// Frames data (33 border variations)
const frames = Array.from({ length: 33 }).map((_, i) => ({
  id: `frame-${i + 1}`,
  borderClass:
    i === 0
      ? "border-2 border-gray-900"
      : i === 1
        ? "border-4 border-gray-900"
        : i === 2
          ? "border-8 border-gray-900"
          : i === 3
            ? "border-4 border-double border-gray-900"
            : i === 4
              ? "border-4 border-dashed border-gray-900"
              : i === 5
                ? "border-2 border-gray-900 rounded-xl"
                : i === 6
                  ? "border-4 border-gray-900 rounded-2xl"
                  : i === 7
                    ? "border-8 border-gray-900 rounded-3xl"
                    : i === 8
                      ? "border-[6px] border-gray-900 p-1 outline outline-2 outline-gray-900"
                      : i === 9
                        ? "border-y-8 border-x-2 border-gray-900"
                        : i === 10
                          ? "border-x-8 border-y-2 border-gray-900"
                          : i === 11
                            ? "border-4 border-gray-900 rounded-tl-3xl rounded-br-3xl"
                            : i === 12
                              ? "border-4 border-gray-900 rounded-tr-3xl rounded-bl-3xl"
                              : "border-2 border-gray-800",
}));

// Related tools at bottom
const relatedTools = [
  {
    title: "Image Size Reducer",
    description:
      "Shrink JPG, PNG, and WebP photos in your browser — quality stays sharp.",
    href: "/sohoj-tools/image-resize",
    icon: ImageIcon,
  },
  {
    title: "NID to PDF",
    description:
      "Turn NID card front and back photos into a clean A4 PDF — all in your browser.",
    href: "/sohoj-tools/nid-to-pdf",
    icon: FileText,
  },
  {
    title: "Remove Background",
    description:
      "Erase portrait, product, or logo backgrounds in your browser — download a transparent PNG.",
    href: "/sohoj-tools/remove-bg",
    icon: Layers,
  },
];

type LineEmphasisType = "even" | "first-small" | "last-small" | "first-big";
type PaperFormatType = "a4-wide" | "a4-tall" | "square" | "16-9";

export default function NoticeGenerator() {
  const router = useRouter();
  const [noticeText, setNoticeText] = useState("");
  const [selectedFrame, setSelectedFrame] = useState(31);
  const [selectedPictogram, setSelectedPictogram] = useState("auto");
  const [customPictogramUrl, setCustomPictogramUrl] = useState<string | null>(
    null,
  );
  const [autoLineBreaks, setAutoLineBreaks] = useState(true);
  const [pictogramPosition, setPictogramPosition] = useState<
    "left" | "right" | "top" | "bottom" | "none"
  >("right");
  const [pictogramSize, setPictogramSize] = useState<
    "small" | "medium" | "large"
  >("medium");
  const [lineEmphasis, setLineEmphasis] = useState<LineEmphasisType>("even");
  const [font, setFont] = useState("Hind Siliguri");
  const [textSize, setTextSize] = useState(100);
  const [textColor, setTextColor] = useState("#000000");
  const [paperFormat, setPaperFormat] = useState<PaperFormatType>("a4-wide");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMorePresets, setShowMorePresets] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customFrameInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setNoticeText("");
  };

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomPictogramUrl(url);
      setSelectedPictogram("custom");
    }
  };

  const getSelectedIconComponent = () => {
    const found = pictograms.find((p) => p.id === selectedPictogram);
    return found ? found.icon : Ban;
  };

  const SelectedIcon = getSelectedIconComponent();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full text-gray-800 font-sans pb-16 bg-[#F8F7F5] min-h-screen">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #notice-preview-canvas,
          #notice-preview-canvas * {
            visibility: visible !important;
          }
          #notice-preview-canvas {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 2rem !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="max-w-[1280px] mx-auto px-4 pt-4 space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            {/* Breadcrumb with Back Button */}
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1"
                title="Go back"
              >
                <ArrowLeft size={16} />
              </button>
              <Link href="/sohoj-tools" className="hover:text-gray-700">
                Sohoj Tools
              </Link>
              <span>/</span>
              <span className="hover:text-gray-700 cursor-pointer">
                Image Tools
              </span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">
                Notice Generator
              </span>
            </div>

            {/* Title & Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold shadow-xs">
                <FileText size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Notice Generator
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Make a printable Bangla notice or sign in seconds — pick a frame,
              type the text, and the right pictogram is chosen for you.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-amber-500 hover:border-amber-300 transition-all shadow-2xs"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-amber-400 text-amber-400" : ""}
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs">
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CONTROLS */}
          <div className="lg:col-span-7 space-y-4 print:hidden">
            {/* 1. Notice Text */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Notice text
              </span>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {presetNotices.slice(0, 3).map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNoticeText(preset.text)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-amber-400 text-xs font-medium text-gray-700 transition-all bg-white flex items-center gap-1.5 shadow-2xs hover:bg-amber-50/30"
                  >
                    <span className="text-xs">{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}

                <div className="relative">
                  <button
                    onClick={() => setShowMorePresets(!showMorePresets)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1 bg-white shadow-2xs"
                  >
                    <span>More notices</span>
                    <ChevronDown size={14} />
                  </button>

                  {showMorePresets && (
                    <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-1.5 space-y-1">
                      {presetNotices.slice(3).map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setNoticeText(preset.text);
                            setShowMorePresets(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors flex items-center gap-2"
                        >
                          <span>{preset.icon}</span>
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                rows={3}
                placeholder={"e.g.\nদয়া করে\nজুতা খুলে ভেতরে প্রবেশ করুন"}
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-gray-400 placeholder:text-xs leading-relaxed"
              />
            </div>

            {/* 2. Frame */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Frame
              </span>

              <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                {frames.map((frame, idx) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(idx)}
                    className={`aspect-[4/3] rounded-lg flex items-center justify-center p-1 border transition-all ${
                      selectedFrame === idx
                        ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-full h-full rounded-2xs ${frame.borderClass}`}
                    />
                  </button>
                ))}

                {/* Upload Custom Frame */}
                <input
                  type="file"
                  ref={customFrameInputRef}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => customFrameInputRef.current?.click()}
                  className="aspect-[4/3] rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-amber-600 hover:border-amber-400 transition-all bg-gray-50/50"
                >
                  <Upload size={12} />
                  <span className="text-[8px] font-bold mt-0.5">Upload</span>
                </button>
              </div>
            </div>

            {/* 3. Pictogram */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Pictogram
              </span>

              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {pictograms.map((pic) => {
                  const IconComp = pic.icon;
                  const isSelected = selectedPictogram === pic.id;
                  return (
                    <button
                      key={pic.id}
                      onClick={() => {
                        setSelectedPictogram(pic.id);
                        setCustomPictogramUrl(null);
                      }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all border ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/60 text-amber-600 ring-1 ring-amber-500"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white hover:bg-gray-50/50"
                      }`}
                      title={pic.name}
                    >
                      {pic.isAuto ? (
                        <div className="flex flex-col items-center justify-center">
                          <Sparkles
                            size={14}
                            className="text-amber-500 fill-amber-400"
                          />
                          <span className="text-[9px] font-bold text-amber-600 mt-0.5">
                            Auto
                          </span>
                        </div>
                      ) : (
                        <IconComp
                          size={18}
                          className={
                            pic.id.startsWith("no-")
                              ? "text-red-600"
                              : "text-gray-800"
                          }
                        />
                      )}
                    </button>
                  );
                })}

                {/* Upload Custom Icon */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomIconUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center transition-all ${
                    selectedPictogram === "custom"
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-gray-300 text-gray-400 hover:border-amber-400 hover:text-amber-600 bg-white"
                  }`}
                >
                  <Upload size={14} />
                  <span className="text-[8px] font-bold mt-0.5">Upload</span>
                </button>
              </div>
            </div>

            {/* 4. Layout */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Layout
              </span>

              {/* Auto Line Breaks Switch */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Auto line breaks
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Balances the lines and picks how many the notice needs.
                  </span>
                </div>
                <button
                  onClick={() => setAutoLineBreaks(!autoLineBreaks)}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors ${
                    autoLineBreaks ? "bg-amber-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoLineBreaks ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Pictogram position */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-500">
                  Pictogram position
                </label>
                <div className="grid grid-cols-5 bg-gray-100/80 p-1 rounded-xl gap-1">
                  {[
                    { id: "left", label: "Left" },
                    { id: "right", label: "Right" },
                    { id: "top", label: "Top" },
                    { id: "bottom", label: "Bottom" },
                    { id: "none", label: "None" },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => setPictogramPosition(pos.id as any)}
                      className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        pictogramPosition === pos.id
                          ? "bg-white text-amber-600 shadow-xs font-bold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div className="w-4 h-2 border border-current rounded-2xs flex items-center justify-center">
                        <div className={`w-1 h-1 bg-current rounded-full`} />
                      </div>
                      <span>{pos.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pictogram size */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-500">
                  Pictogram size
                </label>
                <div className="grid grid-cols-3 bg-gray-100/80 p-1 rounded-xl gap-1">
                  {[
                    { id: "small", label: "Small", size: "w-2.5 h-2.5" },
                    { id: "medium", label: "Medium", size: "w-3.5 h-3.5" },
                    { id: "large", label: "Large", size: "w-4.5 h-4.5" },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setPictogramSize(sz.id as any)}
                      className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        pictogramSize === sz.id
                          ? "bg-white text-amber-600 shadow-xs font-bold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div className={`${sz.size} bg-current rounded-2xs`} />
                      <span>{sz.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Line emphasis */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-500">
                  Line emphasis
                </label>
                <div className="grid grid-cols-4 bg-gray-100/80 p-1 rounded-xl gap-1">
                  {[
                    { id: "even", label: "Even" },
                    { id: "first-small", label: "1st small" },
                    { id: "last-small", label: "Last small" },
                    { id: "first-big", label: "1st big" },
                  ].map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() =>
                        setLineEmphasis(emp.id as LineEmphasisType)
                      }
                      className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        lineEmphasis === emp.id
                          ? "bg-white text-amber-600 shadow-xs font-bold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 w-4 items-center">
                        <div className="w-full h-0.5 bg-current rounded-full" />
                        <div className="w-full h-0.5 bg-current rounded-full" />
                      </div>
                      <span>{emp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Style */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <span className="text-xs font-bold text-gray-900 tracking-wide uppercase block">
                Style
              </span>

              {/* Font */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500">
                  Font
                </label>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Hind Siliguri">Hind Siliguri</option>
                  <option value="Kalpurush">Kalpurush</option>
                  <option value="SolaimanLipi">SolaimanLipi</option>
                  <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                </select>
              </div>

              {/* Text Size */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-gray-500">Text size</label>
                  <span className="font-bold text-gray-700">{textSize}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                />
              </div>

              {/* Colour */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-500">
                  Colour
                </label>
                <div className="flex items-center gap-2.5">
                  {[
                    { hex: "#000000", name: "Black" },
                    { hex: "#1e3a8a", name: "Navy" },
                    { hex: "#dc2626", name: "Red" },
                    { hex: "#16a34a", name: "Green" },
                    { hex: "#ca8a04", name: "Yellow" },
                    { hex: "#111827", name: "Dark" },
                  ].map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setTextColor(color.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        textColor === color.hex
                          ? "scale-110 border-amber-500 ring-2 ring-amber-500/30"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                  <button className="w-6 h-6 rounded-full border border-gray-200 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500" />
                </div>
              </div>

              {/* Paper */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-500">
                  Paper
                </label>
                <div className="grid grid-cols-4 bg-gray-100/80 p-1 rounded-xl gap-1">
                  {[
                    { id: "a4-wide", label: "A4 wide", icon: "w-4 h-2.5" },
                    { id: "a4-tall", label: "A4 tall", icon: "w-2.5 h-4" },
                    { id: "square", label: "Square", icon: "w-3 h-3" },
                    { id: "16-9", label: "16:9", icon: "w-4 h-2" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPaperFormat(p.id as PaperFormatType)}
                      className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        paperFormat === p.id
                          ? "bg-white text-amber-600 shadow-xs font-bold ring-1 ring-amber-400"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div
                        className={`${p.icon} border border-current rounded-2xs`}
                      />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE PREVIEW & DOWNLOAD */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between print:hidden">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Live preview
                </span>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Empty</span>
                </button>
              </div>

              {/* Notice Canvas */}
              <div
                id="notice-preview-canvas"
                ref={previewRef}
                className={`w-full bg-[#FDFCFB] rounded-2xl border border-gray-200 flex flex-col items-center justify-center p-6 text-center relative transition-all overflow-hidden ${
                  paperFormat === "a4-wide"
                    ? "aspect-[1.414/1]"
                    : paperFormat === "a4-tall"
                      ? "aspect-[1/1.414]"
                      : paperFormat === "square"
                        ? "aspect-square"
                        : "aspect-[16/9]"
                }`}
              >
                {!noticeText ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 print:hidden">
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                      <FileText size={22} />
                    </div>
                    <span className="text-xs font-bold text-gray-900 mt-1">
                      Type your notice to preview
                    </span>
                    <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed text-center">
                      Pick a ready-made notice or start typing — the preview
                      updates as you type.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`w-full h-full p-4 flex flex-col justify-center items-center ${frames[selectedFrame].borderClass}`}
                  >
                    <div
                      className={`flex items-center justify-center gap-4 w-full h-full ${
                        pictogramPosition === "top"
                          ? "flex-col"
                          : pictogramPosition === "bottom"
                            ? "flex-col-reverse"
                            : pictogramPosition === "left"
                              ? "flex-row"
                              : pictogramPosition === "right"
                                ? "flex-row-reverse"
                                : "flex-col"
                      }`}
                    >
                      {/* Pictogram */}
                      {pictogramPosition !== "none" && (
                        <div
                          className={`flex items-center justify-center text-amber-600 shrink-0 ${
                            pictogramSize === "small"
                              ? "p-2"
                              : pictogramSize === "medium"
                                ? "p-3"
                                : "p-5"
                          }`}
                        >
                          {selectedPictogram === "custom" &&
                          customPictogramUrl ? (
                            <img
                              src={customPictogramUrl}
                              alt="Custom pictogram"
                              className={`object-contain ${
                                pictogramSize === "small"
                                  ? "w-8 h-8"
                                  : pictogramSize === "medium"
                                    ? "w-12 h-12"
                                    : "w-16 h-16"
                              }`}
                            />
                          ) : (
                            <SelectedIcon
                              size={
                                pictogramSize === "small"
                                  ? 36
                                  : pictogramSize === "medium"
                                    ? 52
                                    : 70
                              }
                            />
                          )}
                        </div>
                      )}

                      {/* Text */}
                      <div
                        className="font-bold text-center leading-snug whitespace-pre-wrap break-words"
                        style={{
                          color: textColor,
                          fontFamily: font,
                          fontSize: `${(textSize / 100) * 1.25}rem`,
                        }}
                      >
                        {noticeText}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1 print:hidden">
                <button
                  onClick={handlePrint}
                  className="w-full bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-gray-200/60"
                >
                  <Printer size={15} />
                  <span>Print</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Download size={15} />
                  <span>Download notice</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-8 space-y-3 print:hidden">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Tools in the same category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={idx}
                  href={tool.href}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
