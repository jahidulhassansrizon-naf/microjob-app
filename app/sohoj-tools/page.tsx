"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import {
  Search,
  LayoutGrid,
  Star,
  FileText,
  Image as ImageIcon,
  Type,
  Video,
  Wrench,
  GraduationCap,
  Briefcase,
  Minimize2,
  Combine,
  FilePlus,
  FileCode,
  FileImage,
  Lock,
  RotateCw,
  Trash2,
  Stamp,
  FileSearch,
  ShieldCheck,
  Maximize2,
  Crop,
  FileSpreadsheet,
  Edit3,
  CreditCard,
  Wand2,
  BookOpen,
  Sparkles,
  QrCode,
  Layers,
  Barcode,
  Pipette,
  PenTool,
  FileSignature,
  Palette,
  Film,
  Languages,
  Keyboard,
  Hash,
  AlignLeft,
  Calendar,
  Scissors,
  Music,
  Volume2,
  Gauge,
  VolumeX,
  MapPin,
  Calculator,
  Coins,
  Scan,
  FileUser,
  UserCheck,
  Loader2,
} from "lucide-react";

interface ToolItem {
  id: string;
  name: string;
  category: "PDF" | "Image" | "Text" | "Video" | "General" | "Educational";
  bgColor: string;
  icon: any;
  badge?: "New" | "Hot";
}

