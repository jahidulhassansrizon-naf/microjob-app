// app/bulk-photo-edit/page.tsx
"use client";

import { useState } from "react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { Upload, Plus, Sparkles } from "lucide-react";

export default function BulkPhotoEditPage() {
  const [images, setImages] = useState<string[]>([]);

  const stylePresets = [
    {
      id: 1,
      name: "Color Correction",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: 2,
      name: "Old Image to New",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: 3,
      name: "Light Correction",
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: 4,
      name: "Black & White to Color",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: 5,
      name: "Studio Quality",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ড্যাশবোর্ড নেভবার */}
      <DashboardNavbar />

      {/* মূল কন্টেন্ট এরিয়া */}
      <div className="flex-1 flex overflow-hidden">
        {/* ১. বাম পাশের সাইডবার */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="border-2 border-dashed border-gray-200 hover:border-orange-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition h-36 bg-orange-50/20">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF5D00] flex items-center justify-center font-bold mb-1">
              <Plus size={18} />
            </div>
            <span className="text-xs font-semibold text-gray-600">
              Add photos
            </span>
          </div>
        </div>

        {/* ২. মাঝখানের মূল আপলোড জোন (অরিজিনাল ওয়েবসাইটের মতো সিম্পল এবং ক্লিন করা হয়েছে) */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/30">
          <div className="bg-white border border-gray-200/80 shadow-xs rounded-2xl w-full max-w-md h-[380px] flex flex-col items-center justify-center p-6 text-center relative">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
              <Upload size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
              Add photos
            </h3>
            <p className="text-[11px] text-gray-400 mb-5">
              Drag & drop your images here
            </p>

            <label className="bg-[#FF5D00] hover:bg-[#e05200] text-white text-xs font-semibold px-5 py-2 rounded-xl cursor-pointer transition shadow-xs">
              Upload Photos
              <input type="file" multiple className="hidden" />
            </label>

            <span className="absolute bottom-4 text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
              Ctrl+U
            </span>
          </div>
        </div>

        {/* ৩. ডান পাশের স্টাইল প্রিসেট প্যানেল */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col gap-3 overflow-y-auto">
          <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            Style presets
          </h4>
          <p className="text-[11px] text-gray-400 -mt-2">
            Select one or more images first, then pick a style
          </p>

          <div className="grid grid-cols-2 gap-2.5 mt-1">
            {stylePresets.map((preset) => (
              <div
                key={preset.id}
                className="group relative rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:border-[#FF5D00] transition h-28 bg-gray-100 flex flex-col"
              >
                <div className="w-full h-20 overflow-hidden">
                  <img
                    src={preset.image}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="flex-1 bg-white flex items-center justify-center px-1 text-center">
                  <span className="text-gray-800 text-[10px] font-bold leading-tight line-clamp-1">
                    {preset.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* নিচে Enhance বাটন */}
          <div className="mt-auto pt-4">
            <button className="w-full bg-[#E5B573] hover:bg-[#d4a563] text-gray-900 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-xs">
              <Sparkles size={16} /> Enhance 0 photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
