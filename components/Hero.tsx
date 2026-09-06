import {
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  Sliders,
  Layers,
  Check,
  Info,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="w-full bg-transparent min-h-[calc(100vh-90px)] flex items-center py-8 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6">
          <div className="inline-block bg-orange-100/80 border border-[#FEA51F] text-black text-[14px] font-medium px-4 py-1.5 rounded-full shadow-xs">
            35000+ Active Users
          </div>

          <h1 className="text-[55px] leading-[81px] font-black text-gray-950 tracking-tight">
            <span className="whitespace-nowrap">
              All your <span className="text-amber-500">digital work</span>
            </span>{" "}
            <br className="hidden md:inline" />
            <span className="text-[#FC4D0B]">in one place,</span> simple{" "}
            <br className="hidden md:inline" />
            and secure
          </h1>

          <p className="text-gray-800 text-sm md:text-base max-w-xl leading-relaxed font-semibold">
            Photo edit, AI photo edit, manual edit and bulk edit, plus
            documents, design and print media — use them all with ease.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-7 py-3 rounded-full font-bold flex items-center gap-2 hover:opacity-95 transition shadow-lg shadow-orange-300/50 text-sm">
              Get Started Now <ArrowRight size={16} />
            </button>
            <button className="flex items-center gap-2 text-gray-700 bg-white/80 border border-gray-200 px-6 py-3 rounded-full font-semibold text-sm hover:bg-white transition shadow-xs">
              <Play size={14} className="text-amber-500 fill-amber-500" /> Watch
              Demo Video
            </button>
          </div>

          {/* Feature Bullets */}
          <div className="flex flex-wrap gap-5 text-xs text-gray-600 pt-6 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" /> Photo edit
              in one click
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-sky-500" /> All tools in
              one place
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-purple-500" /> Save time,
              reduce hassle
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 xl:col-span-6 relative flex justify-center lg:justify-end items-center min-h-[400px] pl-4 md:pl-0">
          {/* Main Base Card */}
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-purple-900/10 border border-white/80 relative z-10 overflow-hidden">
            {/* Top Header Bar */}
            <div className="bg-gradient-to-r from-[#C22361] via-[#A01A8A] to-[#8C00FF] h-16 px-6 flex items-center justify-end gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-white/60"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            </div>

            {/* Card Content Body */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-2xl border border-orange-100/80">
                <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-xs">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    AI Photo Edit
                  </h4>
                  <p className="text-xs text-gray-500">Smart auto editing</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-2xl border border-purple-100/80">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
                  <Sliders size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    Manual edit
                  </h4>
                  <p className="text-xs text-gray-500">Edit as you wish.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/80">
                <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-xs">
                  <Layers size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    Bulk photo edit
                  </h4>
                  <p className="text-xs text-gray-500">
                    Many pictures together
                  </p>
                </div>
              </div>

              <div className="text-right pt-1">
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  In an instant
                </span>
              </div>
            </div>
          </div>

          {/* Floating Card 1 */}
          <div className="absolute -top-[1px] left-4 md:left-12 z-20 bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-xl border border-gray-100 flex flex-col justify-center gap-2 w-60 h-[104px]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-md shrink-0">
                <Check size={18} strokeWidth={3} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium leading-tight">
                  Time saved per month
                </p>
                <p className="text-sm font-bold text-gray-800">120+ Hours</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full w-[75%] rounded-full"></div>
            </div>
          </div>

          {/* Floating Card 2 */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-6 z-20 bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 text-white p-5 rounded-2xl shadow-2xl w-56 sm:w-60 h-[150px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[11px] opacity-90 font-medium">
                Total documents created
              </p>
              <div className="bg-white/20 p-1 rounded-full text-white">
                <Info size={14} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight leading-none">
                300000+
              </h3>
              <p className="text-lg font-bold tracking-tight">Images</p>
            </div>
            <p className="text-[11px] opacity-90 font-light">
              edited using SohozKaj
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
