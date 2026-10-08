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
    return (<div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* ড্যাশবোর্ড নেভবার */}
      <DashboardNavbar />

      <div className="flex-1 p-3 sm:p-4 md:p-6 w-full space-y-4">
        {/* ১. টপ হেডার (Print Media টাইটেল এবং ডানপাশের টপ বাটনগুলো) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E2E8F0]/60 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A]"><T>{"Print Media\n            "}</T></h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5"><T>{"Choose a template and customize it on the canvas.\n            "}</T></p>
          </div>

          {/* টপ রাইট অ্যাকশন বাটন সেকশন (রেসপন্সিভ স্ক্রোলযোগ্য) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full lg:w-auto no-scrollbar">
            {/* ১. প্রথম সিগমেন্টেড পিল */}
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl p-1 shadow-xs shrink-0">
              <button className="flex items-center gap-1.5 bg-[#4F46E5] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition">
                <ArrowUpDown size={13}/>
                <span><T>{"Featured order"}</T></span>
              </button>
              <button className="flex items-center gap-1.5 text-[#334155] hover:text-[#0F172A] text-xs font-bold px-3 py-1.5 rounded-xl transition">
                <Clock size={13} className="text-[#4F46E5]"/>
                <span><T>{"Newest first"}</T></span>
              </button>
            </div>

            {/* ২. দ্বিতীয় পিল (Sort: ASC) */}
            <button className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-xs transition shrink-0">
              <SlidersHorizontal size={13} className="text-[#4F46E5]"/>
              <span><T>{"Sort: ASC"}</T></span>
            </button>

            {/* ৩. তৃতীয় পিল (My Favorites) */}
            <button className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-xs transition shrink-0">
              <Heart size={13} className="text-[#4F46E5]"/>
              <span><T>{"My Favorites"}</T></span>
            </button>
          </div>
        </div>

        {/* ২. মূল বডি (সাইডবার এবং মেইন কন্টেন্ট) */}
        <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
          {/* বাম দিকের কলাম: ফিল্টার সাইডবার */}
          <aside className="w-full lg:w-64 shrink-0 bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-3xl shadow-xs space-y-5 lg:sticky lg:top-6">
            {/* ফিল্টার হেডার ও রিসেট বাটন */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2 font-black text-xs text-[#0F172A]">
                <Filter size={14} className="text-[#2563EB]"/><T>{"Filter\n              "}</T></div>
              <button onClick={handleResetFilter} className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8] hover:text-[#2563EB] transition-colors cursor-pointer">
                <RotateCcw size={12}/><T>{"Reset\n              "}</T></button>
            </div>

            {/* ক্যাটাগরি সেকশন */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider"><T>{"Category\n              "}</T></p>
              <div className="space-y-1 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat.name;
            return (<div key={idx} onClick={() => setSelectedCategory(cat.name)} className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${isSelected
                    ? "bg-[#EEF2FF] text-[#2563EB] font-bold shadow-xs border border-indigo-100"
                    : "text-[#475569] hover:bg-[#F1F5F9] font-semibold"}`}>
                      <span className="text-xs truncate">{<T>{cat.name}</T>}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected
                    ? "bg-indigo-200/60 text-[#2563EB]"
                    : "bg-[#F1F5F9] text-[#94A3B8]"}`}>
                        {cat.count}
                      </span>
                    </div>);
        })}
              </div>
            </div>

            <hr className="border-[#E2E8F0]"/>

            {/* প্রাইসিং সেকশন */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider"><T>{"Pricing\n              "}</T></p>
              <div className="space-y-2">
                {["All", "Free", "Paid"].map((type) => (<div key={type} onClick={() => setSelectedPricing(type)} className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs font-semibold ${selectedPricing === type
                ? "bg-[#EEF2FF] text-[#2563EB] font-bold border border-indigo-100"
                : "hover:bg-[#F1F5F9] text-[#334155]"}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedPricing === type
                ? "border-[#2563EB]"
                : "border-[#CBD5E1]"}`}>
                        {selectedPricing === type && (<span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>)}
                      </span>
                      <span>{type}</span>
                    </div>
                  </div>))}
              </div>
            </div>

            <hr className="border-[#E2E8F0]"/>

            {/* সর্ট সেকশন */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-wider"><T>{"Sort\n              "}</T></p>
              <div className="space-y-1">
                {[
            { name: "Featured order", icon: <ArrowUpDown size={14}/> },
            { name: "Popular", icon: <TrendingUp size={14}/> },
            { name: "Newest first", icon: <Clock size={14}/> },
            { name: "Oldest first", icon: <Clock size={14}/> },
            { name: "By name", icon: <ArrowDownUp size={14}/> },
        ].map((sortItem, idx) => {
            const isSelected = selectedSort === sortItem.name;
            return (<div key={idx} onClick={() => setSelectedSort(sortItem.name)} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs ${isSelected
                    ? "bg-[#EEF2FF] text-[#2563EB] font-bold shadow-xs border border-indigo-100"
                    : "hover:bg-[#F1F5F9] text-[#334155] font-semibold"}`}>
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
            <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-3xl shadow-xs flex items-center gap-4">
              <div className="relative w-full">
                <Search size={16} className="absolute left-4 top-3 text-[#94A3B8]"/>
                <input type="text" placeholder="Search print templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl pl-11 pr-4 py-2 text-xs font-semibold text-[#334155] outline-none focus:border-[#2563EB]"/>
              </div>
            </div>

            {/* ক্যাটাগরি পিলস + টেমপ্লেট কাউন্ট + সর্ট ড্রপডাউন */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              {/* স্ক্রোলযোগ্য ক্যাটাগরি পিলস */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 w-full">
                {categories.map((cat, idx) => (<button key={idx} onClick={() => setSelectedCategory(cat.name)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${selectedCategory === cat.name
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#334155]"}`}>
                    {<T>{cat.name}</T>}
                  </button>))}
              </div>

              {/* কাউন্ট ও সর্ট বাটন */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs font-medium text-[#64748B] whitespace-nowrap">
                  {TEMPLATE_IMAGE_URLS.length}<T>{"templates found\n                "}</T></span>

                <div className="relative">
                  <button onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)} className="flex items-center gap-1.5 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1.5 rounded-xl text-xs font-bold text-[#334155] shadow-xs transition cursor-pointer">
                    <ArrowUpDown size={12} className="text-[#64748B]"/>
                    <span><T>{"Sort"}</T></span>
                    <ChevronDown size={12} className={`text-[#94A3B8] transition-transform duration-200 ${isSortDropdownOpen ? "rotate-180" : ""}`}/>
                  </button>

                  {/* সর্ট ড্রপডাউন পপআপ */}
                  {isSortDropdownOpen && (<div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 p-2 space-y-3">
                      <div>
                        <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#94A3B8]"><T>{"Sort By\n                        "}</T></p>
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
                }} className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${selectedSort === option
                    ? "bg-[#EEF2FF] text-[#2563EB]"
                    : "text-[#334155] hover:bg-[#F1F5F9]"}`}>
                              <span>{option}</span>
                              {selectedSort === option && <Check size={13}/>}
                            </button>))}
                        </div>
                      </div>

                      <hr className="border-[#E2E8F0]"/>

                      <div>
                        <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#94A3B8]"><T>{"Date\n                        "}</T></p>
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
                }} className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${selectedDateFilter === timeOption
                    ? "bg-[#EEF2FF] text-[#2563EB]"
                    : "text-[#334155] hover:bg-[#F1F5F9]"}`}>
                              <span>{timeOption}</span>
                              {selectedDateFilter === timeOption && (<Check size={13}/>)}
                            </button>))}
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>

            {/* টেমপ্লেট কার্ড গ্রিড (রেসপন্সিভ ইমেজেস) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pt-1">
              {TEMPLATE_IMAGE_URLS.map((imageUrl, idx) => (<div key={idx} className="bg-white border border-[#E2E8F0] rounded-3xl p-3.5 shadow-xs flex flex-col gap-3 hover:shadow-md transition group cursor-pointer">
                  <div className="w-full h-44 bg-[#F1F5F9] rounded-2xl flex items-center justify-center relative overflow-hidden border border-[#E2E8F0]">
                    <span className="absolute top-2.5 left-2.5 bg-[#059669] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs z-10"><T>{"Free\n                    "}</T></span>
                    <img src={imageUrl} alt={`প্রিন্ট মিডিয়া টেমপ্লেট #${idx + 1}`} className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"/>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0F172A] truncate"><T>{"\u09AA\u09CD\u09B0\u09BF\u09A8\u09CD\u099F \u09AE\u09BF\u09A1\u09BF\u09DF\u09BE \u099F\u09C7\u09AE\u09AA\u09CD\u09B2\u09C7\u099F #"}</T>{idx + 1}
                    </h3>
                    <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5"><T>{"\u0995\u09BE\u09B8\u09CD\u099F\u09AE\u09BE\u0987\u099C \u0995\u09B0\u09C1\u09A8 \u0995\u09CD\u09AF\u09BE\u09A8\u09AD\u09BE\u09B8\u09C7\n                    "}</T></p>
                  </div>
                </div>))}
            </div>
          </main>
        </div>
      </div>
    </div>);
}
