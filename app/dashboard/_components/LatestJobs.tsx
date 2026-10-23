// app/dashboard/_components/LatestJobs.tsx
"use client";
import { DT } from "./DashboardText";
import { Briefcase, Clock, Calendar, Users, Globe, ArrowRight, } from "lucide-react";
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
    return (<div className="bg-[#D42020]/40 border border-[#D42020] rounded-2xl p-5 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#D42020] text-[#D42020] flex items-center justify-center">
            <Briefcase size={18}/>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#3B2F1E]"><DT>{"Latest Jobs"}</DT></h3>
            <p className="text-[12px] text-[#7A6A50] font-medium"><DT>{"Newest recruitment notices\r\n            "}</DT></p>
          </div>
        </div>
        <button className="bg-[#D42020] hover:bg-[#AE1717] text-white text-sm font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"><DT>{"View all jobs "}</DT><ArrowRight size={14}/>
        </button>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {jobs.map((job, idx) => (<div key={idx} className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#D42020] text-[#D42020] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  <Briefcase size={14}/>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#3B2F1E] leading-snug">
                    {job.company}
                  </h4>
                  <p className="text-[13px] text-[#7A6A50] font-medium">
                    {job.title}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 my-2.5">
                {job.tags.map((tag, tIdx) => (<span key={tIdx} className="bg-[#D42020] text-[#D42020] text-[11px] font-bold px-2 py-0.5 rounded-md border border-[#D42020]">
                    {tag}
                  </span>))}
              </div>

              <div className="flex items-center gap-3 text-[12px] text-[#7A6A50] my-2">
                <span className="flex items-center gap-1">
                  <Users size={12} className="text-[#7A6A50]"/><DT>{"Posts"}</DT>{<DT>{" "}</DT>}
                  {job.posts}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-[#7A6A50]"/><DT>{"Published"}</DT>{<DT>{" "}</DT>}
                  {job.published}
                </span>
                <span className="flex items-center gap-1">
                  <Globe size={12} className="text-[#7A6A50]"/> {job.type}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E3D6B8] flex items-center justify-between mt-2">
              <div>
                <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1">
                  <Clock size={11}/> {job.daysLeft}
                </span>
                <p className="text-[11px] text-[#7A6A50]"><DT>{"Deadline "}</DT>{job.deadline}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="border border-[#E3D6B8] hover:bg-[#F6EEDB] text-[#5A4A32] text-[12px] font-bold px-2.5 py-1 rounded-md transition-all"><DT>{"Details\r\n                "}</DT></button>
                <button className="bg-[#D42020] hover:bg-[#AE1717] text-white text-[12px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all"><DT>{"Apply "}</DT><ArrowRight size={10}/>
                </button>
              </div>
            </div>
          </div>))}
      </div>
    </div>);
}
