import { T, useI18n } from "@/components/i18n/I18nProvider";
import React from "react";
import { Play } from "lucide-react";
const tutorials = [
    {
        id: 1,
        title: "কম্পিউটার দোকানের প্রতিদিনের কাজ",
        category: "টিউটোরিয়াল",
    },
    {
        id: 2,
        title: "AI Photo Editor দিয়ে সহজেই ছবি এডিট",
        category: "ফটো এডিটর",
    },
    {
        id: 3,
        title: "ম্যানুয়াল ছবির ব্যাকগ্রাউন্ড এডিট করুন",
        category: "ম্যানুয়াল এডিট",
    },
    {
        id: 4,
        title: "পিডিএফ ফাইল সাইজ ছোট করুন",
        category: "পিডিএফ",
    },
    {
        id: 5,
        title: "টেক্সট আইসোলেটর / Text Extractor",
        category: "টুলস",
    },
    {
        id: 6,
        title: "ইমেজ ব্যাকগ্রাউন্ড রিমুভ করুন",
        category: "ইমেজ টুলস",
    },
];
export default function HeroFeatures() {
    const { t } = useI18n();
    return (<section className="w-full bg-gray-50 py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((item) => (<div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              {/* Thumbnail Container */}
              <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl" />
                <div className="relative z-10 flex flex-col items-center gap-2 text-slate-300">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/85">
                    <Play size={18} className="ml-0.5 fill-current" />
                  </div>
                  <span className="text-[10px] font-medium"><T>{"Video coming soon"}</T></span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <span className="text-[11px] text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full font-medium inline-block mb-2">
                    {<T>{item.category}</T>}
                  </span>
                  <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2">
                    {<T>{item.title}</T>}
                  </h3>
                </div>
              </div>
            </div>))}
        </div>
      </div>
    </section>);
}
