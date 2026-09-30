"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { toolsData, ToolTile } from "@/app/_components/toolsData";

import {
  Search,
  LayoutGrid,
  Star,
  FileText,
  Image as ImageIcon,
  Type,
  Wrench,
  GraduationCap,
  Video,
  Loader2,
} from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs">
          <Loader2 size={16} className="animate-spin text-[#2563EB]" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <DashboardNavbar />

      <main className="max-w-[1320px] mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#2563EB]/25">
              <LayoutGrid size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A]">Tools</h1>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  All of these tools are free
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {toolsData.length} free tools to speed up daily work.
              </p>
            </div>
          </div>

          <div className="bg-white/80 border border-slate-200 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("Free")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "Free"
                  ? "bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/30"
                  : "text-slate-600 hover:text-[#2563EB]"
              }`}
            >
              Free Tools •
            </button>
            <button
              onClick={() => setActiveTab("Paid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "Paid"
                  ? "bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/30"
                  : "text-slate-600 hover:text-[#2563EB]"
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
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium focus:outline-none focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 shadow-xs placeholder:text-gray-400 transition-all"
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
                    ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm shadow-[#2563EB]/25"
                    : "bg-white text-[#0F172A] border-slate-200 hover:border-[#2563EB]/40 hover:bg-blue-50 hover:text-[#2563EB]"
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
            {filteredTools.map((tool) => (
              <ToolTile key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          /* No tools found - Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 rounded-2xl border border-dashed border-gray-200 my-4">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-3">
              <Search size={22} />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">No tools found</h3>
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
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs">
            <Loader2 size={16} className="animate-spin text-[#2563EB]" />
            Loading tools...
          </div>
        </div>
      }
    >
      <SohojToolsContent />
    </Suspense>
  );
}
