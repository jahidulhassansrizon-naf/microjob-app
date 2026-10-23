"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import { Search, Filter, RotateCcw, ArrowUpDown, TrendingUp, Clock, ArrowDownUp, ChevronDown, Check, Heart, SlidersHorizontal, } from "lucide-react";
import { TEMPLATE_IMAGE_URLS } from "./templateImageUrls";
import { getClientSession } from "@/lib/clientAuth";
export default function PrintMediaPage() {
    const router = useRouter();
    // Auth Protection Logic
    useEffect(() => {
        let mounted = true;
        void getClientSession().then((session) => {
            if (!mounted)
                return;
            if (!session.authenticated) {
                router.replace("/login?callbackUrl=%2Fprint-media");
                return;
            }
        });
        return () => {
            mounted = false;
        };
    }, [router]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedPricing, setSelectedPricing] = useState("All");
    const [selectedSort, setSelectedSort] = useState("Featured order");
    const [selectedDateFilter, setSelectedDateFilter] = useState("All time");
    // ড্রপডাউন ওপেন/ক্লোজ স্টেট
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const categories = [
        { name: "All", count: TEMPLATE_IMAGE_URLS.length },
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
    return (<div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE]">
      {/* ড্যাশবোর্ড নেভবার */}
      <DashboardNavbar />

      <div className="page-font flex-1 p-3 sm:p-4 md:p-6 w-full space-y-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
            font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
            font-optical-sizing: auto;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
          .scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
          .scroll::-webkit-scrollbar { width: 12px; height: 12px; }
          .scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
          .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
          .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }
        `}</style>
        {/* ১. টপ হেডার (Print Media টাইটেল এবং ডানপাশের টপ বাটনগুলো) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#D8C9A6] pb-3">
          <div>
            <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#3B2F1E]"><T>{"Print Media\n            "}</T></h1>
            <p className="text-[15px] text-[#6B5A40] font-medium mt-1"><T>{"Choose a template and customize it on the canvas.\n            "}</T></p>
          </div>

          {/* টপ রাইট অ্যাকশন বাটন সেকশন (রেসপন্সিভ স্ক্রোলযোগ্য) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full lg:w-auto no-scrollbar">
            {/* ১. প্রথম সিগমেন্টেড পিল */}
            <div className="flex items-center bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-1 shadow-sm shrink-0">
              <button className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[15px] font-bold px-4 py-2 rounded-xl shadow-sm transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
                <ArrowUpDown size={16}/>
                <span><T>{"Featured order"}</T></span>
              </button>
              <button className="flex items-center gap-2 text-[#5A4A32] hover:bg-[#EFE3C8] hover:text-[#3B2F1E] text-[15px] font-bold px-4 py-2 rounded-xl transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
                <Clock size={16} className="text-[#DC2626]"/>
                <span><T>{"Newest first"}</T></span>
              </button>
            </div>

            {/* ২. দ্বিতীয় পিল (Sort: ASC) */}
            <button className="flex items-center gap-2 bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] text-[15px] font-bold px-4 py-2.5 rounded-2xl shadow-sm transition duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
              <SlidersHorizontal size={16} className="text-[#DC2626]"/>
              <span><T>{"Sort: ASC"}</T></span>
            </button>

            {/* ৩. তৃতীয় পিল (My Favorites) */}
            <button className="flex items-center gap-2 bg-[#FBF6E8] border border-[#E3D6B8] text-[#5A4A32] hover:bg-[#EFE3C8] text-[15px] font-bold px-4 py-2.5 rounded-2xl shadow-sm transition duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
              <Heart size={16} className="text-[#DC2626]"/>
              <span><T>{"My Favorites"}</T></span>
            </button>
          </div>
        </div>

        {/* ২. মূল বডি (সাইডবার এবং মেইন কন্টেন্ট) */}
        <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
          {/* বাম দিকের কলাম: ফিল্টার সাইডবার */}
          <aside className="w-full lg:w-72 shrink-0 bg-[#F2E8D2] border border-[#E3D6B8] p-4 sm:p-5 rounded-2xl shadow-sm space-y-5 lg:sticky lg:top-6">
            {/* ফিল্টার হেডার ও রিসেট বাটন */}
            <div className="flex items-center justify-between border-b border-[#D8C9A6] pb-3">
              <div className="flex items-center gap-2 font-bold text-[17px] text-[#3B2F1E]">
                <Filter size={17} className="text-[#DC2626]"/><T>{"Filter\n              "}</T></div>
              <button onClick={handleResetFilter} className="flex items-center gap-1.5 text-[14px] font-semibold text-[#6B5A40] hover:text-[#DC2626] transition-colors duration-150 cursor-pointer rounded-lg px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
                <RotateCcw size={15}/><T>{"Reset\n              "}</T></button>
            </div>

            {/* ক্যাটাগরি সেকশন */}
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#6B5A40] uppercase tracking-wide"><T>{"Category\n              "}</T></p>
              <div className="scroll space-y-1 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat.name;
            return (<div key={idx} onClick={() => setSelectedCategory(cat.name)} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${isSelected
                    ? "bg-[#F6D9A8] text-[#DC2626] font-bold shadow-sm border-[#DC2626]"
                    : "border-transparent text-[#5A4A32] hover:bg-[#EFE3C8] font-semibold"}`}>
                      <span className="text-[15px] truncate">{<T>{cat.name}</T>}</span>
                      <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${isSelected
                    ? "bg-[#DC2626] text-white"
                    : "bg-[#F3E9D2] text-[#6B5A40]"}`}>
                        {cat.count}
                      </span>
                    </div>);
        })}
              </div>
            </div>

            <hr className="border-[#D8C9A6]"/>

            {/* প্রাইসিং সেকশন */}
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#6B5A40] uppercase tracking-wide"><T>{"Pricing\n              "}</T></p>
              <div className="space-y-2">
                {["All", "Free", "Paid"].map((type) => (<div key={type} onClick={() => setSelectedPricing(type)} className={`flex items-center px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 text-[15px] font-semibold ${selectedPricing === type
                ? "bg-[#F6D9A8] text-[#DC2626] font-bold border-[#DC2626]"
                : "border-transparent hover:bg-[#EFE3C8] text-[#5A4A32]"}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${selectedPricing === type
                ? "border-[#DC2626]"
                : "border-[#D8C9A6]"}`}>
                        {selectedPricing === type && (<span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>)}
                      </span>
                      <span>{type}</span>
                    </div>
                  </div>))}
              </div>
            </div>

            <hr className="border-[#D8C9A6]"/>

            {/* সর্ট সেকশন */}
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#6B5A40] uppercase tracking-wide"><T>{"Sort\n              "}</T></p>
              <div className="space-y-1">
                {[
            { name: "Featured order", icon: <ArrowUpDown size={16}/> },
            { name: "Popular", icon: <TrendingUp size={16}/> },
            { name: "Newest first", icon: <Clock size={16}/> },
            { name: "Oldest first", icon: <Clock size={16}/> },
            { name: "By name", icon: <ArrowDownUp size={16}/> },
        ].map((sortItem, idx) => {
            const isSelected = selectedSort === sortItem.name;
            return (<div key={idx} onClick={() => setSelectedSort(sortItem.name)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 text-[15px] ${isSelected
                    ? "bg-[#F6D9A8] text-[#DC2626] font-bold shadow-sm border-[#DC2626]"
                    : "border-transparent hover:bg-[#EFE3C8] text-[#5A4A32] font-semibold"}`}>
                      {sortItem.icon}
                      <span>{sortItem.name}</span>
                    </div>);
        })}
              </div>
            </div>
          </aside>

          {/* ডান দিকের কলাম: সার্চ বার + পিলস + কন্টেন্ট গ্রিড */}
          <main className="flex-1 space-y-4 min-w-0 w-full">
            {/* সার্চ বার */}
            <div className="bg-[#F2E8D2] border border-[#E3D6B8] p-3.5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="relative w-full">
                <Search size={18} className="absolute left-4 top-3.5 text-[#6B5A40]"/>
                <input type="text" placeholder="Search print templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl pl-11 pr-4 py-2.5 text-[15px] font-semibold text-[#3B2F1E] placeholder:text-[#B0A080] outline-none transition duration-150 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>
              </div>
            </div>

            {/* ক্যাটাগরি পিলস + টেমপ্লেট কাউন্ট + সর্ট ড্রপডাউন */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              {/* স্ক্রোলযোগ্য ক্যাটাগরি পিলস */}
              <div className="scroll flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 w-full">
                {categories.map((cat, idx) => (<button key={idx} onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-2 rounded-xl text-[15px] font-bold whitespace-nowrap transition duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${selectedCategory === cat.name
                ? "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm"
                : "bg-[#FBF6E8] hover:bg-[#EFE3C8] border border-[#E3D6B8] text-[#5A4A32]"}`}>
                    {<T>{cat.name}</T>}
                  </button>))}
              </div>

              {/* কাউন্ট ও সর্ট বাটন */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-[14px] font-medium text-[#6B5A40] whitespace-nowrap">
                  {TEMPLATE_IMAGE_URLS.length}<T>{"templates found\n                "}</T></span>

                <div className="relative">
                  <button onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)} className="flex items-center gap-2 bg-[#FBF6E8] hover:bg-[#EFE3C8] border border-[#E3D6B8] px-4 py-2 rounded-xl text-[15px] font-bold text-[#5A4A32] shadow-sm transition duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98]">
                    <ArrowUpDown size={15} className="text-[#6B5A40]"/>
                    <span><T>{"Sort"}</T></span>
                    <ChevronDown size={15} className={`text-[#6B5A40] transition-transform duration-200 ${isSortDropdownOpen ? "rotate-180" : ""}`}/>
                  </button>

                  {/* সর্ট ড্রপডাউন পপআপ */}
                  {isSortDropdownOpen && (<div className="absolute right-0 top-full mt-3 w-64 bg-[#F0DDB5] border-2 border-[#DC2626] rounded-2xl shadow-xl z-50 p-2.5 space-y-3">
                      <span aria-hidden="true" className="absolute -top-[9px] right-6 h-4 w-4 rotate-45 bg-[#F0DDB5] border-l-2 border-t-2 border-[#DC2626]"/>
                      <div>
                        <p className="px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#6B5A40]"><T>{"Sort By\n                        "}</T></p>
                        <div className="space-y-0.5">
                          {[
                "Featured order",
                "Popular",
                "Newest first",
                "Oldest first",
                "By name",
            ].map((option) => (<button key={option} onClick={() => {
                    setSelectedSort(option);
                    setIsSortDropdownOpen(false);
                }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-semibold transition duration-150 cursor-pointer ${selectedSort === option
                    ? "bg-[#F6D9A8] text-[#DC2626] font-bold"
                    : "text-[#3B2F1E] hover:bg-[#F6D9A8]/70"}`}>
                              <span>{option}</span>
                              {selectedSort === option && <Check size={16}/>}
                            </button>))}
                        </div>
                      </div>

                      <hr className="border-[#D8C9A6]"/>

                      <div>
                        <p className="px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#6B5A40]"><T>{"Date\n                        "}</T></p>
                        <div className="space-y-0.5">
                          {[
                "All time",
                "Today",
                "Last 3 Days",
                "Last 7 Days",
                "Last 30 Days",
            ].map((timeOption) => (<button key={timeOption} onClick={() => {
                    setSelectedDateFilter(timeOption);
                    setIsSortDropdownOpen(false);
                }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-semibold transition duration-150 cursor-pointer ${selectedDateFilter === timeOption
                    ? "bg-[#F6D9A8] text-[#DC2626] font-bold"
                    : "text-[#3B2F1E] hover:bg-[#F6D9A8]/70"}`}>
                              <span>{timeOption}</span>
                              {selectedDateFilter === timeOption && (<Check size={16}/>)}
                            </button>))}
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>

            {/* টেমপ্লেট কার্ড গ্রিড (রেসপন্সিভ ইমেজেস) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pt-1">
              {TEMPLATE_IMAGE_URLS.map((imageUrl, idx) => (<div key={idx} className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-3.5 shadow-sm flex flex-col gap-3 hover:bg-[#EFE3C8] hover:-translate-y-0.5 hover:shadow-md transition duration-200 group cursor-pointer">
                  <div className="w-full h-44 bg-[#F3E9D2] rounded-xl flex items-center justify-center relative overflow-hidden border border-[#E3D6B8]">
                    <span className="absolute top-2.5 left-2.5 bg-[#059669] text-white text-[12px] font-bold px-2.5 py-0.5 rounded-lg shadow-sm z-10"><T>{"Free\n                    "}</T></span>
                    <img src={imageUrl} alt={`প্রিন্ট মিডিয়া টেমপ্লেট #${idx + 1}`} className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"/>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#3B2F1E] truncate"><T>{"\u09AA\u09CD\u09B0\u09BF\u09A8\u09CD\u099F \u09AE\u09BF\u09A1\u09BF\u09DF\u09BE \u099F\u09C7\u09AE\u09AA\u09CD\u09B2\u09C7\u099F #"}</T>{idx + 1}
                    </h3>
                    <p className="text-[13px] text-[#6B5A40] font-medium mt-0.5"><T>{"\u0995\u09BE\u09B8\u09CD\u099F\u09AE\u09BE\u0987\u099C \u0995\u09B0\u09C1\u09A8 \u0995\u09CD\u09AF\u09BE\u09A8\u09AD\u09BE\u09B8\u09C7\n                    "}</T></p>
                  </div>
                </div>))}
            </div>
          </main>
        </div>
      </div>
    </div>);
}
