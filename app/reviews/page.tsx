"use client";

import { useState } from "react";
import Footer from "@/components/Footer";
import {
  Star,
  MessageSquareText,
  MessageSquare,
  Quote,
  Wrench,
  MessageCircle,
  Globe,
  Gift,
  Play,
  X,
  ChevronRight,
} from "lucide-react";

export default function ReviewsPage() {
  // ৮ জন কাস্টমারের ভিডিও তথ্য ও ইউটিউব শর্টস আইডি
  const videoReviewsData = [
    {
      id: 1,
      name: "অনম",
      shop: "দোকান নং ১২৯, সপ্তপদী মার্কেট, ৭ মাথা, বগুড়া",
      youtubeId: "t-4E7lvZ-AE",
      title: "Customer Review 01 | SohozKaj",
    },
    {
      id: 2,
      name: "নাহিদ হাসান",
      shop: "ফকির ইন্টারন্যাশনাল, জেলা পরিষদ, বগুড়া",
      youtubeId: "4DCxByiuKsE",
      title: "Customer Review 02 | SohozKaj",
    },
    {
      id: 3,
      name: "ইমতিয়াজ হোসেন",
      shop: "তাজমা কম্পিউটার এন্ড সিস্টেম, সপ্তপদী মার্কেট, ৭ মাথা, বগুড়া",
      youtubeId: "7pfHV_1T3Xo",
      title: "Customer Review 03 | SohozKaj",
    },
    {
      id: 4,
      name: "নাহিদ হাসান",
      shop: "সপ্তপদী মার্কেট, ২য় তলা, ৭ মাথা, বগুড়া",
      youtubeId: "dVGVNzj86kQ",
      title: "Customer Review 04 | SohozKaj",
    },
    {
      id: 5,
      name: "মো: সোহাগ",
      shop: "মলি কম্পিউটার, সপ্তপদী মার্কেট, ২য় তলা, সাতমাথা, বগুড়া",
      youtubeId: "uJjuPlc5n68",
      title: "Customer Review 05 | SohozKaj",
    },
    {
      id: 6,
      name: "আপেল মাহমুদ",
      shop: "সপ্তপদী মার্কেট, ২য় তলা, ৭ মাথা, বগুড়া",
      youtubeId: "dZMI2R-7dTQ",
      title: "Customer Review 06 | SohozKaj",
    },
    {
      id: 7,
      name: "মাসুদ রানা",
      shop: "মিল্লাত প্লাজা, জজ কোর্ট সংলগ্ন, জেলা পরিষদ, বগুড়া",
      youtubeId: "1oOrDZ6a3HI",
      title: "Customer Review 07 | SohozKaj",
    },
    {
      id: 8,
      name: "মো: শাকিল মিয়া",
      shop: "পুলিশ সুপার কার্যালয়ের অপজিটে, বগুড়া সদর, বগুড়া",
      youtubeId: "4uPC1QAjmQY",
      title: "Customer Review 08 | SohozKaj",
    },
  ];

  // টেক্সট রিভিউ ডাটা
  const textReviews = [
    {
      quote:
        "We use SohojKaj to create business cards, flyers and notices for our shop very quickly. We no longer depend on a designer — we finish the work ourselves in minutes.",
      name: "Anom",
      shop: "Shop 129, Saptapadi Market, 7th Mor, Bogura",
    },
    {
      quote:
        "Having print media and document templates in one place has made our work much easier. The Bangla interface is easy to understand, so we can serve customers faster.",
      name: "Nahid Hasan",
      shop: "Fakir International, District Council, Bogura",
    },
    {
      quote:
        "As a computer shop we often handle NID, passport and visiting card jobs. SohojKaj tools make photo resizing and PDF creation fast.",
      name: "Imtiaz Hossain",
      shop: "Tajma Computer & System, Saptapadi Market, 7th Mor, Bogura",
    },
    {
      quote:
        "SohojKaj truly saves time for our shop. We edit templates and get print-ready files — customers stay happy too.",
      name: "Moli Computer",
      shop: "Saptapadi Market, 2nd Floor, Satmatha, Bogura",
    },
    {
      quote:
        "Our print shop gets many jobs daily. With ready-made designs on SohojKaj we just add details and deliver fast — revenue has grown too.",
      name: "Rakibul Islam",
      shop: "Rakib Printing & Stationery, Thanchania, Bogura",
    },
    {
      quote:
        "SohojKaj is very useful for family cards, fuel forms and government documents. Live preview helps reduce mistakes.",
      name: "Salma Akter",
      shop: "Smart Digital Center, Sherpur Road, Bogura",
    },
    {
      quote:
        "SohojKaj is excellent and perfect for beautiful photo work. I would give it a hundred out of a hundred.",
      name: "Masud Rana",
      shop: "Millat Plaza, near Judge Court, Bogura",
    },
    {
      quote:
        "Using SohojKaj.com I do various photo editing, ID cards, banners and many other tasks — and I really like it. So I want to thank everyone at SohojKaj.com.",
      name: "Apel Mahamud",
      shop: "Saptapadi Market, 2nd Floor, Bogura",
    },
    {
      quote:
        "I use SohojKaj tools, I do photo editing work here. The photo editing gets done very fast.",
      name: "Md Shakil Mia",
      shop: "Opposite the Police Super's Office, Bogura",
    },
  ];

  // পপআপ প্লেয়ারের জন্য স্টেট
  const [selectedVideo, setSelectedVideo] = useState<
    (typeof videoReviewsData)[0] | null
  >(null);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col relative">
      {/* 1. Header Banner Block */}
      <section
        className="w-full py-12 sm:py-16 px-4 flex flex-col items-center justify-center text-center relative overflow-hidden"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 50%, #F7F4F9 0%, #F0EAE6 50%, #EBE2DD 100%)",
        }}
      >
        <div className="inline-flex items-center px-4 py-1 rounded-full border border-[#FF8C00]/60 bg-white/40 text-[#C84B15] text-xs sm:text-sm font-medium mb-6 shadow-2xs">
          Customer Reviews
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">
          What Our <span className="text-[#FF6B00]">Customers Say</span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-gray-700 max-w-xl font-normal leading-relaxed">
          Print shops, digital centers and shop owners across the country share
          their real experiences with SohojKaj.
        </p>
      </section>

      {/* 2. Main Content Section */}
      <main className="flex-grow max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-16 sm:pb-24 w-full flex flex-col items-center">
        {/* Video Review Sub-header Strip */}
        <div className="w-full flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-700 font-medium mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-gray-900 flex items-center justify-center">
              <Play size={8} className="fill-gray-900 text-gray-900 ml-0.5" />
            </div>
            <span className="font-bold text-gray-900">ভিডিও রিভিউ</span>
          </div>
          <span className="text-gray-600 font-normal">
            <strong className="font-semibold text-gray-800">8টি ভিডিও</strong>—
            গ্রাহকদের সরাসরি কথা
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="text-gray-500 font-normal">
            সম্পাদনা ছাড়াই - নিজের মুখেই
          </span>
        </div>

        {/* Video Thumbnail Reviews Section (8 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full mb-16 sm:mb-24">
          {videoReviewsData.map((item, index) => {
            const itemNumber = index + 1;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedVideo(item)}
                className="rounded-3xl sm:rounded-[24px] overflow-hidden shadow-lg relative h-[380px] sm:h-[420px] flex flex-col justify-end p-5 sm:p-6 text-white group bg-cover bg-center cursor-pointer transform transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  backgroundImage: `url('/reviews/review-${itemNumber}.jpg')`,
                }}
              >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 z-0 transition-opacity group-hover:opacity-90"></div>

                {/* Rating Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-white/10">
                  <Star size={12} fill="currentColor" /> 5.0 Rating
                </div>

                {/* Center White Glassmorphism Play Button */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110">
                    <Play
                      size={22}
                      fill="currentColor"
                      className="ml-0.5 text-white drop-shadow-md"
                    />
                  </div>
                </div>

                {/* কাস্টমার ইনফো */}
                <div className="z-10 flex flex-col">
                  <h4 className="text-sm font-bold">{item.name}</h4>
                  <span className="text-[11px] text-gray-300 leading-tight">
                    {item.shop}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider / Section Header for Text Reviews */}
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8 bg-orange-50 border border-orange-100 p-4 rounded-2xl">
          <div className="bg-orange-500 text-white p-2 rounded-xl shrink-0">
            <MessageSquareText size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                Text Reviews
              </span>
              <span className="text-xs font-bold text-gray-700">
                {textReviews.length} written reviews from real customers
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Print shops & digital centers
            </p>
          </div>
        </div>

        {/* Text Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full mb-16 sm:mb-20">
          {textReviews.map((rev, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition flex flex-col justify-between relative group"
            >
              <div>
                <div className="text-orange-500 mb-4 bg-orange-50 w-10 h-10 rounded-2xl flex items-center justify-center">
                  <Quote size={20} />
                </div>
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-normal mb-6 sm:mb-8">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {rev.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    {rev.name}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
                    {rev.shop}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Share Your Review Section - White transition pushed lower down */}
        <div
          className="w-full border border-[#F2E8DC]/80 rounded-[32px] p-6 sm:p-10 md:p-12 flex flex-col items-center text-center shadow-2xs overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #FFF7ED 0%, #FFF7ED 25%, #FFFFFF 58%)",
          }}
        >
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1.5">
            Share your review
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mb-10">
            4 simple steps &middot; text or video
          </p>

          {/* 4 Steps Container */}
          <div className="w-full max-w-5xl mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-3 items-center relative">
              {/* Step 1 */}
              <div className="relative bg-white border border-gray-100/80 rounded-2xl p-6 shadow-2xs flex flex-col items-center justify-center text-center h-full">
                <div className="relative mb-5">
                  <div className="w-14 h-14 bg-[#FFF3E0] text-[#FB8C00] rounded-2xl flex items-center justify-center">
                    <Wrench size={24} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF9800] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    1
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-2">
                  Use SohojKaj
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-[180px]">
                  Try documents, tools or print media yourself first.
                </p>
              </div>

              {/* Chevron Arrow 1-2 */}
              <div className="hidden lg:flex absolute left-[24.2%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 text-gray-300 pointer-events-none">
                <ChevronRight size={18} strokeWidth={2.5} />
              </div>

              {/* Step 2 */}
              <div className="relative bg-white border border-gray-100/80 rounded-2xl p-6 shadow-2xs flex flex-col items-center justify-center text-center h-full">
                <div className="relative mb-5">
                  <div className="w-14 h-14 bg-[#F3E5F5] text-[#8E24AA] rounded-2xl flex items-center justify-center">
                    <MessageSquare size={22} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#7C4DFF] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    2
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-2">
                  Write your feedback
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-[180px]">
                  Prepare a short written note or a one-minute video.
                </p>
              </div>

              {/* Chevron Arrow 2-3 */}
              <div className="hidden lg:flex absolute left-[49.5%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 text-gray-300 pointer-events-none">
                <ChevronRight size={18} strokeWidth={2.5} />
              </div>

              {/* Step 3 */}
              <div className="relative bg-white border border-gray-100/80 rounded-2xl p-6 shadow-2xs flex flex-col items-center justify-center text-center h-full">
                <div className="relative mb-5">
                  <div className="w-14 h-14 bg-[#E8F5E9] text-[#2E7D32] rounded-2xl flex items-center justify-center">
                    <MessageCircle size={24} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#10B981] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    3
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-2">
                  Send on WhatsApp
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-[180px]">
                  Send on WhatsApp with your name, shop and area.
                </p>
              </div>

              {/* Chevron Arrow 3-4 */}
              <div className="hidden lg:flex absolute left-[74.8%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 text-gray-300 pointer-events-none">
                <ChevronRight size={18} strokeWidth={2.5} />
              </div>

              {/* Step 4 */}
              <div className="relative bg-white border border-gray-100/80 rounded-2xl p-6 shadow-2xs flex flex-col items-center justify-center text-center h-full">
                <div className="relative mb-5">
                  <div className="w-14 h-14 bg-[#E0F2F1] text-[#00897B] rounded-2xl flex items-center justify-center">
                    <Globe size={24} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#009688] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    4
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-2">
                  We publish
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-[180px]">
                  We verify and publish it on this page.
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Button */}
          <a
            href="https://api.whatsapp.com/send/?phone=8801700559595&text=Assalamu+Alaikum%2C+I+want+to+submit+a+review+about+SohozKaj.&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs md:text-sm px-7 py-3 rounded-full flex items-center gap-2.5 shadow-md shadow-emerald-200/50 transition mb-10 cursor-pointer"
          >
            <MessageCircle size={18} fill="currentColor" /> Send review on
            WhatsApp
          </a>

          {/* Monthly Gift Banner */}
          <div className="w-full max-w-5xl bg-[#FFF8F0] border border-[#FFE8D1] rounded-2xl p-3.5 sm:px-6 flex items-center justify-center gap-3 text-xs sm:text-sm">
            <div className="w-8 h-8 rounded-lg bg-[#FFE0B2] text-[#D84315] flex items-center justify-center shrink-0">
              <Gift size={18} />
            </div>
            <div className="text-left font-normal text-gray-700">
              <strong className="font-bold text-[#B71C1C]">
                Monthly gift:
              </strong>{" "}
              Every month, 3 reviewers will be chosen by lottery to receive a
              T-shirt gift.
            </div>
          </div>
        </div>
      </main>

      {/* 3. VIDEO REVIEW POPUP MODAL */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-300"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-[380px] sm:max-w-[400px] h-[82vh] max-h-[720px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Right Close Button */}
            <div className="absolute top-3 right-3 z-30 pointer-events-none">
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white transition cursor-pointer shrink-0 pointer-events-auto shadow-lg"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* YouTube Shorts Embed Player */}
            <div className="w-full h-full relative z-10 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideo.name}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none flex items-end justify-between">
              <div className="flex flex-col text-white max-w-[80%]">
                <h4 className="text-sm font-bold text-white leading-snug drop-shadow-md">
                  {selectedVideo.name}
                </h4>
                <p className="text-[11px] text-gray-200 font-normal leading-relaxed drop-shadow-sm">
                  {selectedVideo.shop}
                </p>
              </div>

              {/* Shorts Badge */}
              <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold border border-white/10 shrink-0">
                Shorts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
