// app/ai-template/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import {
  Search,
  ChevronDown,
  RotateCcw,
  Users,
  User,
  Smile,
  ShoppingBag,
  Image as ImageIcon,
  Heart,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Clock,
  TrendingUp,
  X,
  Loader2,
} from "lucide-react";

export default function AiTemplatePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Auth Protection Logic
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedImageCount, setSelectedImageCount] = useState("All");
  const [selectedOrientation, setSelectedOrientation] = useState("All");
  const [selectedColor, setSelectedColor] = useState("multicolor");
  const [selectedSort, setSelectedSort] = useState("Newest first");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedDate, setSelectedDate] = useState("All time");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categoriesWithCount = [
    { name: "All", count: "8" },
    { name: "Motivational", count: "2" },
    { name: "Creative Shots", count: "2" },
    { name: "Wedding Photo", count: "1" },
    { name: "Family photo", count: "1" },
    { name: "Couple Portraits", count: "1" },
    { name: "Birthday wishes", count: "1" },
  ];

  const popularTags = [
    "#catwalk",
    "#cctv",
    "#celebration",
    "#anime fashion",
    "#apocalypse",
    "#apparel",
    "#arch",
  ];

  const templates = [
    {
      id: 1,
      title: "Beach Sunset Vibe",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
      category: "Motivational",
      uses: "10 uses",
      usesCount: 10,
      gender: "Male",
      imageCount: "1 image",
      orientation: "Portrait",
      color: "orange",
      createdAt: "2026-03-01",
    },
    {
      id: 2,
      title: "Blue Saree Aesthetic",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      category: "Creative Shots",
      uses: "25 uses",
      usesCount: 25,
      gender: "Female",
      imageCount: "1 image",
      orientation: "Portrait",
      color: "red",
      createdAt: "2026-02-28",
    },
    {
      id: 3,
      title: "Heart Floral Swing",
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
      category: "Wedding Photo",
      uses: "18 uses",
      usesCount: 18,
      gender: "Female",
      imageCount: "2 images",
      orientation: "Square",
      color: "purple",
      createdAt: "2026-02-20",
    },
    {
      id: 4,
      title: "Water Dress Fantasy",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
      category: "Creative Shots",
      uses: "32 uses",
      usesCount: 32,
      gender: "Female",
      imageCount: "1 image",
      orientation: "Landscape",
      color: "multicolor",
      createdAt: "2026-03-02",
    },
    {
      id: 5,
      title: "Lotus Lake Dream",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
      category: "Family photo",
      uses: "12 uses",
      usesCount: 12,
      gender: "Children",
      imageCount: "3+ images",
      orientation: "Landscape",
      color: "green",
      createdAt: "2026-01-15",
    },
    {
      id: 6,
      title: "Purple Swing Romance",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
      category: "Couple Portraits",
      uses: "15 uses",
      usesCount: 15,
      gender: "Male",
      imageCount: "2 images",
      orientation: "Portrait",
      color: "purple",
      createdAt: "2026-02-10",
    },
    {
      id: 7,
      title: "Life Struggle Quote",
      image:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
      category: "Motivational",
      uses: "40 uses",
      usesCount: 40,
      gender: "Male",
      imageCount: "1 image",
      orientation: "Portrait",
      color: "gray",
      createdAt: "2026-03-04",
    },
    {
      id: 8,
      title: "Birthday Joy",
      image:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
      category: "Birthday wishes",
      uses: "22 uses",
      usesCount: 22,
      gender: "Children",
      imageCount: "1 image",
      orientation: "Square",
      color: "yellow",
      createdAt: "2026-02-25",
    },
  ];

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id],
    );
  };

  const handleReset = () => {
    setSelectedCategory("All");
    setSelectedGender("All");
    setSelectedImageCount("All");
    setSelectedOrientation("All");
    setSelectedColor("multicolor");
    setSelectedSort("Newest first");
    setSelectedDate("All time");
    setSearchQuery("");
    setShowFavoritesOnly(false);
    setSortOrder("asc");
  };

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((tpl) => {
        if (selectedCategory !== "All" && tpl.category !== selectedCategory)
          return false;

        if (
          searchQuery.trim() !== "" &&
          !tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !tpl.category.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }

        if (showFavoritesOnly && !favoriteIds.includes(tpl.id)) return false;

        if (selectedGender !== "All" && tpl.gender !== selectedGender)
          return false;

        if (
          selectedImageCount !== "All" &&
          tpl.imageCount !== selectedImageCount
        )
          return false;

        if (
          selectedOrientation !== "All" &&
          tpl.orientation !== selectedOrientation
        )
          return false;

        if (selectedColor !== "multicolor" && tpl.color !== selectedColor)
          return false;

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (selectedSort === "Popular") {
          comparison = b.usesCount - a.usesCount;
        } else if (selectedSort === "Newest first") {
          comparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (selectedSort === "Oldest first") {
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (selectedSort === "By name") {
          comparison = a.title.localeCompare(b.title);
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [
    selectedCategory,
    searchQuery,
    showFavoritesOnly,
    favoriteIds,
    selectedGender,
    selectedImageCount,
    selectedOrientation,
    selectedColor,
    selectedSort,
    sortOrder,
  ]);

  if (isAuthenticated === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F8F2EF" }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-200/80 shadow-xs">
          <Loader2 size={16} className="animate-spin text-[#FF5D00]" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F8F2EF" }}
    >
      <DashboardNavbar />

      {/* সাব-হেডার অপশন */}
      <div
        className="border-b border-gray-200/80 px-4 md:px-6 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        style={{ backgroundColor: "#F8F2EF" }}
      >
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">AI Template</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Pick a style you like, upload your photo, and we'll generate the
            same look for you in seconds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold w-full lg:w-auto">
          {/* কম্বাইন্ড টগল বক্স */}
          <div className="flex items-center bg-white border border-gray-200/80 rounded-2xl p-1 shadow-xs">
            <button
              onClick={() => setSelectedSort("Newest first")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                selectedSort === "Newest first"
                  ? "bg-[#FF5D00] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Clock size={14} /> Newest first
            </button>
            <button
              onClick={() => setSelectedSort("Popular")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                selectedSort === "Popular"
                  ? "bg-[#FF5D00] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <TrendingUp
                size={14}
                className={
                  selectedSort === "Popular" ? "text-white" : "text-gray-400"
                }
              />{" "}
              Popular
            </button>
          </div>

          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <ArrowUpDown size={14} className="text-gray-400" /> Sort:{" "}
            {sortOrder.toUpperCase()}
          </button>
          <button
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
            className={`flex items-center gap-1.5 bg-white border ${
              showFavoritesOnly
                ? "border-red-500 text-red-600 bg-red-50/50"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            } px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer`}
          >
            <Heart
              size={14}
              className={`${
                showFavoritesOnly || favoriteIds.length > 0
                  ? "text-red-500 fill-red-500"
                  : "text-gray-400"
              }`}
            />{" "}
            My Favorites ({favoriteIds.length})
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 md:p-6 gap-6">
        {/* বাম পাশের ফিল্টার সাইডবার (মোবাইলে ফুল উইথ, ডেস্কটপে w-80) */}
        <div className="w-full lg:w-80 bg-white border border-gray-200/80 rounded-3xl p-5 flex flex-col gap-6 overflow-y-auto shrink-0 shadow-xs max-h-none lg:max-h-[calc(100vh-180px)]">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#FF5D00]" />
              <h3 className="text-sm font-extrabold text-gray-900">Filter</h3>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 transition cursor-pointer"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* ১. ক্যাটেগরি */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Category
            </h4>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {categoriesWithCount.map((cat, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-2xl text-xs font-semibold transition flex items-center justify-between ${
                    selectedCategory === cat.name
                      ? "bg-orange-50 text-[#FF5D00]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.count && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        selectedCategory === cat.name
                          ? "bg-orange-200 text-[#FF5D00]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* ২. জেন্ডার */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Gender
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-2">
              {[
                { name: "All", icon: <Users size={14} /> },
                { name: "Male", icon: <User size={14} /> },
                { name: "Female", icon: <User size={14} /> },
                { name: "Children", icon: <Smile size={14} /> },
                { name: "Product", icon: <ShoppingBag size={14} /> },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedGender(item.name)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-semibold transition gap-1 ${
                    selectedGender === item.name
                      ? "border-[#FF5D00] bg-orange-50/50 text-[#FF5D00]"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                  }`}
                >
                  {item.icon}
                  <span className="text-[11px]">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* ৩. ইমেজ কাউন্ট */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Image Count
            </h4>
            <div className="space-y-2">
              {[
                { title: "All", subtitle: "" },
                { title: "1 image", subtitle: "Single portrait" },
                { title: "2 images", subtitle: "Couple / family" },
                { title: "3+ images", subtitle: "Group / more than 2 people" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageCount(item.title)}
                  className={`flex items-start gap-3 p-2.5 rounded-2xl border cursor-pointer transition ${
                    selectedImageCount === item.title
                      ? "border-[#FF5D00] bg-orange-50/40"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                      selectedImageCount === item.title
                        ? "border-[#FF5D00] bg-[#FF5D00]"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedImageCount === item.title && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        selectedImageCount === item.title
                          ? "text-[#FF5D00]"
                          : "text-gray-800"
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-[10px] text-gray-400 font-medium">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* ৪. অরিয়েন্টেশন */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Orientation
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
              {["All", "Portrait", "Landscape", "Square"].map((ori, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOrientation(ori)}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-[11px] font-semibold transition gap-1 ${
                    selectedOrientation === ori
                      ? "border-[#FF5D00] bg-orange-50/50 text-[#FF5D00]"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>{ori}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* ৫. কালার */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Color
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedColor("multicolor")}
                className={`w-7 h-7 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 flex items-center justify-center shadow-xs cursor-pointer ${
                  selectedColor === "multicolor"
                    ? "ring-2 ring-offset-2 ring-[#FF5D00]"
                    : ""
                }`}
              />
              <button
                onClick={() => setSelectedColor("red")}
                className={`w-7 h-7 rounded-full bg-red-500 shadow-xs cursor-pointer ${
                  selectedColor === "red"
                    ? "ring-2 ring-offset-2 ring-[#FF5D00]"
                    : ""
                }`}
              />
              <button
                onClick={() => setSelectedColor("orange")}
                className={`w-7 h-7 rounded-full bg-orange-500 shadow-xs cursor-pointer ${
                  selectedColor === "orange"
                    ? "ring-2 ring-offset-2 ring-[#FF5D00]"
                    : ""
                }`}
              />
              <button
                onClick={() => setSelectedColor("yellow")}
                className={`w-7 h-7 rounded-full bg-yellow-400 shadow-xs cursor-pointer ${
                  selectedColor === "yellow"
                    ? "ring-2 ring-offset-2 ring-[#FF5D00]"
                    : ""
                }`}
              />
              <button
                onClick={() => setSelectedColor("green")}
                className={`w-7 h-7 rounded-full bg-emerald-500 shadow-xs cursor-pointer ${
                  selectedColor === "green"
                    ? "ring-2 ring-offset-2 ring-[#FF5D00]"
                    : ""
                }`}
              />
              <button
                onClick={() => setSelectedColor("purple")}
                className={`w-7 h-7 rounded-full bg-purple-500 shadow-xs cursor-pointer ${
                  selectedColor === "purple"
                    ? "ring-2 ring-offset-2 ring-[#FF5D00]"
                    : ""
                }`}
              />
              <button
                onClick={() => setSelectedColor("gray")}
                className={`w-7 h-7 rounded-full bg-slate-700 shadow-xs cursor-pointer ${
                  selectedColor === "gray"
                    ? "ring-2 ring-offset-2 ring-[#FF5D00]"
                    : ""
                }`}
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* ৬. সর্ট */}
          <div className="space-y-2.5 pb-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Sort
            </h4>
            <div className="space-y-1">
              {["Popular", "Newest first", "Oldest first", "By name"].map(
                (sortOpt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSort(sortOpt)}
                    className={`w-full text-left px-3 py-2 rounded-2xl text-xs font-semibold transition ${
                      selectedSort === sortOpt
                        ? "bg-orange-50 text-[#FF5D00]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {sortOpt}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* মূল টেমপ্লেট গ্যালারি এরিয়া */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* সার্চ ইনপুট */}
          <div className="flex items-center gap-2 w-full bg-white px-4 py-3 rounded-2xl border border-gray-200/80 shadow-xs mb-3">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or category..."
              className="bg-transparent border-none outline-none text-xs w-full text-gray-800 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* হ্যাশট্যাগ চিপস এবং ডানের SORT ড্রপডাউন মেনু */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 w-full">
              {popularTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(tag.replace("#", ""))}
                  className="bg-white border border-gray-200/80 hover:border-[#FF5D00] hover:text-[#FF5D00] text-gray-600 px-3.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors shadow-xs cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap">
                {filteredTemplates.length} templates found
              </span>

              {/* সর্ট ড্রপডাউন বক্স */}
              <div className="relative">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-gray-200/80 hover:border-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 shadow-xs transition cursor-pointer"
                >
                  <ArrowUpDown size={14} className="text-[#FF5D00]" />
                  <span>Sort</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                {sortDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 z-30 text-xs font-medium text-gray-700">
                    <div className="px-4 pb-2 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <ArrowUpDown size={12} /> Sort By
                    </div>
                    <div className="space-y-0.5 mb-2">
                      {[
                        "Popular",
                        "Newest first",
                        "Oldest first",
                        "By name",
                      ].map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedSort(opt);
                            setSortDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-orange-50 hover:text-[#FF5D00] text-left transition"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              selectedSort === opt
                                ? "bg-[#FF5D00]"
                                : "bg-transparent"
                            }`}
                          ></div>
                          <span
                            className={
                              selectedSort === opt
                                ? "font-bold text-gray-900"
                                : "text-gray-600"
                            }
                          >
                            {opt}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 my-2"></div>

                    <div className="px-4 pb-2 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <Calendar size={12} /> Date
                    </div>
                    <div className="space-y-0.5">
                      {[
                        "All time",
                        "Today",
                        "Last 3 days",
                        "Last 7 days",
                        "Last 30 days",
                      ].map((dateOpt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(dateOpt);
                            setSortDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-orange-50 hover:text-[#FF5D00] text-left transition"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              selectedDate === dateOpt
                                ? "bg-[#FF5D00]"
                                : "bg-transparent"
                            }`}
                          ></div>
                          <span
                            className={
                              selectedDate === dateOpt
                                ? "font-bold text-gray-900"
                                : "text-gray-600"
                            }
                          >
                            {dateOpt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* টেমপ্লেট গ্রিড / এম্পটি স্টেট */}
          {filteredTemplates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-gray-200/80 my-auto">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-[#FF5D00] mb-4">
                <Search size={28} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                No templates found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-6">
                We couldn't find any templates matching your search criteria.
                Try adjusting your filters or search terms.
              </p>
              <button
                onClick={handleReset}
                className="bg-[#FF5D00] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#e05200] transition shadow-xs"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs hover:shadow-md transition duration-300 flex flex-col cursor-pointer relative"
                >
                  <div className="absolute top-2.5 right-2.5 z-10 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {tpl.uses}
                  </div>

                  {/* ফেভারিট হার্ট আইকন */}
                  <button
                    onClick={(e) => toggleFavorite(tpl.id, e)}
                    className="absolute top-2.5 left-2.5 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white transition"
                  >
                    <Heart
                      size={14}
                      className={
                        favoriteIds.includes(tpl.id)
                          ? "fill-red-500 text-red-500"
                          : "text-white"
                      }
                    />
                  </button>

                  <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                    <img
                      src={tpl.image}
                      alt={tpl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <button className="w-full bg-[#FF5D00] hover:bg-[#e05200] text-white text-xs font-bold py-2 rounded-xl transition shadow-sm">
                        Use Template
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-white flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {tpl.title}
                    </span>
                    <span className="text-[10px] bg-orange-50 text-[#FF5D00] font-semibold px-2 py-0.5 rounded-md shrink-0">
                      {tpl.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
