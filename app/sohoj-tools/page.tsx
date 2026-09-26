"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

import {
  Search,
  LayoutGrid,
  Star,
  FileText,
  Image as ImageIcon,
  Type,
  Wrench,
  GraduationCap,
  Minimize2,
  Combine,
  FileCode,
  FileImage,
  Lock,
  Edit3,
  CreditCard,
  Wand2,
  BookOpen,
  Languages,
  Keyboard,
  AlignLeft,
  MapPin,
  Calculator,
  Scan,
  FileUser,
  UserCheck,
  Crop,
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
  {
    id: "1",
    name: "Nid Joiner",
    category: "General",
    bgColor: "bg-[#22c55e]",
    icon: CreditCard,
    badge: "Hot",
  },
  {
    id: "2",
    name: "Govt Job Photo & Sign Resizer",
    category: "Image",
    bgColor: "bg-[#7c3aed]",
    icon: UserCheck,
  },
  {
    id: "3",
    name: "Education Board Result",
    category: "Educational",
    bgColor: "bg-[#10ca7e]",
    icon: GraduationCap,
  },
  {
    id: "4",
    name: "National University Result",
    category: "Educational",
    bgColor: "bg-[#06b6d4]",
    icon: GraduationCap,
  },
  {
    id: "5",
    name: "Age Calculator",
    category: "General",
    bgColor: "bg-[#db2777]",
    icon: Calculator,
  },
  {
    id: "6",
    name: "Passport to PDF",
    category: "General",
    bgColor: "bg-[#10b981]",
    icon: BookOpen,
    badge: "Hot",
  },
  {
    id: "7",
    name: "Voter Migration Form",
    category: "General",
    bgColor: "bg-[#4f46e5]",
    icon: FileText,
    badge: "New",
  },
  {
    id: "8",
    name: "Family Card Form",
    category: "General",
    bgColor: "bg-[#2563eb]",
    icon: CreditCard,
  },
  {
    id: "9",
    name: "Allowance Application Tracking",
    category: "General",
    bgColor: "bg-[#7c3aed]",
    icon: MapPin,
    badge: "New",
  },
  {
    id: "10",
    name: "Remove Background",
    category: "Image",
    bgColor: "bg-[#16a34a]",
    icon: Wand2,
    badge: "Hot",
  },
  {
    id: "11",
    name: "Document Scanner",
    category: "General",
    bgColor: "bg-[#84cc16]",
    icon: Scan,
    badge: "New",
  },
  {
    id: "12",
    name: "Image Size Reducer",
    category: "Image",
    bgColor: "bg-[#4ade80]",
    icon: ImageIcon,
    badge: "New",
  },
  {
    id: "13",
    name: "Crop Image",
    category: "Image",
    bgColor: "bg-[#0369a1]",
    icon: Crop,
  },
  {
    id: "14",
    name: "Images to PDF",
    category: "Image",
    bgColor: "bg-[#2563eb]",
    icon: FileImage,
  },
  {
    id: "15",
    name: "Image Convert",
    category: "Image",
    bgColor: "bg-[#a855f7]",
    icon: ImageIcon,
    badge: "Hot",
  },
  {
    id: "16",
    name: "Image to Text",
    category: "Text",
    bgColor: "bg-[#14b8a6]",
    icon: AlignLeft,
    badge: "New",
  },
  {
    id: "17",
    name: "Compress PDF",
    category: "PDF",
    bgColor: "bg-[#1cc2e6]",
    icon: Minimize2,
    badge: "Hot",
  },
  {
    id: "18",
    name: "Merge PDFs",
    category: "PDF",
    bgColor: "bg-[#0eb2ed]",
    icon: Combine,
    badge: "Hot",
  },
  {
    id: "19",
    name: "Split PDF",
    category: "PDF",
    bgColor: "bg-[#2563eb]",
    icon: FileCode,
  },
  {
    id: "20",
    name: "Lock / Unlock PDF",
    category: "PDF",
    bgColor: "bg-[#4338ca]",
    icon: Lock,
  },
  {
    id: "21",
    name: "PDF to Image",
    category: "PDF",
    bgColor: "bg-[#3b82f6]",
    icon: FileImage,
  },
  {
    id: "22",
    name: "Edit PDF",
    category: "PDF",
    bgColor: "bg-[#ea580c]",
    icon: Edit3,
    badge: "New",
  },
  {
    id: "23",
    name: "Bijoy - Unicode",
    category: "Text",
    bgColor: "bg-[#a3e635]",
    icon: Languages,
  },
  {
    id: "24",
    name: "Banglish Typing",
    category: "Text",
    bgColor: "bg-[#84cc16]",
    icon: Keyboard,
  },
  {
    id: "25",
    name: "ATS Friendly CV Maker",
    category: "General",
    bgColor: "bg-[#2563eb]",
    icon: FileUser,
  },
];