const toolsData: ToolItem[] = [
  // Row 1
  {
    id: "1",
    name: "Form auto fillup",
    category: "General",
    bgColor: "bg-[#7ce422]",
    icon: Briefcase,
    badge: "New",
  },
  {
    id: "2",
    name: "Education Board Result",
    category: "Educational",
    bgColor: "bg-[#10ca7e]",
    icon: GraduationCap,
  },
  {
    id: "3",
    name: "Compress PDF",
    category: "PDF",
    bgColor: "bg-[#1cc2e6]",
    icon: Minimize2,
    badge: "Hot",
  },
  {
    id: "4",
    name: "Merge PDFs",
    category: "PDF",
    bgColor: "bg-[#0eb2ed]",
    icon: Combine,
    badge: "Hot",
  },
  {
    id: "5",
    name: "Create PDF",
    category: "PDF",
    bgColor: "bg-[#1c78e6]",
    icon: FilePlus,
    badge: "Hot",
  },
  {
    id: "6",
    name: "Split PDF",
    category: "PDF",
    bgColor: "bg-[#2563eb]",
    icon: FileCode,
  },

  // Row 2
  {
    id: "7",
    name: "PDF to Image",
    category: "PDF",
    bgColor: "bg-[#3b82f6]",
    icon: FileImage,
  },
  {
    id: "8",
    name: "Lock / Unlock PDF",
    category: "PDF",
    bgColor: "bg-[#4338ca]",
    icon: Lock,
  },
  {
    id: "9",
    name: "Rotate PDF",
    category: "PDF",
    bgColor: "bg-[#6366f1]",
    icon: RotateCw,
  },
  {
    id: "10",
    name: "Remove Pages",
    category: "PDF",
    bgColor: "bg-[#8b5cf6]",
    icon: Trash2,
  },
  {
    id: "11",
    name: "PDF Watermark",
    category: "PDF",
    bgColor: "bg-[#a855f7]",
    icon: Stamp,
  },
  {
    id: "12",
    name: "Extract Images",
    category: "PDF",
    bgColor: "bg-[#c026d3]",
    icon: FileSearch,
  },

  // Row 3
  {
    id: "13",
    name: "PDF Permissions",
    category: "PDF",
    bgColor: "bg-[#d946ef]",
    icon: ShieldCheck,
  },
  {
    id: "14",
    name: "Resize PDF",
    category: "PDF",
    bgColor: "bg-[#e11d48]",
    icon: Maximize2,
  },
  {
    id: "15",
    name: "PDF Crop",
    category: "PDF",
    bgColor: "bg-[#f43f5e]",
    icon: Crop,
  },
  {
    id: "16",
    name: "PDF to Excel",
    category: "PDF",
    bgColor: "bg-[#e11d48]",
    icon: FileSpreadsheet,
  },
  {
    id: "17",
    name: "PDF Repair",
    category: "PDF",
    bgColor: "bg-[#dc2626]",
    icon: Wrench,
  },
  {
    id: "18",
    name: "Edit PDF",
    category: "PDF",
    bgColor: "bg-[#ea580c]",
    icon: Edit3,
    badge: "New",
  },

  // Row 4
  {
    id: "19",
    name: "Image Size Reducer",
    category: "Image",
    bgColor: "bg-[#4ade80]",
    icon: ImageIcon,
    badge: "New",
  },
  {
    id: "20",
    name: "NID to PDF",
    category: "General",
    bgColor: "bg-[#22c55e]",
    icon: CreditCard,
    badge: "Hot",
  },
  {
    id: "21",
    name: "Remove Background",
    category: "Image",
    bgColor: "bg-[#16a34a]",
    icon: Wand2,
    badge: "Hot",
  },
  {
    id: "22",
    name: "Passport to PDF",
    category: "General",
    bgColor: "bg-[#10b981]",
    icon: BookOpen,
    badge: "Hot",
  },
  {
    id: "23",
    name: "Document Cleanup",
    category: "General",
    bgColor: "bg-[#14b8a6]",
    icon: Sparkles,
  },
  {
    id: "24",
    name: "QR Code Generator",
    category: "General",
    bgColor: "bg-[#06b6d4]",
    icon: QrCode,
    badge: "Hot",
  },

  // Row 5
  {
    id: "25",
    name: "Image Resize",
    category: "Image",
    bgColor: "bg-[#0284c7]",
    icon: Maximize2,
  },
  {
    id: "26",
    name: "Crop Image",
    category: "Image",
    bgColor: "bg-[#0369a1]",
    icon: Crop,
  },
  {
    id: "27",
    name: "Images to PDF",
    category: "Image",
    bgColor: "bg-[#2563eb]",
    icon: FileImage,
  },
  {
    id: "28",
    name: "Add Watermark",
    category: "Image",
    bgColor: "bg-[#1d4ed8]",
    icon: Stamp,
  },
  {
    id: "29",
    name: "Flatten Image",
    category: "Image",
    bgColor: "bg-[#1e40af]",
    icon: Layers,
  },
  {
    id: "30",
    name: "Barcode Generator",
    category: "General",
    bgColor: "bg-[#3b82f6]",
    icon: Barcode,
    badge: "New",
  },

  // Row 6
  {
    id: "31",
    name: "Color Picker",
    category: "Image",
    bgColor: "bg-[#4338ca]",
    icon: Pipette,
  },
  {
    id: "32",
    name: "Digital Signature Pad",
    category: "General",
    bgColor: "bg-[#4f46e5]",
    icon: PenTool,
    badge: "New",
  },
  {
    id: "33",
    name: "Text Signature Generator",
    category: "General",
    bgColor: "bg-[#6366f1]",
    icon: FileSignature,
    badge: "New",
  },
  {
    id: "34",
    name: "Logo Color Changer",
    category: "Image",
    bgColor: "bg-[#7c3aed]",
    icon: Palette,
  },
  {
    id: "35",
    name: "Compress GIF",
    category: "Image",
    bgColor: "bg-[#8b5cf6]",
    icon: Film,
    badge: "Hot",
  },
  {
    id: "36",
    name: "Image Convert",
    category: "Image",
    bgColor: "bg-[#a855f7]",
    icon: ImageIcon,
    badge: "Hot",
  },

  // Row 7
  {
    id: "37",
    name: "Image Upscaler",
    category: "Image",
    bgColor: "bg-[#c026d3]",
    icon: Sparkles,
  },
  {
    id: "38",
    name: "Bijoy - Unicode",
    category: "Text",
    bgColor: "bg-[#a3e635]",
    icon: Languages,
  },
  {
    id: "39",
    name: "Banglish Typing",
    category: "Text",
    bgColor: "bg-[#84cc16]",
    icon: Keyboard,
  },
  {
    id: "40",
    name: "Number to Words",
    category: "Text",
    bgColor: "bg-[#22c55e]",
    icon: Hash,
  },
  {
    id: "41",
    name: "Image to Text",
    category: "Text",
    bgColor: "bg-[#14b8a6]",
    icon: AlignLeft,
    badge: "New",
  },
  {
    id: "42",
    name: "Text Analyzer",
    category: "Text",
    bgColor: "bg-[#0284c7]",
    icon: FileText,
  },

  // Row 8
  {
    id: "43",
    name: "Date Format Converter",
    category: "General",
    bgColor: "bg-[#4f46e5]",
    icon: Calendar,
  },
  {
    id: "44",
    name: "Compress Video",
    category: "Video",
    bgColor: "bg-[#7c3aed]",
    icon: Video,
  },
  {
    id: "45",
    name: "Trim / Cut Video",
    category: "Video",
    bgColor: "bg-[#a855f7]",
    icon: Scissors,
  },
  {
    id: "46",
    name: "Merge Videos",
    category: "Video",
    bgColor: "bg-[#e11d48]",
    icon: Film,
  },
  {
    id: "47",
    name: "Video to Audio",
    category: "Video",
    bgColor: "bg-[#ea580c]",
    icon: Music,
  },
  {
    id: "48",
    name: "Add Watermark",
    category: "Video",
    bgColor: "bg-[#d97706]",
    icon: Stamp,
  },

  // Row 9
  {
    id: "49",
    name: "Audio Volume Booster/Reducer",
    category: "Video",
    bgColor: "bg-[#ca8a04]",
    icon: Volume2,
  },
  {
    id: "50",
    name: "Change Speed",
    category: "Video",
    bgColor: "bg-[#84cc16]",
    icon: Gauge,
  },
  {
    id: "51",
    name: "Video to GIF",
    category: "Video",
    bgColor: "bg-[#22c55e]",
    icon: Film,
  },
  {
    id: "52",
    name: "Rotate / Flip",
    category: "Video",
    bgColor: "bg-[#10b981]",
    icon: RotateCw,
  },
  {
    id: "53",
    name: "Remove Audio",
    category: "Video",
    bgColor: "bg-[#14b8a6]",
    icon: VolumeX,
  },
  {
    id: "54",
    name: "Family Card Form",
    category: "General",
    bgColor: "bg-[#2563eb]",
    icon: CreditCard,
  },

  // Row 10
  {
    id: "55",
    name: "Voter Migration Form",
    category: "General",
    bgColor: "bg-[#4f46e5]",
    icon: FileText,
    badge: "New",
  },
  {
    id: "56",
    name: "Allowance Application Tracking",
    category: "General",
    bgColor: "bg-[#7c3aed]",
    icon: MapPin,
    badge: "New",
  },
  {
    id: "57",
    name: "Fuel Card Form",
    category: "General",
    bgColor: "bg-[#c026d3]",
    icon: CreditCard,
  },
  {
    id: "58",
    name: "Age Calculator",
    category: "General",
    bgColor: "bg-[#db2777]",
    icon: Calculator,
  },
  {
    id: "59",
    name: "EMI Calculator",
    category: "General",
    bgColor: "bg-[#e11d48]",
    icon: Calculator,
  },
  {
    id: "60",
    name: "BMI Calculator",
    category: "General",
    bgColor: "bg-[#ea580c]",
    icon: Calculator,
  },

  // Row 11
  {
    id: "61",
    name: "Hisabpottro & Stock",
    category: "General",
    bgColor: "bg-[#d97706]",
    icon: Coins,
    badge: "New",
  },
  {
    id: "62",
    name: "Document Scanner",
    category: "General",
    bgColor: "bg-[#84cc16]",
    icon: Scan,
    badge: "New",
  },
  {
    id: "63",
    name: "National University Result",
    category: "Educational",
    bgColor: "bg-[#06b6d4]",
    icon: GraduationCap,
  },
  {
    id: "64",
    name: "ATS Friendly CV Maker",
    category: "General",
    bgColor: "bg-[#2563eb]",
    icon: FileUser,
  },
  {
    id: "65",
    name: "Govt Job Photo & Sign Resizer",
    category: "Image",
    bgColor: "bg-[#7c3aed]",
    icon: UserCheck,
  },
];

