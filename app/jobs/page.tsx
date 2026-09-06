"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import {
  Search,
  Bookmark,
  Briefcase,
  Calendar,
  FileText,
  Link as LinkIcon,
  Sparkles,
  Users,
  Clock,
  Globe,
  Loader2,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  category: string;
  type: string;
  tags: string[];
  posts: string;
  published: string;
  deadlineText: string;
  deadlineDate: string;
}

export default function JobsPage() {
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

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // আপনার দেওয়া ছবি অনুযায়ী হুবহু ১১টি জবের রিয়েল ডেটা
  const jobsData: Job[] = [
    {
      id: 1,
      title: "কারিগরি শিক্ষা অধিদপ্তর (ডিটিই)",
      category: "ভার্চুয়াল অ্যাসিস্ট্যান্ট (প্রোডাকশনাল)",
      type: "Government",
      tags: ["Government", "ভার্চুয়াল অ্যাসিস্ট্যান্ট"],
      posts: "৫ জন",
      published: "২১ আগস্ট",
      deadlineText: "১৯ দিন বাকি",
      deadlineDate: "Deadline: ২১ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 2,
      title: "মেঘনা পেট্রোলিয়াম পিএলসি",
      category: "বিভিন্ন পদ",
      type: "Government",
      tags: ["Government", "৬টি ক্যাটাগরি"],
      posts: "১৫ জন",
      published: "৩০ আগস্ট",
      deadlineText: "২৫ দিন বাকি",
      deadlineDate: "Deadline: ৩০ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 3,
      title: "বাংলাদেশ হাই-টেক পার্ক কর্তৃপক্ষ",
      category: "বিভিন্ন পদ",
      type: "Government",
      tags: ["Government", "৯ম-১০ম গ্রেড"],
      posts: "৪২ জন",
      published: "২৬ আগস্ট",
      deadlineText: "২১ দিন বাকি",
      deadlineDate: "Deadline: ২৬ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 4,
      title: "জাতীয় জনসংখ্যা গবেষণা ও প্রশিক্ষণ ইনস্টিটিউট (নিপোর্ট)",
      category: "বিভিন্ন পদ",
      type: "Government",
      tags: ["Government", "বিভিন্ন পদ"],
      posts: "৮৬ জন",
      published: "২৯ আগস্ট",
      deadlineText: "৩ দিন বাকি",
      deadlineDate: "Deadline: ৮ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 5,
      title: "কারিগরি ও মাদরাসা শিক্ষা বিভাগ (টিএমইডি)",
      category: "বিভিন্ন পদ",
      type: "Government",
      tags: ["Government", "৫ ক্যাটাগরি"],
      posts: "২৬ জন",
      published: "২৭ আগস্ট",
      deadlineText: "২২ দিন বাকি",
      deadlineDate: "Deadline: ২৭ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 6,
      title: "বিভাগীয় কমিশনারের কার্যালয়, ঢাকা",
      category: "বিভিন্ন পদ",
      type: "Government",
      tags: ["Government", "৯ম-২০তম গ্রেড"],
      posts: "২০ জন",
      published: "২৬ আগস্ট",
      deadlineText: "২২ দিন বাকি",
      deadlineDate: "Deadline: ২৭ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 7,
      title: "কর কমিশনারের কার্যালয়, কর অঞ্চল-২, চট্টগ্রাম",
      category: "বিভিন্ন পদ",
      type: "Government",
      tags: ["Government"],
      posts: "৪২ জন",
      published: "২৫ আগস্ট",
      deadlineText: "১৩ দিন বাকি",
      deadlineDate: "Deadline: ১৮ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 8,
      title:
        "বাংলাদেশ রপ্তানি প্রক্রিয়াকরণ এলাকা কর্তৃপক্ষ, চট্টগ্রাম ইপিজেড হাসপাতাল",
      category: "বিভিন্ন পদ",
      type: "Government",
      tags: ["Government", "মেডিকেল অফিসার"],
      posts: "২০ জন",
      published: "২৪ আগস্ট",
      deadlineText: "২৫ দিন বাকি",
      deadlineDate: "Deadline: ৩০ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 9,
      title: "মাদকদ্রব্য নিয়ন্ত্রণ অধিদপ্তর",
      category: "সহকারী প্রসিকিউটর",
      type: "Government",
      tags: ["Government", "সহকারী প্রসিকিউটর"],
      posts: "৪১ জন",
      published: "১৭ আগস্ট",
      deadlineText: "১৯ দিন বাকি",
      deadlineDate: "Deadline: ২০ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 10,
      title: "বাংলাদেশ মাদরাসা শিক্ষা বোর্ড (বিএমইবি)",
      category: "বিভিন্ন পদ",
      type: "Government",
      tags: ["Government", "৬টি ক্যাটাগরি"],
      posts: "৪৬ জন",
      published: "৯ আগস্ট",
      deadlineText: "৪ দিন বাকি",
      deadlineDate: "Deadline: ৯ সেপ্টেম্বর, ২০২৬",
    },
    {
      id: 11,
      title: "বাংলাদেশ জুডিসিয়াল সার্ভিস কমিশন (বিজেএসসি)",
      category: "সহকারী জজ (সিভিল জজ - প্রবেশ পদ)",
      type: "Government",
      tags: ["Government", "সহকারী জজ"],
      posts: "২৫০ জন",
      published: "২৪ জুলাই",
      deadlineText: "১ দিন বাকি",
      deadlineDate: "Deadline: ৬ সেপ্টেম্বর, ২০২৬",
    },
  ];

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

      {/* মূল কন্টেন্ট */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* পেজ হেডার */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Government & Private Jobs
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Ongoing recruitment notices — apply in one click, never miss a
              deadline.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-xs w-fit">
            <Calendar size={14} className="text-[#FF5D00]" />
            <span>Sunday, 28 June 2026</span>
          </div>
        </div>

        {/* টপ অ্যাকশন বাটনস */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="flex items-center justify-center gap-2 bg-[#F3A847] hover:bg-[#e0973d] text-white font-bold py-3 px-4 rounded-2xl text-xs transition shadow-xs cursor-pointer">
            <Sparkles size={16} /> Form Auto Fill-up
          </button>
          <button className="flex items-center justify-center gap-2 bg-[#8B4513] hover:bg-[#72370f] text-white font-bold py-3 px-4 rounded-2xl text-xs transition shadow-xs cursor-pointer">
            <FileText size={16} /> Create Advertisement
          </button>
          <button className="flex items-center justify-center gap-2 bg-[#2E7D32] hover:bg-[#256628] text-white font-bold py-3 px-4 rounded-2xl text-xs transition shadow-xs cursor-pointer">
            <Briefcase size={16} /> Age Calculator
          </button>
          <button className="flex items-center justify-center gap-2 bg-[#1565C0] hover:bg-[#104f94] text-white font-bold py-3 px-4 rounded-2xl text-xs transition shadow-xs cursor-pointer">
            <LinkIcon size={16} /> Useful Links
          </button>
        </div>

        {/* সার্চ এবং ফিল্টার বার */}
        <div className="bg-white border border-gray-200/80 p-4 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search
                size={16}
                className="absolute left-4 top-3.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by organization or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#FF5D00]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <button className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 transition cursor-pointer">
                <Bookmark size={14} className="text-gray-400" /> Saved
              </button>
              <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 transition cursor-pointer">
                Deadline
              </button>
              <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 transition cursor-pointer">
                More posts
              </button>
              <button className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs font-bold text-[#FF5D00] transition cursor-pointer">
                Newest
              </button>
            </div>
          </div>

          {/* ক্যাটাগরি ফিল্টার ট্যাগস */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              "all",
              "government",
              "defense",
              "bank",
              "education",
              "private",
              "expired",
            ].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition cursor-pointer ${
                  activeFilter === filter
                    ? "bg-[#FF5D00] text-white shadow-xs"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                {filter === "all" ? "All ১১" : filter}
              </button>
            ))}
          </div>
        </div>

        {/* টোটাল নোটিশ কাউন্ট */}
        <p className="text-xs font-bold text-gray-600">১১ notices found</p>

        {/* জব কার্ড গ্রিড (১১টি কার্ড হুবহু ছবির মতো) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobsData.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                      🏛️
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                        {job.category}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-300 hover:text-[#FF5D00] transition cursor-pointer">
                    <Bookmark size={16} />
                  </button>
                </div>

                {/* ট্যাগ ও পোস্টের বিবরণ */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-orange-50 text-[#FF5D00] text-[10px] font-extrabold px-2.5 py-1 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-gray-400" /> Posts{" "}
                    {job.posts}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-gray-400" /> Published{" "}
                    {job.published}
                  </span>
                </div>
              </div>

              {/* ডেডলাইন এবং বাটন সেকশন */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
                <div>
                  <span className="inline-block bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-lg mb-1">
                    ⏳ {job.deadlineText}
                  </span>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {job.deadlineDate}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 bg-white transition shadow-xs cursor-pointer">
                    Details
                  </button>
                  <button className="bg-[#FF5D00] hover:bg-[#e05200] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer">
                    Apply →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
