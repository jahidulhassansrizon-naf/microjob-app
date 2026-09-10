"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  QrCode,
  Upload,
  Check,
  X,
  RefreshCw,
  Ban,
  Settings,
  Sun,
  Smile,
  Sliders,
  RotateCw,
  Eye,
  Edit3,
  Printer,
  Download,
  ArrowLeft,
} from "lucide-react";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

// ==========================================
// 🎨 SVG Clothing Components (14 Dresses + None)
// ==========================================

const FormalShirtSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 22,28 L 36,16 L 64,16 L 78,28 L 86,90 L 14,90 Z"
      fill={color}
      stroke="#1e293b"
      strokeWidth="1.2"
    />
    <path
      d="M 36,16 L 50,28 L 64,16 L 50,88 Z"
      fill="#f8fafc"
      stroke="#cbd5e1"
      strokeWidth="1"
    />
    <circle cx="50" cy="38" r="1.5" fill="#334155" />
    <circle cx="50" cy="52" r="1.5" fill="#334155" />
    <circle cx="50" cy="66" r="1.5" fill="#334155" />
    <circle cx="50" cy="80" r="1.5" fill="#334155" />
  </svg>
);

const PoloTshirtSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 18,30 L 35,16 L 65,16 L 82,30 L 76,88 L 24,88 Z"
      fill={color}
      stroke="#1e1e1e"
      strokeWidth="1.2"
    />
    <path d="M 35,16 L 50,28 L 65,16 L 58,13 L 42,13 Z" fill="#1e293b" />
    <path d="M 44,28 L 56,28 L 56,52 L 44,52 Z" fill="#0f172a" />
  </svg>
);

const SuitRedTieSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path d="M 38,14 L 62,14 L 50,55 Z" fill="#ffffff" />
    <path d="M 47,20 L 53,20 L 55,48 L 50,58 L 45,48 Z" fill="#dc2626" />
    <path
      d="M 16,28 L 36,14 L 50,52 L 28,90 L 12,90 Z"
      fill={color}
      stroke="#0f172a"
      strokeWidth="1.2"
    />
    <path
      d="M 84,28 L 64,14 L 50,52 L 72,90 L 88,90 Z"
      fill={color}
      stroke="#0f172a"
      strokeWidth="1.2"
    />
  </svg>
);

const SuitOpenSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path d="M 35,14 L 65,14 L 50,65 Z" fill="#93c5fd" />
    <path
      d="M 16,28 L 35,14 L 50,58 L 28,90 L 12,90 Z"
      fill={color}
      stroke="#0f172a"
      strokeWidth="1.2"
    />
    <path
      d="M 84,28 L 65,14 L 50,58 L 72,90 L 88,90 Z"
      fill={color}
      stroke="#0f172a"
      strokeWidth="1.2"
    />
  </svg>
);

const SareeRedSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path d="M 28,26 L 38,18 L 42,32 L 28,38 Z" fill="#1e293b" />
    <path d="M 26,38 L 88,38 L 92,92 L 22,92 Z" fill={color} />
    <path
      d="M 30,22 L 72,26 L 88,92 L 52,92 Z"
      fill={color}
      filter="brightness(0.92)"
    />
    <path
      d="M 30,22 L 72,26 L 68,34 L 28,28 Z"
      fill="#fcd34d"
      stroke="#f59e0b"
      strokeWidth="0.8"
    />
    <path
      d="M 52,82 L 88,82 L 88,92 L 52,92 Z"
      fill="#fcd34d"
      stroke="#f59e0b"
      strokeWidth="0.8"
    />
  </svg>
);

const HijabRedPatternSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 30,12 Q 50,4 70,12 Q 85,30 80,70 L 75,92 L 25,92 L 20,70 Q 15,30 30,12 Z"
      fill="#18181b"
    />
    <ellipse cx="50" cy="30" rx="14" ry="18" fill="#f8fafc" />
    <path
      d="M 22,35 Q 50,55 78,35 Q 85,75 75,92 L 25,92 Q 15,75 22,35 Z"
      fill={color}
    />
  </svg>
);

const KurtaSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 24,24 L 38,14 L 62,14 L 76,24 L 72,92 L 28,92 Z"
      fill={color}
      stroke="#cbd5e1"
      strokeWidth="1.2"
    />
    <path
      d="M 46,17 L 54,17 L 54,58 L 46,58 Z"
      fill="#ffffff"
      stroke="#e2e8f0"
      strokeWidth="1"
    />
  </svg>
);

const RedKurtiSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 25,30 L 38,18 Q 50,24 62,18 L 75,30 L 68,48 L 62,42 L 72,90 L 28,90 L 38,42 L 32,48 Z"
      fill={color}
      stroke="#991b1b"
      strokeWidth="1"
    />
  </svg>
);

const CasualTshirtSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 20,30 L 34,18 Q 50,24 66,18 L 80,30 L 72,48 L 65,42 L 65,88 L 35,88 L 35,42 L 28,48 Z"
      fill={color}
      stroke="#1d4ed8"
      strokeWidth="1"
    />
  </svg>
);

const LightBlueHijabSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 28,14 Q 50,6 72,14 Q 86,30 82,75 L 75,92 L 25,92 L 18,75 Q 14,30 28,14 Z"
      fill={color}
      stroke="#0284c7"
      strokeWidth="1"
    />
    <ellipse cx="50" cy="30" rx="14" ry="18" fill="#f8fafc" />
  </svg>
);

const SareeHijabSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 18,52 L 32,40 L 68,40 L 82,52 L 85,92 L 15,92 Z"
      fill={color || "#374151"}
    />
    <ellipse cx="50" cy="27" rx="11" ry="14" fill="#ffffff" />
  </svg>
);

const PurpleSalwarSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="27" rx="12" ry="15" fill="#ffffff" />
    <path
      d="M 20,52 L 32,36 L 68,36 L 80,52 L 82,90 L 18,90 Z"
      fill={color || "#3b82f6"}
    />
  </svg>
);

const BlueSareeSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path d="M 22,35 L 34,18 L 66,18 L 78,35 L 82,90 L 18,90 Z" fill={color} />
  </svg>
);

const BlueJacketSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path
      d="M 28,24 Q 50,20 72,24 L 70,78 Q 50,81 30,78 Z"
      fill={color || "#93C5FD"}
      stroke="#60a5fa"
      strokeWidth="0.8"
    />
  </svg>
);

const clothingItems = [
  { id: "none", name: "None", component: null },
  {
    id: "white_shirt",
    name: "shirt",
    component: FormalShirtSVG,
    defaultColor: "#FFFFFF",
  },
  {
    id: "polo_brown",
    name: "Polo T shirt",
    component: PoloTshirtSVG,
    defaultColor: "#78350F",
  },
  {
    id: "suit_red_tie",
    name: "Suit",
    component: SuitRedTieSVG,
    defaultColor: "#1E293B",
  },
  {
    id: "suit_open",
    name: "suit(No Tie)",
    component: SuitOpenSVG,
    defaultColor: "#1E293B",
  },
  {
    id: "saree_red",
    name: "saree",
    component: SareeRedSVG,
    defaultColor: "#B91C1C",
  },
  {
    id: "hijab_pattern",
    name: "hijab",
    component: HijabRedPatternSVG,
    defaultColor: "#18181B",
  },
  {
    id: "kurta_white",
    name: "panjabi",
    component: KurtaSVG,
    defaultColor: "#FFFFFF",
  },
  {
    id: "kurti_red",
    name: "Tops",
    component: RedKurtiSVG,
    defaultColor: "#B91C1C",
  },
  {
    id: "tshirt_blue",
    name: "round collar T shirt",
    component: CasualTshirtSVG,
    defaultColor: "#2563EB",
  },
  {
    id: "hijab_lightblue",
    name: "Kameez+Hijab",
    component: LightBlueHijabSVG,
    defaultColor: "#38BDF8",
  },
  {
    id: "saree_hijab",
    name: "Saree+Hijab",
    component: SareeHijabSVG,
    defaultColor: "#1F2937",
  },
  {
    id: "purple_salwar",
    name: "orna+kameez",
    component: PurpleSalwarSVG,
    defaultColor: "#2563EB",
  },
  {
    id: "saree_blue",
    name: "design sharee",
    component: BlueSareeSVG,
    defaultColor: "#1D4ED8",
  },
  {
    id: "jacket_blue",
    name: "jacket",
    component: BlueJacketSVG,
    defaultColor: "#93C5FD",
  },
];

