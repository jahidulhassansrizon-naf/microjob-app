import React from "react";
import { Play } from "lucide-react";

const tutorials = [
  {
    id: 1,
    title: "কম্পিউটার দোকানের প্রতিদিনের কাজ",
    category: "টিউটোরিয়াল",
    thumbnail: "https://img.youtube.com/vi/placeholder1/hqdefault.jpg",
  },
  {
    id: 2,
    title: "AI Photo Editor দিয়ে সহজেই ছবি এডিট",
    category: "ফটো এডিটর",
    thumbnail: "https://img.youtube.com/vi/placeholder2/hqdefault.jpg",
  },
  {
    id: 3,
    title: "ম্যানুয়াল ছবির ব্যাকগ্রাউন্ড এডিট করুন",
    category: "ম্যানুয়াল এডিট",
    thumbnail: "https://img.youtube.com/vi/placeholder3/hqdefault.jpg",
  },
  {
    id: 4,
    title: "পিডিএফ ফাইল সাইজ ছোট করুন",
    category: "পিডিএফ",
    thumbnail: "https://img.youtube.com/vi/placeholder4/hqdefault.jpg",
  },
  {
    id: 5,
    title: "টেক্সট আইসোলেটর / Text Extractor",
    category: "টুলস",
    thumbnail: "https://img.youtube.com/vi/placeholder5/hqdefault.jpg",
  },
  {
    id: 6,
    title: "ইমেজ ব্যাকগ্রাউন্ড রিমুভ করুন",
    category: "ইমেজ টুলস",
    thumbnail: "https://img.youtube.com/vi/placeholder6/hqdefault.jpg",
  },
];

export default function HeroFeatures() {
  return (
    <section className="w-full bg-gray-50 py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-gray-900 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Play size={20} className="fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <span className="text-[11px] text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full font-medium inline-block mb-2">
                    {item.category}
                  </span>
                  <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2">
                    {item.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
