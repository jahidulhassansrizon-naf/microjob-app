"use client";

import Footer from "@/components/Footer";
import {
  Star,
  MessageSquareText,
  Quote,
  Wrench,
  MessageCircle,
  Globe,
  Gift,
  Play,
} from "lucide-react";

export default function ReviewsPage() {
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

  // ৮ জন রিয়েল কাস্টমারদের তথ্য (ভিডিও থাম্বনেইল কার্ডের জন্য)
  const videoReviewsData = [
    { name: "অনম", shop: "দোকান নং ১২৯, সপ্তপদী মার্কেট, ৭ মাথা, বগুড়া" },
    { name: "নাহিদ হাসান", shop: "ফকির ইন্টারন্যাশনাল, জেলা পরিষদ, বগুড়া" },
    {
      name: "ইমতিয়াজ হোসেন",
      shop: "তাজমা কম্পিউটার এন্ড সিস্টেম, সপ্তপদী মার্কেট, ৭ মাথা, বগুড়া",
    },
    { name: "নাহিদ হাসান", shop: "সপ্তপদী মার্কেট, ২য় তলা, ৭ মাথা, বগুড়া" },
    {
      name: "মো: সোহাগ",
      shop: "মলি কম্পিউটার, সপ্তপদী মার্কেট, ২য় তলা, সাতমাথা, বগুড়া",
    },
    { name: "আপেল মাহমুদ", shop: "সপ্তপদী মার্কেট, ২য় তলা, ৭ মাথা, বগুড়া" },
    {
      name: "মাসুদ রানা",
      shop: "মিল্লাত প্লাজা, জজ কোর্ট সংলগ্ন, জেলা পরিষদ, বগুড়া",
    },
    {
      name: "মো: শাকিল মিয়া",
      shop: "পুলিশ সুপার কার্যালয়ের অপজিটে, বগুড়া সদর, বগুড়া",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-gray-900 flex flex-col">
      {/* Navbar */}

      {/* Main Review Section */}
      <main className="flex-grow max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-24 w-full flex flex-col items-center">
        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-center tracking-tight text-gray-900 mb-3">
          What Our{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
            Customers Say
          </span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-gray-500 text-center max-w-xl mb-8 sm:mb-12 font-medium leading-relaxed">
          Print shops, digital centers and shop owners across the country share
          their experiences with SohojKaj.
        </p>

        {/* 1. Video Thumbnail Reviews Section (8 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full mb-16 sm:mb-24">
          {videoReviewsData.map((item, index) => {
            const itemNumber = index + 1;
            return (
              <div
                key={itemNumber}
                className="rounded-3xl sm:rounded-[24px] overflow-hidden shadow-lg relative h-[380px] sm:h-[420px] flex flex-col justify-end p-5 sm:p-6 text-white group bg-cover bg-center cursor-pointer"
                style={{
                  backgroundImage: `url('/reviews/review-${itemNumber}.jpg')`,
                }}
              >
                {/* Dark Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 z-0 transition-opacity group-hover:opacity-90"></div>

                {/* Rating Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-white/10">
                  <Star size={12} fill="currentColor" /> 5.0 Rating
                </div>

                {/* Center White Glassmorphism Play Button */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
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

        {/* 2. Text Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full mb-16 sm:mb-20">
          {textReviews.map((rev, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group"
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

        {/* 3. Share Your Review Section */}
        <div className="w-full bg-white border border-gray-100 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 md:p-12 shadow-sm flex flex-col items-center text-center">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-2">
            Share your review
          </h3>
          <p className="text-xs md:text-sm text-gray-400 font-semibold mb-8 sm:mb-10">
            4 simple steps - text or video
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl mb-8 sm:mb-10 relative">
            <div className="bg-white border border-gray-100 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col items-center relative">
              <div className="absolute top-3 right-3 bg-orange-100 text-orange-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                1
              </div>
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
                <Wrench size={22} />
              </div>
              <h4 className="text-xs font-bold text-gray-900 mb-1">
                Use SohojKaj
              </h4>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                Try documents, tools or print media yourself first.
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col items-center relative">
              <div className="absolute top-3 right-3 bg-orange-100 text-orange-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                2
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquareText size={22} />
              </div>
              <h4 className="text-xs font-bold text-gray-900 mb-1">
                Write your feedback
              </h4>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                Prepare a short written note or a one-minute video.
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col items-center relative">
              <div className="absolute top-3 right-3 bg-orange-100 text-orange-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                3
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={22} />
              </div>
              <h4 className="text-xs font-bold text-gray-900 mb-1">
                Send on WhatsApp
              </h4>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                Send on WhatsApp with your name, shop and area.
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col items-center relative">
              <div className="absolute top-3 right-3 bg-orange-100 text-orange-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                4
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                <Globe size={22} />
              </div>
              <h4 className="text-xs font-bold text-gray-900 mb-1">
                We publish
              </h4>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                We verify and publish it on this page.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/your-number"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs md:text-sm px-6 py-3.5 rounded-full flex items-center gap-2 shadow-md transition mb-6 sm:mb-8 text-center"
          >
            <MessageCircle size={18} fill="currentColor" /> Send review on
            WhatsApp
          </a>

          <div className="bg-[#FFF8F0] border border-orange-200/60 rounded-2xl px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-medium text-gray-700 max-w-xl w-full text-center sm:text-left">
            <span className="text-orange-500 shrink-0">
              <Gift size={16} />
            </span>
            <span>
              <strong className="text-gray-900">Monthly gift:</strong> Every
              month, 3 reviewers will be chosen by lottery to receive a t-shirt
              gift.
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
