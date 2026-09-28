// app/bulk-photo-edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import {
  Upload,
  Plus,
  Sparkles,
  Smile,
  Palette,
  Lightbulb,
  Shirt,
  LayoutGrid,
  RotateCcw,
  Award,
  Check,
  X,
  Wand2,
  Eraser,
  Moon,
  Eye,
  Sliders,
  Scissors,
  Sun,
  Droplet,
  Layers,
} from "lucide-react";

export default function BulkPhotoEditPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [images, setImages] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("Face Enhance");
  const [activeTab, setActiveTab] = useState<string>("Style");

  // সাব-টুলস সিলেকশন স্টেট
  const [selectedSubTools, setSelectedSubTools] = useState<{
    [key: string]: string[];
  }>({
    "Face Enhance": [],
    "Photo Color": [],
    "Photo Light": [],
    "Dress Style": [],
    "Photo Background": [],
    "Old Photo to New": [],
    "Studio Image": [],
  });

  useEffect(() => {
    try {
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
    } catch (error) {
      console.error("Auth check error:", error);
      setLoading(false);
    }
  }, []);

  const stylePresets = [
    {
      id: "face-enhance",
      name: "Face Enhance",
      toolsCount: "8 tools",
      icon: <Smile className="w-6 h-6 text-[#2563EB]" />,
    },
    {
      id: "photo-color",
      name: "Photo Color",
      toolsCount: "7 tools",
      icon: <Palette className="w-6 h-6 text-[#2563EB]" />,
    },
    {
      id: "photo-light",
      name: "Photo Light",
      toolsCount: "5 tools",
      icon: <Lightbulb className="w-6 h-6 text-[#2563EB]" />,
    },
    {
      id: "dress-style",
      name: "Dress Style",
      toolsCount: "4 tools",
      icon: <Shirt className="w-6 h-6 text-[#2563EB]" />,
    },
    {
      id: "photo-background",
      name: "Photo Background",
      toolsCount: "5 tools",
      icon: <LayoutGrid className="w-6 h-6 text-[#2563EB]" />,
    },
    {
      id: "old-photo-to-new",
      name: "Old Photo to New",
      toolsCount: "4 tools",
      icon: <RotateCcw className="w-6 h-6 text-[#2563EB]" />,
    },
    {
      id: "studio-image",
      name: "Studio Image",
      toolsCount: "3 tools",
      icon: <Award className="w-6 h-6 text-[#2563EB]" />,
    },
  ];

  const subToolsMap: {
    [key: string]: { name: string; icon: React.ReactNode }[];
  } = {
    "Face Enhance": [
      {
        name: "Skin Smoothing",
        icon: <Wand2 className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Blemish / Spot Removal",
        icon: <Eraser className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Dark Circle Fix",
        icon: <Moon className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Teeth Whitening",
        icon: <Smile className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Eye Brighten",
        icon: <Eye className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Wrinkle Softening",
        icon: <Sliders className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Light Makeup",
        icon: <Palette className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Hair Tidy",
        icon: <Scissors className="w-5 h-5 text-[#2563EB]" />,
      },
    ],
    "Photo Color": [
      {
        name: "Auto Color",
        icon: <Palette className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Saturation",
        icon: <Droplet className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Vibrance",
        icon: <Sparkles className="w-5 h-5 text-[#2563EB]" />,
      },
      { name: "Temperature", icon: <Sun className="w-5 h-5 text-[#2563EB]" /> },
    ],
    "Photo Light": [
      { name: "Brightness", icon: <Sun className="w-5 h-5 text-[#2563EB]" /> },
      {
        name: "Highlights",
        icon: <Lightbulb className="w-5 h-5 text-[#2563EB]" />,
      },
      { name: "Shadows", icon: <Moon className="w-5 h-5 text-[#2563EB]" /> },
    ],
    "Dress Style": [
      {
        name: "Color Change",
        icon: <Shirt className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Pattern Swap",
        icon: <Layers className="w-5 h-5 text-[#2563EB]" />,
      },
    ],
    "Photo Background": [
      {
        name: "Remove Bg",
        icon: <Eraser className="w-5 h-5 text-[#2563EB]" />,
      },
      { name: "Blur Bg", icon: <Eye className="w-5 h-5 text-[#2563EB]" /> },
    ],
    "Old Photo to New": [
      {
        name: "Scratch Repair",
        icon: <Wand2 className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "Color Restore",
        icon: <Palette className="w-5 h-5 text-[#2563EB]" />,
      },
    ],
    "Studio Image": [
      {
        name: "Studio Light",
        icon: <Sun className="w-5 h-5 text-[#2563EB]" />,
      },
      {
        name: "HDR Effect",
        icon: <Sparkles className="w-5 h-5 text-[#2563EB]" />,
      },
    ],
  };

  const currentTools = subToolsMap[selectedPreset] || [];
  const activeCurrentSubTools = selectedSubTools[selectedPreset] || [];

  // সাব-টুল টগল করার ফাংশন
  const toggleSubTool = (toolName: string) => {
    const current = selectedSubTools[selectedPreset] || [];
    if (current.includes(toolName)) {
      setSelectedSubTools({
        ...selectedSubTools,
        [selectedPreset]: current.filter((t) => t !== toolName),
      });
    } else {
      setSelectedSubTools({
        ...selectedSubTools,
        [selectedPreset]: [...current, toolName],
      });
    }
  };

  // ক্লিয়ার করা
  const clearSubTools = () => {
    setSelectedSubTools({
      ...selectedSubTools,
      [selectedPreset]: [],
    });
  };

  // লোডিং স্পিনার
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#0F172A]/60">
            যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans select-none">
      {/* Dashboard Navbar */}
      <DashboardNavbar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* 1. Left Sidebar (Add photos box) */}
        <div className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-[#E2E8F0] p-4 shrink-0">
          <div className="border border-dashed border-[#2563EB]/40 hover:border-[#2563EB] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition h-40 w-full bg-[#F8FAFC] shadow-xs group">
            <div className="w-10 h-10 rounded-full bg-[#E2E8F0] text-[#2563EB] flex items-center justify-center font-bold mb-2 shadow-inner group-hover:bg-[#2563EB] group-hover:text-white transition">
              <Plus size={20} />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">Add photos</span>
          </div>
        </div>

        {/* 2. Middle Main Workspace */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-auto">
          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-3xl w-full max-w-lg h-[460px] flex flex-col items-center justify-center p-8 text-center relative">
            <div className="w-12 h-12 bg-[#F8FAFC] rounded-full flex items-center justify-center text-[#2563EB] mb-3 border border-[#E2E8F0] shadow-xs">
              <Upload size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">
              Add photos
            </h3>

            {/* Ctrl+U Shortcut Pill */}
            <div className="mt-2 border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 rounded-md text-[10px] font-mono text-[#0F172A]/60 shadow-2xs">
              Ctrl+U
            </div>
          </div>
        </div>

        {/* 3. Right Style Presets Panel */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-[#E2E8F0] p-4 flex flex-col justify-between shrink-0 shadow-sm overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-[#0F172A] tracking-wider uppercase">
                Style presets
              </h4>
            </div>

            {/* Top Toggle Tabs (Style / Style options - Dynamic) */}
            <div className="grid grid-cols-2 bg-[#E2E8F0] p-1 rounded-xl mb-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab("Style")}
                className={`py-1.5 rounded-lg transition ${activeTab === "Style" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#0F172A]/60 hover:text-[#0F172A]"}`}
              >
                Style
              </button>
              <button
                onClick={() => setActiveTab("Options")}
                className={`py-1.5 rounded-lg transition text-[11px] truncate px-1 ${activeTab === "Options" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#0F172A]/60 hover:text-[#0F172A]"}`}
              >
                Style options · {selectedPreset}
              </button>
            </div>

            {/* Conditional Rendering based on activeTab */}
            {activeTab === "Style" ? (
              /* Presets Grid */
              <div className="grid grid-cols-2 gap-2.5">
                {stylePresets.map((preset) => {
                  const isSelected = selectedPreset === preset.name;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.name)}
                      className={`relative rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition border h-28 bg-white ${
                        isSelected
                          ? "border-[#2563EB] ring-1 ring-[#2563EB] shadow-sm bg-[#2563EB]/5"
                          : "border-[#E2E8F0] hover:border-[#2563EB]/50"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#2563EB] text-white rounded-full flex items-center justify-center shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}

                      <div className="mb-2 p-2 rounded-xl bg-[#F8FAFC]">
                        {preset.icon}
                      </div>
                      <span className="text-[#0F172A] text-xs font-bold text-center leading-tight mb-0.5">
                        {preset.name}
                      </span>
                      <span className="text-[#0F172A]/50 text-[10px] font-medium">
                        {preset.toolsCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Style Options Sub-Tools Grid */
              <div>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {currentTools.map((tool, idx) => {
                    const isChecked = activeCurrentSubTools.includes(tool.name);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleSubTool(tool.name)}
                        className={`relative rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition border h-28 bg-white ${
                          isChecked
                            ? "border-[#2563EB] ring-1 ring-[#2563EB] shadow-xs bg-[#2563EB]/5"
                            : "border-[#E2E8F0] hover:border-[#2563EB]/50"
                        }`}
                      >
                        {/* Checkbox box on top-left */}
                        <div
                          className={`absolute top-2.5 left-2.5 w-4 h-4 rounded-md border flex items-center justify-center transition ${
                            isChecked
                              ? "bg-[#2563EB] border-[#2563EB] text-white"
                              : "border-[#E2E8F0] bg-white"
                          }`}
                        >
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>

                        <div className="mb-2 p-2 rounded-xl bg-[#F8FAFC] mt-1">
                          {tool.icon}
                        </div>
                        <span className="text-[#0F172A] text-[11px] font-bold text-center leading-tight">
                          {tool.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Clear and Use Buttons Row */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={clearSubTools}
                    className="flex-1 py-2 px-3 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <X size={14} /> Clear
                  </button>
                  <button
                    onClick={() => setActiveTab("Style")}
                    className="flex-1 py-2 px-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Check size={14} /> Use ({activeCurrentSubTools.length})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Enhance Button */}
          <div className="mt-6">
            <button className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer">
              <Sparkles size={16} className="text-white" /> Enhance{" "}
              {images.length} photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
