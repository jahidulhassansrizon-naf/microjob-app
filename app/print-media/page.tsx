"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import {
  Search,
  Filter,
  RotateCcw,
  ArrowUpDown,
  TrendingUp,
  Clock,
  ArrowDownUp,
  ChevronDown,
  Check,
  Heart,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

export default function PrintMediaPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Auth Protection Logic
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login"); // লগইন না থাকলে সরাসরি /login পেজে পাঠিয়ে দেবে
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Featured order");
  const [selectedDateFilter, setSelectedDateFilter] = useState("All time");

  // ড্রপডাউন ওপেন/ক্লোজ স্টেট
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const categories = [
    { name: "All", count: 86 },
    { name: "নোটিশ", count: 6 },
    { name: "বিবাহ আমন্ত্রণ", count: 12 },
    { name: "ভিজিটিং কার্ড", count: 14 },
    { name: "পোস্টার", count: 15 },
    { name: "শহীদ স্মরণ", count: 5 },
    { name: "রেজিস্ট্রেশন", count: 7 },
    { name: "সার্টিফিকেট", count: 8 },
    { name: "ধন্যবাদ কার্ড", count: 9 },
    { name: "ক্যালেন্ডার", count: 4 },
  ];

  const handleResetFilter = () => {
    setSelectedCategory("All");
    setSelectedPricing("All");
    setSelectedSort("Featured order");
    setSelectedDateFilter("All time");
  };

  // অথেনটিকেশন চেক না হওয়া পর্যন্ত লোডিং স্ক্রিন
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
    <div className="min-h-screen flex flex-col bg-[#F8F2EF]">
      {/* ড্যাশবোর্ড নেভবার */}
      <DashboardNavbar />

      <div className="flex-1 p-3 sm:p-4 md:p-6 w-full space-y-4">
        {/* ১. টপ হেডার (Print Media টাইটেল এবং ডানপাশের টপ বাটনগুলো) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-200/60 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Print Media
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Choose a template and customize it on the canvas.
            </p>
          </div>

          {/* টপ রাইট অ্যাকশন বাটন সেকশন (রেসপন্সিভ স্ক্রোলযোগ্য) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full lg:w-auto no-scrollbar">
            {/* ১. প্রথম সিগমেন্টেড পিল */}
            <div className="flex items-center bg-white border border-gray-200/90 rounded-2xl p-1 shadow-xs shrink-0">
              <button className="flex items-center gap-1.5 bg-[#E0672A] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition">
                <ArrowUpDown size={13} />
                <span>Featured order</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                <Clock size={13} className="text-[#E0672A]" />
                <span>Newest first</span>
              </button>
            </div>

            {/* ২. দ্বিতীয় পিল (Sort: ASC) */}
            <button className="flex items-center gap-1.5 bg-white border border-gray-200/90 text-gray-700 hover:bg-gray-50 text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-xs transition shrink-0">
              <SlidersHorizontal size={13} className="text-[#E0672A]" />
              <span>Sort: ASC</span>
            </button>

            {/* ৩. তৃতীয় পিল (My Favorites) */}
            <button className="flex items-center gap-1.5 bg-white border border-gray-200/90 text-gray-700 hover:bg-gray-50 text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-xs transition shrink-0">
              <Heart size={13} className="text-[#E0672A]" />
              <span>My Favorites</span>
            </button>
          </div>
        </div>

        {/* ২. মূল বডি (সাইডবার এবং মেইন কন্টেন্ট) */}
        <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
          {/* বাম দিকের কলাম: ফিল্টার সাইডবার */}
          <aside className="w-full lg:w-64 shrink-0 bg-white border border-gray-200/80 p-4 sm:p-5 rounded-3xl shadow-xs space-y-5 lg:sticky lg:top-6">
            {/* ফিল্টার হেডার ও রিসেট বাটন */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 font-black text-xs text-gray-900">
                <Filter size={14} className="text-[#FF5D00]" /> Filter
              </div>
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-[#FF5D00] transition-colors cursor-pointer"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* ক্যাটাগরি সেকশন */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                Category
              </p>
              <div className="space-y-1 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                {categories.map((cat, idx) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#FFF4EE] text-[#FF5D00] font-bold shadow-xs border border-orange-100"
                          : "text-gray-600 hover:bg-gray-50 font-semibold"
                      }`}
                    >
                      <span className="text-xs truncate">{cat.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-orange-200/60 text-[#FF5D00]"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* প্রাইসিং সেকশন */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                Pricing
              </p>
              <div className="space-y-2">
                {["All", "Free", "Paid"].map((type) => (
                  <div
                    key={type}
                    onClick={() => setSelectedPricing(type)}
                    className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs font-semibold ${
                      selectedPricing === type
                        ? "bg-[#FFF4EE] text-[#FF5D00] font-bold border border-orange-100"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          selectedPricing === type
                            ? "border-[#FF5D00]"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedPricing === type && (
                          <span className="w-2 h-2 rounded-full bg-[#FF5D00]"></span>
                        )}
                      </span>
                      <span>{type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* সর্ট সেকশন */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                Sort
              </p>
              <div className="space-y-1">
                {[
                  { name: "Featured order", icon: <ArrowUpDown size={14} /> },
                  { name: "Popular", icon: <TrendingUp size={14} /> },
                  { name: "Newest first", icon: <Clock size={14} /> },
                  { name: "Oldest first", icon: <Clock size={14} /> },
                  { name: "By name", icon: <ArrowDownUp size={14} /> },
                ].map((sortItem, idx) => {
                  const isSelected = selectedSort === sortItem.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSort(sortItem.name)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs ${
                        isSelected
                          ? "bg-[#FFF4EE] text-[#FF5D00] font-bold shadow-xs border border-orange-100"
                          : "hover:bg-gray-50 text-gray-700 font-semibold"
                      }`}
                    >
                      {sortItem.icon}
                      <span>{sortItem.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ডান দিকের কলাম: সার্চ বার + পিলস + কন্টেন্ট গ্রিড */}
          <main className="flex-1 space-y-4 min-w-0 w-full">
            {/* সার্চ বার */}
            <div className="bg-white border border-gray-200/80 p-3.5 rounded-3xl shadow-xs flex items-center gap-4">
              <div className="relative w-full">
                <Search
                  size={16}
                  className="absolute left-4 top-3 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search print templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#FF5D00]"
                />
              </div>
            </div>

            {/* ক্যাটাগরি পিলস + টেমপ্লেট কাউন্ট + সর্ট ড্রপডাউন */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              {/* স্ক্রোলযোগ্য ক্যাটাগরি পিলস */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 w-full">
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat.name
                        ? "bg-[#FF5D00] text-white shadow-xs"
                        : "bg-white hover:bg-gray-100 border border-gray-200 text-gray-700"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* কাউন্ট ও সর্ট বাটন */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                  86 templates found
                </span>

                <div className="relative">
                  <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 shadow-xs transition cursor-pointer"
                  >
                    <ArrowUpDown size={12} className="text-gray-500" />
                    <span>Sort</span>
                    <ChevronDown
                      size={12}
                      className={`text-gray-400 transition-transform duration-200 ${
                        isSortDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* সর্ট ড্রপডাউন পপআপ */}
                  {isSortDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200/90 rounded-2xl shadow-xl z-50 p-2 space-y-3">
                      <div>
                        <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                          Sort By
                        </p>
                        <div className="space-y-0.5">
                          {[
                            "Featured order",
                            "Popular",
                            "Newest first",
                            "Oldest first",
                            "By name",
                          ].map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setSelectedSort(option);
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                selectedSort === option
                                  ? "bg-[#FFF4EE] text-[#FF5D00]"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>{option}</span>
                              {selectedSort === option && <Check size={13} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <hr className="border-gray-100" />

                      <div>
                        <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                          Date
                        </p>
                        <div className="space-y-0.5">
                          {[
                            "All time",
                            "Today",
                            "Last 3 Days",
                            "Last 7 Days",
                            "Last 30 Days",
                          ].map((timeOption) => (
                            <button
                              key={timeOption}
                              onClick={() => {
                                setSelectedDateFilter(timeOption);
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                selectedDateFilter === timeOption
                                  ? "bg-[#FFF4EE] text-[#FF5D00]"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>{timeOption}</span>
                              {selectedDateFilter === timeOption && (
                                <Check size={13} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* টেমপ্লেট কার্ড গ্রিড (রেসপন্সিভ কলাম) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                (item) => (
                  <div
                    key={item}
                    className="bg-white border border-gray-200/85 rounded-3xl p-3.5 shadow-xs flex flex-col gap-3 hover:shadow-md transition group cursor-pointer"
                  >
                    <div className="w-full h-44 bg-gray-100 rounded-2xl flex items-center justify-center relative overflow-hidden border border-gray-100">
                      <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs">
                        Free
                      </span>
                      <span className="text-3xl">📄</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 truncate">
                        প্রিন্ট মিডিয়া টেমপ্লেট #{item}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        কাস্টমাইজ করুন ক্যানভাসে
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