const COLOR_PALETTE = [
  { hex: "#FFFFFF", name: "White", border: true },
  { hex: "#18181B", name: "Black" },
  { hex: "#EF4444", name: "Red" },
  { hex: "#3B82F6", name: "Blue" },
  { hex: "#22C55E", name: "Green" },
  { hex: "#1E3A8A", name: "Navy" },
  { hex: "#6B7280", name: "Gray" },
  { hex: "#78350F", name: "Brown" },
  { hex: "#FACC15", name: "Yellow" },
  { hex: "#E11D48", name: "Pink" },
  { hex: "#9333EA", name: "Purple" },
  { hex: "#F97316", name: "Orange" },
  { hex: "#881337", name: "Maroon" },
  { hex: "#0D9488", name: "Teal" },
  { hex: "#0EA5E9", name: "Sky Blue" },
  { hex: "#65A30D", name: "Olive" },
];

const VISA_SIZES = [
  "2×2 inch",
  "35×45 mm",
  "40×60 mm",
  "40×50 mm",
  "40×40 mm",
  "50×50 mm",
  "50×70 mm",
  "33×48 mm",
  "35×50 mm",
  "36×47 mm",
  "38×48 mm",
  "50×60 mm",
];

export default function AIEditorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedSize, setSelectedSize] = useState<string>("passport");
  const [selectedVisaSize, setSelectedVisaSize] = useState<string>("35×45 mm");
  const [visaDropdownOpen, setVisaDropdownOpen] = useState<boolean>(false);

  const [selectedBg, setSelectedBg] = useState<string>("orange");

  const [selectedClothing, setSelectedClothing] =
    useState<string>("polo_brown");
  const [leftClothing, setLeftClothing] = useState<string>("none");
  const [rightClothing, setRightClothing] = useState<string>("none");

  const [clothingColors, setClothingColors] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      clothingItems.forEach((item) => {
        if (item.defaultColor) initial[item.id] = item.defaultColor;
      });
      return initial;
    },
  );

  const [colorPickerOpen, setColorPickerOpen] = useState<boolean>(false);

  const [selectedGuides, setSelectedGuides] = useState<string[]>([
    "Glow & Makeup",
    "Smooth Skin",
    "Brighten Image",
    "Studio Lighting",
    "Straighten Head",
    "Keep Marks",
    "Lipstick",
    "Custom Instruction",
  ]);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [leftImage, setLeftImage] = useState<string | null>(null);
  const [rightImage, setRightImage] = useState<string | null>(null);

  // 🤖 AI Generation States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // 🖼️ Recent Generations State
  const [recentGenerations, setRecentGenerations] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const leftFileInputRef = useRef<HTMLInputElement | null>(null);
  const rightFileInputRef = useRef<HTMLInputElement | null>(null);
  const visaRef = useRef<HTMLDivElement | null>(null);

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

  // Click outside to close visa dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visaRef.current && !visaRef.current.contains(event.target as Node)) {
        setVisaDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "single" | "left" | "right",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "single") setUploadedImage(reader.result as string);
        if (type === "left") setLeftImage(reader.result as string);
        if (type === "right") setRightImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorSelect = (hex: string) => {
    const activeTarget =
      selectedSize === "dual" ? leftClothing : selectedClothing;
    setClothingColors((prev) => ({
      ...prev,
      [activeTarget]: hex,
    }));
  };

  // 🚀 Python মুক্ত মডিফাইড ফাংশন (সরাসরি আপলোড করা ছবি বা ফেক প্রসেসিং ব্যবহার করা হবে)
  const handleGeneratePhoto = async () => {
    if (!uploadedImage && selectedSize !== "dual") {
      alert("Please upload a photo first!");
      return;
    }
    if (selectedSize === "dual" && (!leftImage || !rightImage)) {
      alert("Please upload both left and right photos!");
      return;
    }

    setIsGenerating(true);

    try {
      // পাইথন সার্ভার বা ব্যাকএন্ড কল বাদ দিয়ে সরাসরি আপলোড করা ছবি ব্যবহার করা হচ্ছে
      const processedImageUrl = uploadedImage;

      // ইউজারকে প্রসেসিং ফিল দেওয়ার জন্য ১ সেকেন্ডের ছোট ডিলে
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setGeneratedImage(processedImageUrl);

      if (processedImageUrl) {
        setRecentGenerations((prev) => [processedImageUrl, ...prev]);
      }
    } catch (error: any) {
      console.error("Photo generation error:", error);
      alert(error.message || "Something went wrong!");
    } finally {
      setIsGenerating(false);
    }
  };

  const bgMap: Record<string, string> = {
    orange: "bg-amber-500",
    blue1: "bg-blue-500",
    blue2: "bg-sky-400",
    gray: "bg-gray-400",
    blue3: "bg-blue-600",
    green: "bg-teal-700",
    cream: "bg-amber-100",
    custom: "bg-gradient-to-tr from-purple-600 to-indigo-500",
  };

  const getCurrentDimensionText = () => {
    if (selectedSize === "passport") return "45×55 mm";
    if (selectedSize === "dual") return "Dual Image (2 Persons)";
    if (selectedSize === "epass") return "25×30 mm";
    if (selectedSize === "visa") return selectedVisaSize;
    if (selectedSize === "birth") return "Birth Certificate Photo";
    return "";
  };

  const getAspectRatio = () => {
    if (selectedSize === "passport") return 45 / 55;
    if (selectedSize === "epass") return 25 / 30;
    if (selectedSize === "visa") {
      const match = selectedVisaSize.match(/(\d+)[x×](\d+)/);
      if (match) {
        return parseInt(match[1]) / parseInt(match[2]);
      }
    }
    return 45 / 55;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FF5D00] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-gray-500">
            Checking Authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <DashboardNavbar />

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleImageUpload(e, "single")}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={leftFileInputRef}
        onChange={(e) => handleImageUpload(e, "left")}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={rightFileInputRef}
        onChange={(e) => handleImageUpload(e, "right")}
        accept="image/*"
        className="hidden"
      />

      <div className="max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col gap-6 shadow-xs overflow-y-auto lg:max-h-[85vh]">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles size={18} className="text-orange-500" />
            <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
              Generation settings
            </h2>
          </div>

          {/* Photo Size */}
          <div className="flex flex-col gap-3 relative">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Photo Size
            </span>
            <div className="grid grid-cols-5 gap-2">
              {[
                {
                  id: "passport",
                  label: "Passport",
                  icon: "🪪",
                  tooltip: "BD Passport/MRP (45x55mm)",
                },
                {
                  id: "dual",
                  label: "Dual",
                  icon: "👥",
                  tooltip: "Dual Image (2 Persons)",
                },
                {
                  id: "epass",
                  label: "E-Pass",
                  icon: "🆔",
                  tooltip: "BD E-Passport (25x30mm)",
                },
                {
                  id: "visa",
                  label: "Visa",
                  icon: "✈️",
                  tooltip: "Visa Photo Style",
                },
                {
                  id: "birth",
                  label: "Birth",
                  icon: "📄",
                  tooltip: "Birth Registration Photo",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="relative group flex flex-col items-center"
                >
                  <button
                    onClick={() => {
                      setSelectedSize(item.id);
                      if (item.id === "visa") {
                        setVisaDropdownOpen(true);
                      } else {
                        setVisaDropdownOpen(false);
                      }
                    }}
                    className={`w-full flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold transition relative cursor-pointer ${
                      selectedSize === item.id
                        ? "border-orange-500 bg-orange-50/20 text-gray-900 shadow-xs"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-base mb-1">{item.icon}</span>
                    {item.label}
                    {selectedSize === item.id && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                        <Check size={8} />
                      </span>
                    )}
                  </button>

                  {item.id !== "visa" && (
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                      <div className="bg-gray-900 text-white text-[9px] font-medium py-1 px-2 rounded-md shadow-lg whitespace-nowrap">
                        {item.tooltip}
                      </div>
                      <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {visaDropdownOpen && (
              <div
                ref={visaRef}
                className="absolute top-24 left-0 w-full bg-white border border-orange-400 rounded-2xl p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900">
                    Visa Photo Size
                  </span>
                  <button
                    onClick={() => setVisaDropdownOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {VISA_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedVisaSize(size);
                        setVisaDropdownOpen(false);
                      }}
                      className={`text-[10px] font-bold py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                        selectedVisaSize === size
                          ? "bg-orange-50 border-orange-500 text-orange-600 shadow-2xs"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Background */}
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Background
            </span>
            <div className="grid grid-cols-6 gap-2">
              {[
                {
                  id: "orange",
                  color: "bg-amber-500 border-2 border-orange-600",
                },
                { id: "blue1", color: "bg-blue-500" },
                { id: "blue2", color: "bg-sky-400" },
                { id: "gray", color: "bg-gray-400" },
                { id: "blue3", color: "bg-blue-600" },
                { id: "green", color: "bg-teal-700" },
                { id: "cream", color: "bg-amber-100" },
                {
                  id: "custom",
                  color:
                    "bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-[10px]",
                },
              ].map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg.id)}
                  className={`h-9 rounded-xl ${bg.color} transition relative shadow-2xs hover:scale-105 flex items-center justify-center cursor-pointer`}
                >
                  {bg.id === "custom" && <span className="text-xs">🎨</span>}
                  {selectedBg === bg.id && bg.id !== "custom" && (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <Check size={12} className="drop-shadow" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Clothing Style */}
          {selectedSize === "dual" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      Left Person
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {clothingItems.map((item) => {
                    const isSelected = leftClothing === item.id;
                    const activeColor =
                      clothingColors[item.id] || item.defaultColor || "#3B82F6";
                    const SVGComponent = item.component;

                    return (
                      <button
                        key={item.id}
                        title={item.name}
                        onClick={() => {
                          setLeftClothing(item.id);
                          if (item.id !== "none") setColorPickerOpen(true);
                        }}
                        className={`h-11 w-full border rounded-xl flex items-center justify-center relative overflow-hidden transition cursor-pointer p-1 ${
                          isSelected
                            ? "border-amber-500 border-2 bg-amber-50/30 ring-2 ring-amber-500/20 shadow-xs"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {item.id === "none" ? (
                          <Ban size={16} className="text-gray-400" />
                        ) : SVGComponent ? (
                          <SVGComponent color={activeColor} />
                        ) : null}
                        {isSelected && (
                          <span className="absolute bottom-0.5 right-0.5 bg-amber-500 text-white rounded-full p-0.5 shadow-xs">
                            <Check size={8} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      Right Person
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {clothingItems.map((item) => {
                    const isSelected = rightClothing === item.id;
                    const activeColor =
                      clothingColors[item.id] || item.defaultColor || "#3B82F6";
                    const SVGComponent = item.component;

                    return (
                      <button
                        key={item.id}
                        title={item.name}
                        onClick={() => {
                          setRightClothing(item.id);
                          if (item.id !== "none") setColorPickerOpen(true);
                        }}
                        className={`h-11 w-full border rounded-xl flex items-center justify-center relative overflow-hidden transition cursor-pointer p-1 ${
                          isSelected
                            ? "border-amber-500 border-2 bg-amber-50/30 ring-2 ring-amber-500/20 shadow-xs"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {item.id === "none" ? (
                          <Ban size={16} className="text-gray-400" />
                        ) : SVGComponent ? (
                          <SVGComponent color={activeColor} />
                        ) : null}
                        {isSelected && (
                          <span className="absolute bottom-0.5 right-0.5 bg-amber-500 text-white rounded-full p-0.5 shadow-xs">
                            <Check size={8} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Clothing Style
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {clothingItems.findIndex((c) => c.id === selectedClothing) ||
                    1}
                  /14 ⚙️
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {clothingItems.map((item) => {
                  const isSelected = selectedClothing === item.id;
                  const activeColor =
                    clothingColors[item.id] || item.defaultColor || "#3B82F6";
                  const SVGComponent = item.component;

                  return (
                    <button
                      key={item.id}
                      title={item.name}
                      onClick={() => {
                        setSelectedClothing(item.id);
                        if (item.id !== "none") setColorPickerOpen(true);
                        else setColorPickerOpen(false);
                      }}
                      className={`h-12 w-full border rounded-xl flex items-center justify-center relative overflow-hidden transition cursor-pointer p-1 ${
                        isSelected
                          ? "border-amber-500 border-2 bg-amber-50/30 ring-2 ring-amber-500/20 shadow-xs"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {item.id === "none" ? (
                        <Ban size={18} className="text-gray-400" />
                      ) : SVGComponent ? (
                        <SVGComponent color={activeColor} />
                      ) : null}

                      {isSelected && (
                        <span className="absolute bottom-0.5 right-0.5 bg-amber-500 text-white rounded-full p-0.5 shadow-xs">
                          <Check size={8} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {colorPickerOpen && selectedClothing !== "none" && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-3 shadow-2xs transition-all mt-1">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 mb-2.5">
                    <span className="text-[11px] font-bold text-gray-800">
                      Color Palette
                    </span>
                    <button
                      onClick={() => setColorPickerOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-amber-100 cursor-pointer transition"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-8 gap-1.5">
                    {COLOR_PALETTE.map((c) => {
                      const isSelectedColor =
                        (clothingColors[selectedClothing] ||
                          clothingItems[1].defaultColor) === c.hex;
                      return (
                        <button
                          key={c.hex}
                          onClick={() => handleColorSelect(c.hex)}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                          className={`w-6 h-6 rounded-full transition-all cursor-pointer relative flex items-center justify-center hover:scale-110 shadow-2xs ${
                            c.border ? "border border-gray-300" : ""
                          } ${isSelectedColor ? "ring-2 ring-amber-500 ring-offset-1 scale-105" : ""}`}
                        >
                          {isSelectedColor && (
                            <Check
                              size={10}
                              strokeWidth={3}
                              className={
                                c.hex === "#FFFFFF" || c.hex === "#FACC15"
                                  ? "text-gray-900"
                                  : "text-white"
                              }
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extra Editing Guide */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
                <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                  EXTRA EDITING GUIDE
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <span className="text-[10px] text-gray-600 font-bold">
                  {selectedGuides.length}/22
                </span>
                <Settings size={12} className="text-amber-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Glow & Makeup", icon: Sparkles },
                { label: "Smooth Skin", icon: Smile },
                { label: "Brighten Image", icon: Sun },
                { label: "Studio Lighting", icon: Sliders },
                { label: "Straighten Head", icon: RotateCw },
                { label: "Keep Marks", icon: Eye },
                { label: "Lipstick", icon: Sparkles },
                { label: "Custom Instruction", icon: Edit3 },
              ].map((item) => {
                const isActive = selectedGuides.includes(item.label);
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() =>
                      setSelectedGuides((prev) =>
                        prev.includes(item.label)
                          ? prev.filter((i) => i !== item.label)
                          : [...prev, item.label],
                      )
                    }
                    className={`p-2.5 border rounded-xl flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition ${
                      isActive
                        ? "bg-white border-blue-400 text-gray-900 shadow-xs ring-1 ring-blue-400/30"
                        : "bg-gray-50/60 border-gray-200 text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <IconComponent
                      size={18}
                      className={isActive ? "text-blue-500" : "text-gray-300"}
                    />
                    <span
                      className={`text-[10px] font-semibold leading-tight ${
                        isActive ? "text-gray-800" : "text-gray-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🔥 GENERATE PHOTO BUTTON */}
          <button
            onClick={handleGeneratePhoto}
            disabled={
              isGenerating || (!uploadedImage && selectedSize !== "dual")
            }
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Generating Photo...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Photo</span>
              </>
            )}
          </button>
        </div>

        {/* Center Workspace & Recent Generations */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-[#181C2E] border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center relative min-h-[450px] lg:min-h-[550px] shadow-lg overflow-hidden flex-1">
            {/* AI Generation Loading View */}
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center my-auto">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-white text-lg font-bold">
                    Generating AI Photo...
                  </h3>
                  <p className="text-gray-400 text-xs">
                    Applying custom clothing, background & enhancements
                  </p>
                </div>
              </div>
            ) : generatedImage ? (
              /* 📸 Generated Output View */
              <div className="flex flex-col items-center justify-center gap-4 w-full h-full relative my-auto">
                <div className="relative w-full max-w-lg h-[75vh] flex items-center justify-center">
                  <img
                    src={generatedImage}
                    alt="AI Generated Result"
                    className="w-full h-full object-contain rounded-xl shadow-2xl"
                  />
                </div>

                {/* Bottom Action Controls */}
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <button
                    onClick={() => setGeneratedImage(null)}
                    className="bg-gray-800/90 hover:bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <ArrowLeft size={12} /> Edit
                  </button>
                  <a
                    href={generatedImage}
                    download="ai-passport-photo.jpg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Download size={12} /> Download
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="bg-sky-500 hover:bg-sky-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Printer size={12} /> Print
                  </button>
                </div>
              </div>
            ) : selectedSize === "dual" ? (
              <div className="flex flex-col items-center justify-center gap-6 w-full my-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  <div
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 bg-[#1E2337]/50 relative transition ${
                      leftImage
                        ? "border-solid border-gray-700"
                        : "border-gray-600/80"
                    }`}
                  >
                    <button
                      onClick={() => setLeftImage(null)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs cursor-pointer shadow"
                    >
                      <X size={12} />
                    </button>

                    {!leftImage ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                          <Upload size={20} className="text-gray-300" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-white text-sm font-bold">
                            Upload left photo
                          </h3>
                          <p className="text-gray-400 text-[10px]">
                            Click to select a photo
                          </p>
                        </div>
                        <button
                          onClick={() => leftFileInputRef.current?.click()}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload size={12} /> Upload Photo
                        </button>
                      </>
                    ) : (
                      <div
                        className={`w-40 h-52 rounded-xl p-1.5 ${bgMap[selectedBg]} flex items-center justify-center shadow-xl`}
                      >
                        <img
                          src={leftImage}
                          alt="Left"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 bg-[#1E2337]/50 relative transition ${
                      rightImage
                        ? "border-solid border-gray-700"
                        : "border-gray-600/80"
                    }`}
                  >
                    <button
                      onClick={() => setRightImage(null)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs cursor-pointer shadow"
                    >
                      <X size={12} />
                    </button>

                    {!rightImage ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                          <Upload size={20} className="text-gray-300" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-white text-sm font-bold">
                            Upload right photo
                          </h3>
                          <p className="text-gray-400 text-[10px]">
                            Click to select a photo
                          </p>
                        </div>
                        <button
                          onClick={() => rightFileInputRef.current?.click()}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload size={12} /> Upload Photo
                        </button>
                      </>
                    ) : (
                      <div
                        className={`w-40 h-52 rounded-xl p-1.5 ${bgMap[selectedBg]} flex items-center justify-center shadow-xl`}
                      >
                        <img
                          src={rightImage}
                          alt="Right"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSize("passport")}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-4 py-2 rounded-xl border border-red-500/30 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <X size={14} /> Exit dual mode
                </button>
              </div>
            ) : !uploadedImage ? (
              <div className="max-w-md w-full border-2 border-dashed border-gray-600/80 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-4 bg-[#1E2337]/50 my-auto">
                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                  <Upload size={24} className="text-gray-300" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-white text-base font-bold">
                    Upload a Photo
                  </h3>
                  <p className="text-gray-400 text-xs">
                    Click or scan QR code to upload from your phone
                  </p>
                  <span className="text-amber-400 font-semibold text-[11px]">
                    ({getCurrentDimensionText()})
                  </span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload size={14} /> Upload Photo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 my-auto relative">
                <div
                  className={`h-80 rounded-2xl p-2 flex items-center justify-center ${
                    bgMap[selectedBg] || "bg-amber-500"
                  } shadow-2xl relative overflow-hidden transition-all duration-300 border-2 border-white/20 max-w-[90vw]`}
                  style={{ aspectRatio: getAspectRatio() }}
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded-xl border border-gray-700 flex items-center gap-2 cursor-pointer transition"
                  >
                    <RefreshCw size={12} /> Change Photo
                  </button>
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-3 py-2 rounded-xl border border-red-500/30 flex items-center gap-1 cursor-pointer transition"
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 🕒 RECENT GENERATIONS SECTION */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              RECENT GENERATIONS
            </h3>

            {recentGenerations.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No recent photos generated yet.
              </p>
            ) : (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {recentGenerations.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setGeneratedImage(imgUrl)}
                    className="w-20 h-24 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-amber-500 flex-shrink-0 cursor-pointer transition shadow-xs hover:scale-105"
                  >
                    <img
                      src={imgUrl}
                      alt={`Generation ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col gap-4">
            <div className="bg-[#181C2E] text-white p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-lg text-amber-400">
                  <QrCode size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Scan Now</h4>
                  <p className="text-[10px] text-gray-400">Scan QR Code</p>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#181C2E] hover:bg-gray-900 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer">
              <QrCode size={14} /> Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
