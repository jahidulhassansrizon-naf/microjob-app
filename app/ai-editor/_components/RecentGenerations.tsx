"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  ExternalLink,
} from "lucide-react";

export default function RecentGenerations({
  generations,
  onImageClick,
  isLoading = false, // 🚀 নতুন লোডিং প্রপস
}) {
  return (
    <div className="w-full max-w-[1400px] bg-white rounded-2xl p-4 sm:p-6 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
          <h3 className="font-semibold text-sm text-gray-800">
            RECENT GENERATIONS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer">
            <ChevronRight size={16} />
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer">
            <ExternalLink size={14} /> View all images
          </button>
          <button className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 min-h-[150px] items-center">
        {/* 🚀 লোডিং চলাকালীন স্কেলিটন অ্যানিমেশন দেখাবে */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="w-28 h-36 rounded-xl bg-gray-200 animate-pulse shrink-0 border border-gray-100 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          ))
        ) : !generations || generations.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            No recent generations yet. Click "Generate Photo" to add images
            here.
          </p>
        ) : (
          generations.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onImageClick(item)}
              className="w-28 h-36 rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:border-orange-500 hover:shadow-md transition relative group shrink-0 bg-gray-50 flex items-center justify-center"
            >
              <img
                src={item.url}
                alt="Generated"
                className="w-full h-full object-cover"
                style={{ backgroundColor: item.bgColor }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                View
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