const categories = [
  { name: "All", icon: LayoutGrid },
  { name: "Favorites", icon: Star },
  { name: "PDF Tools", icon: FileText },
  { name: "Image Tools", icon: ImageIcon },
  { name: "Text Tools", icon: Type },
  { name: "Video Tools", icon: Video },
  { name: "General Tools", icon: Wrench },
  { name: "Educational Tools", icon: GraduationCap },
];

export default function SohojToolsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState("Free");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Auth Protection Check
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const filteredTools = toolsData.filter((tool) => {
    const matchesSearch = tool.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    switch (selectedCategory) {
      case "PDF Tools":
        return tool.category === "PDF";
      case "Image Tools":
        return tool.category === "Image";
      case "Text Tools":
        return tool.category === "Text";
      case "Video Tools":
        return tool.category === "Video";
      case "General Tools":
        return tool.category === "General";
      case "Educational Tools":
        return tool.category === "Educational";
      default:
        return true;
    }
  });

  // Auth চেক না হওয়া পর্যন্ত লোডিং স্ক্রিন দেখাবে
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs">
          <Loader2 size={16} className="animate-spin text-orange-500" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 font-sans">
      {/* Header Navigation */}
      <DashboardNavbar />

      {/* Main Container */}
      <main className="max-w-[1320px] mx-auto px-4 py-6 space-y-5">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
              <LayoutGrid size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Tools</h1>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  All of these tools are free
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                More than 40 free tools to speed up daily work.
              </p>
            </div>
          </div>

          {/* Free / Paid Switcher Button */}
          <div className="bg-gray-200/80 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("Free")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "Free"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Free Tools •
            </button>
            <button
              onClick={() => setActiveTab("Paid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "Paid"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Paid Tools •
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search tools... e.g. PDF, image, video"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-xs placeholder:text-gray-400"
          />
        </div>

        {/* Category Pills Header */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon
                  size={14}
                  className={isSelected ? "text-white" : "text-gray-500"}
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tools Grid Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-7 pt-3">
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                className="flex flex-col items-center group cursor-pointer"
              >
                {/* Square Card Container with Squircle Corners */}
                <div
                  className={`relative w-full aspect-square rounded-[28px] ${tool.bgColor} flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-xs overflow-hidden`}
                >
                  {/* Badge */}
                  {tool.badge && (
                    <span
                      className={`absolute top-2.5 left-2.5 text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-full shadow-xs ${
                        tool.badge === "New" ? "bg-emerald-600" : "bg-red-500"
                      }`}
                    >
                      {tool.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <IconComponent
                    size={42}
                    className="text-white stroke-[1.75]"
                  />
                </div>

                {/* Tool Title */}
                <span className="mt-2.5 text-xs font-bold text-gray-800 text-center line-clamp-1 group-hover:text-[#FF5D00] transition-colors">
                  {tool.name}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
