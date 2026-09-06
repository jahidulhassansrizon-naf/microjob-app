// app/dashboard/_components/LatestJobs.tsx
"use client";

import {
  Briefcase,
  Clock,
  Calendar,
  Users,
  Globe,
  ArrowRight,
} from "lucide-react";

export default function LatestJobs() {
  const jobs = [
    {
      company: "কারিগরি শিক্ষা অধিদপ্তর (DTE)",
      title: "ওয়ার্কশপ অ্যাসিস্ট্যান্ট (প্রবেশপদ)",
      tags: ["Government", "ওয়ার্কশপ অ্যাসিস্ট্যান্ট"],
      posts: "৬ জন",
      published: "৩১ আগস্ট",
      type: "অনলাইন আবেদন",
      daysLeft: "১৭ দিন বাকি",
      deadline: "১৬ সেপ্টেম্বর, ২০২৬",
    },
    {
      company: "মেঘনা পেট্রোলিয়াম পিএলসি",
      title: "বিভিন্ন পদ",
      tags: ["Government", "৩টি ক্যাটাগরি"],
      posts: "১৬ জন",
      published: "০৩ আগস্ট",
      type: "অনলাইন আবেদন",
      daysLeft: "১৯ দিন বাকি",
      deadline: "০৩ সেপ্টেম্বর, ২০২৬",
    },
    {
      company: "বাংলাদেশ হাই-টেক পার্ক কর্তৃপক্ষ",
      title: "বিভিন্ন পদ",
      tags: ["Government", "৯ম-১০ম গ্রেড"],
      posts: "৪২ জন",
      published: "২৬ আগস্ট",
      type: "অনলাইন আবেদন",
      daysLeft: "২১ দিন বাকি",
      deadline: "১৬ সেপ্টেম্বর, ২০২৬",
    },
  ];

  return (
    <div className="bg-orange-50/40 border border-orange-100 rounded-2xl p-5 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF5D00] flex items-center justify-center">
            <Briefcase size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Latest Jobs</h3>
            <p className="text-[10px] text-gray-400 font-medium">
              Newest recruitment notices
            </p>
          </div>
        </div>
        <button className="bg-[#FF5D00] hover:bg-orange-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-all">
          View all jobs <ArrowRight size={14} />
        </button>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {jobs.map((job, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-orange-100 text-[#FF5D00] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <Briefcase size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-snug">
                    {job.company}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {job.title}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 my-2.5">
                {job.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="bg-orange-50 text-[#FF5D00] text-[9px] font-bold px-2 py-0.5 rounded-md border border-orange-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-gray-500 my-2">
                <span className="flex items-center gap-1">
                  <Users size={12} className="text-gray-400" /> Posts{" "}
                  {job.posts}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-gray-400" /> Published{" "}
                  {job.published}
                </span>
                <span className="flex items-center gap-1">
                  <Globe size={12} className="text-gray-400" /> {job.type}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <Clock size={11} /> {job.daysLeft}
                </span>
                <p className="text-[9px] text-gray-400">
                  Deadline {job.deadline}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-md transition-all">
                  Details
                </button>
                <button className="bg-[#FF5D00] hover:bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all">
                  Apply <ArrowRight size={10} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