const categories = [
  { name: "All", icon: LayoutGrid },
  { name: "Favorites", icon: Star },
  { name: "PDF Tools", icon: FileText },
  { name: "Image Tools", icon: ImageIcon },
  { name: "Text Tools", icon: Type },
  { name: "General Tools", icon: Wrench },
  { name: "Educational Tools", icon: GraduationCap },
];

function SohojToolsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("Free");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const isInitialLoadDone = useRef(false);

  // ১. ইনিশিয়াল লোড ও টাইপিং অ্যানিমেশন (শুধু প্রথমবার চলার জন্য)
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      const targetPath = searchFromUrl
        ? `/sohoj-tools?search=${encodeURIComponent(searchFromUrl)}`
        : "/sohoj-tools";
      router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
      return;
    }

    setIsAuthenticated(true);

    // প্রথমবার পেজে আসার পর URL-এ কোনো সার্চ থাকলে অ্যানিমেশন চালাবে
    if (!isInitialLoadDone.current && searchFromUrl) {
      isInitialLoadDone.current = true;
      let currentIndex = 0;
      setSearchQuery("");

      const timer = setInterval(() => {
        if (currentIndex < searchFromUrl.length) {
          setSearchQuery(searchFromUrl.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(timer);
        }
      }, 70);

      return () => clearInterval(timer);
    } else {
      isInitialLoadDone.current = true;
    }
  }, []);

  // ২. টাইপ করলে কোনো ল্যাগ ছাড়াই স্মুথ সার্চ হ্যান্ডলার
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // URL আপডেট (ব্রাউজার রিলোড বা রিকম্পোনেন্ট রেন্ডার রি-ট্রিগার বন্ধ রাখতে)
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    const newQuery = params.toString();
    const newPath = newQuery ? `/sohoj-tools?${newQuery}` : "/sohoj-tools";
    window.history.replaceState(null, "", newPath);
  };

  const getSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

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
      <DashboardNavbar />

      <main className="max-w-[1320px] mx-auto px-4 py-6 space-y-5">
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
                25 free tools to speed up daily work.
              </p>
            </div>
          </div>

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

        {/* Search Bar With Typing Effect */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search tools... e.g. PDF, image, video"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-xs placeholder:text-gray-400 transition-all"
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
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-7 pt-3">
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon;
              const slug = getSlug(tool.name);

              return (
                <Link
                  key={tool.id}
                  href={`/sohoj-tools/${slug}`}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div
                    className={`relative w-full aspect-square rounded-[28px] ${tool.bgColor} flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-xs overflow-hidden`}
                  >
                    {tool.badge && (
                      <span
                        className={`absolute top-2.5 left-2.5 text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-full shadow-xs ${
                          tool.badge === "New" ? "bg-emerald-600" : "bg-red-500"
                        }`}
                      >
                        {tool.badge}
                      </span>
                    )}

                    <IconComponent
                      size={42}
                      className="text-[#ffffff] stroke-[1.75]"
                    />
                  </div>

                  <span className="mt-2.5 text-xs font-bold text-gray-800 text-center line-clamp-1 group-hover:text-[#FF5D00] transition-colors">
                    {tool.name}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          /* No tools found - Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 rounded-2xl border border-dashed border-gray-200 my-4">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-3">
              <Search size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">No tools found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              We couldn't find any tool matching "{searchQuery}". Try searching
              for something else.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SohojToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs">
            <Loader2 size={16} className="animate-spin text-orange-500" />
            Loading tools...
          </div>
        </div>
      }
    >
      <SohojToolsContent />
    </Suspense>
  );
}
