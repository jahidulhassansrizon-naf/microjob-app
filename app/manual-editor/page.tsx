"use client";

import { useState, useEffect } from "react";
import {
  QrCode,
  Upload,
  Check,
  X,
  Image as ImageIcon,
  Users,
  Plane,
  Printer,
  Maximize2,
  Palette,
  Sparkles,
  UserCheck,
  Grid,
  FileEdit,
} from "lucide-react";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

export default function ManualEditorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreditBanner, setShowCreditBanner] = useState<boolean>(true);

  const [selectedSize, setSelectedSize] = useState<string>("passport");
  const [selectedBg, setSelectedBg] = useState<string>("white");
  const [selectedAiTool, setSelectedAiTool] = useState<string | null>("face");

  // জেনারেট করা ছবির লিস্ট
  const [generatedPhotos, setGeneratedPhotos] = useState<string[]>([]);

  // 🟢 সিকিউরিটি ও অথেনটিকেশন চেক
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    const token = tokenCookie ? tokenCookie.split("=")[1] : null;

    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie =
        "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

      window.location.href = "/login";
    } else {
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, []);

  // লোডিং স্পিনার
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FF5D00] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-gray-500">
            যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans select-none">
      {/* Dashboard Navbar */}
      <DashboardNavbar />

      {/* Top Credit Warning Banner */}
      {showCreditBanner && (
        <div className="max-w-[1700px] w-full mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                !
              </div>
              <p className="text-xs font-semibold">
                <span className="font-bold">Your credit is running low!</span>{" "}
                Currently you have only <span className="font-bold">0</span>{" "}
                credits left.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-2xs transition cursor-pointer">
                Click here to buy credit &gt;
              </button>
              <button
                onClick={() => setShowCreditBanner(false)}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1700px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 flex-1">
        {/* Top Section: 3 Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar: Photo Size, Background, AI Tools */}
          <div className="lg:col-span-3 bg-white border border-gray-200/80 rounded-3xl p-5 flex flex-col gap-6 shadow-xs overflow-y-auto max-h-[85vh]">
            {/* PHOTO SIZE Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3.5 bg-amber-500 rounded-full"></div>
                <span className="text-xs font-black text-gray-900 tracking-wider uppercase">
                  PHOTO SIZE
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  {
                    id: "passport",
                    label: "Passport",
                    icon: (
                      <div className="relative">
                        <svg
                          className="w-5 h-5 text-amber-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <circle cx="12" cy="10" r="3" />
                          <path d="M7 16c0-1.5 2-2 5-2s5 .5 5 2" />
                        </svg>
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                          <Check size={6} strokeWidth={3} />
                        </span>
                      </div>
                    ),
                  },
                  {
                    id: "dual",
                    label: "Dual",
                    icon: <Users className="w-5 h-5 text-gray-400" />,
                  },
                  {
                    id: "visa",
                    label: "Visa",
                    icon: <Plane className="w-5 h-5 text-gray-400" />,
                  },
                  {
                    id: "rsizes",
                    label: "R Sizes",
                    icon: <Printer className="w-5 h-5 text-gray-400" />,
                  },
                  {
                    id: "freesize",
                    label: "Free size",
                    icon: <Maximize2 className="w-5 h-5 text-gray-400" />,
                  },
                ].map((item) => {
                  const isSelected = selectedSize === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSize(item.id)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border text-[10px] font-bold transition cursor-pointer h-16 ${
                        isSelected
                          ? "border-amber-400 bg-amber-50/20 text-gray-900 shadow-2xs ring-1 ring-amber-400"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="mb-1">{item.icon}</span>
                      <span className="truncate w-full text-center text-[9px] font-bold text-gray-700">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BACKGROUND Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3.5 bg-amber-500 rounded-full"></div>
                <span className="text-xs font-black text-gray-900 tracking-wider uppercase">
                  BACKGROUND
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: "white", bg: "bg-white border border-gray-200" },
                  { id: "blue1", bg: "bg-[#bae6fd]" },
                  { id: "blue2", bg: "bg-[#7dd3fc]" },
                  { id: "gray", bg: "bg-[#d1d5db]" },
                  { id: "periwinkle", bg: "bg-[#c7d2fe]" },
                  { id: "mint", bg: "bg-[#99f6e4]" },
                  { id: "cream", bg: "bg-[#fef9c3]" },
                  {
                    id: "custom",
                    bg: "bg-[#c7d2fe] text-indigo-500 flex items-center justify-center",
                  },
                  {
                    id: "add",
                    bg: "bg-white border border-dashed border-gray-300 text-gray-400 flex items-center justify-center text-lg font-bold",
                  },
                ].map((bg) => {
                  const isSelected = selectedBg === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBg(bg.id)}
                      className={`h-11 rounded-2xl ${bg.bg} transition relative shadow-2xs hover:scale-105 flex items-center justify-center cursor-pointer ${
                        isSelected && bg.id !== "custom" && bg.id !== "add"
                          ? "ring-2 ring-amber-400"
                          : ""
                      }`}
                    >
                      {bg.id === "custom" && (
                        <Palette size={18} className="text-indigo-400" />
                      )}
                      {bg.id === "add" && <span>+</span>}
                      {isSelected && bg.id !== "custom" && bg.id !== "add" && (
                        <span className="absolute inset-0 flex items-center justify-center text-gray-700">
                          <Check
                            size={12}
                            strokeWidth={3}
                            className="drop-shadow"
                          />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI TOOLS Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3.5 bg-amber-500 rounded-full"></div>
                <span className="text-xs font-black text-gray-900 tracking-wider uppercase">
                  AI TOOLS
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    id: "face",
                    label: "AI Face Enhance",
                    icon: <Sparkles className="w-5 h-5 text-gray-400" />,
                  },
                  {
                    id: "object",
                    label: "Object Adjust",
                    icon: <UserCheck className="w-5 h-5 text-gray-400" />,
                  },
                  {
                    id: "transparent",
                    label: "Transparent",
                    icon: <Grid className="w-5 h-5 text-gray-400" />,
                  },
                  {
                    id: "upscale",
                    label: "Upscale",
                    icon: <Maximize2 className="w-5 h-5 text-gray-400" />,
                  },
                ].map((tool) => {
                  const isSelected = selectedAiTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedAiTool(tool.id)}
                      className={`p-2 bg-white border rounded-2xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition h-20 ${
                        isSelected
                          ? "border-amber-400 bg-amber-50/10 shadow-2xs ring-1 ring-amber-400"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="mb-0.5">{tool.icon}</span>
                      <span className="text-[8px] font-bold text-gray-600 leading-tight">
                        {tool.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setSelectedAiTool("cutout")}
                  className={`p-2 bg-white border rounded-2xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition h-20 ${
                    selectedAiTool === "cutout"
                      ? "border-amber-400 bg-amber-50/10 shadow-2xs ring-1 ring-amber-400"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="mb-0.5">
                    <FileEdit className="w-5 h-5 text-gray-400" />
                  </span>
                  <span className="text-[8px] font-bold text-gray-600 leading-tight">
                    Cutout Editor
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Center Workspace / Upload Area (Updated to Slate Grey) */}
          <div className="lg:col-span-6 bg-[#1F242D] border border-gray-700/60 rounded-3xl p-6 flex flex-col items-center justify-center relative min-h-[480px] shadow-lg">
            <div className="max-w-md w-full border-2 border-dashed border-gray-600/70 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 bg-[#282E3B]/60">
              <div className="w-12 h-12 rounded-full bg-gray-800/90 flex items-center justify-center text-gray-300 border border-gray-700 shadow-inner">
                <ImageIcon size={22} className="text-gray-300" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-white text-base font-bold">
                  Upload a Photo
                </h3>
                <p className="text-gray-400 text-xs">
                  Click or scan qr code to upload from your phone
                </p>

                {/* Dimension Pill */}
                <div className="mt-1 inline-flex items-center justify-center self-center px-3 py-1 rounded-full bg-[#1F242D] border border-gray-700 text-[11px] font-semibold text-gray-300 shadow-2xs">
                  45 × 55 mm
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 mt-2 w-full">
                <button className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer">
                  <Upload size={14} /> Upload Photo
                </button>

                {/* Ctrl+U Shortcut Pill */}
                <div className="border border-gray-700 bg-[#1F242D] px-2.5 py-0.5 rounded-md text-[10px] font-mono text-gray-400 shadow-2xs">
                  Ctrl+U
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Scan QR Code (Updated to Slate Grey) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col gap-4">
              <div className="bg-[#1F242D] text-white p-4 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden border border-gray-700/50">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2.5 bg-gray-800/90 rounded-xl text-blue-400 border border-gray-700">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Scan Now</h4>
                    <p className="text-[10px] text-gray-400">Scan QR Code</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-[#1F242D] hover:bg-[#282E3B] text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer border border-gray-700/50">
                <QrCode size={14} /> Scan
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Wide Box: Generated Photos Section (Updated to Slate Grey) */}
        <div className="bg-[#1F242D] border border-gray-700/60 rounded-3xl p-5 flex flex-col gap-4 shadow-lg w-full">
          <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-amber-500 rounded-full"></div>
              <h4 className="text-white text-xs font-bold tracking-wider uppercase">
                Generated Photos
              </h4>
            </div>
            <span className="text-[10px] text-gray-400">
              Recent Output History
            </span>
          </div>

          {/* Generated Photos Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {generatedPhotos.length > 0
              ? generatedPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] bg-[#282E3B] border border-gray-700 rounded-xl overflow-hidden relative shadow-sm"
                  >
                    <img
                      src={photo}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))
              : // Empty state placeholder slots
                Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/4] bg-[#282E3B]/50 border border-dashed border-gray-700/80 rounded-xl flex flex-col items-center justify-center text-gray-500 text-[10px] gap-1"
                  >
                    <ImageIcon size={16} className="text-gray-500" />
                    <span>Empty slot</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
