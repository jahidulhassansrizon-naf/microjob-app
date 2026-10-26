// app/reviews/page.tsx
"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import Footer from "@/components/Footer";
import {
  Star,
  Quote,
  Wrench,
  PenLine,
  MessageCircle,
  Globe,
  Gift,
  Play,
  X,
  Clapperboard,
  BadgeCheck,
  MapPin,
} from "lucide-react";

/**
 * ভিডিও রিভিউ রেডি হলে শুধু এটা `true` করে দিন।
 * তখন নিচের "Coming Soon" সেকশন সরে গিয়ে আগের মতো ৮টা ভিডিও কার্ড + পপআপ প্লেয়ার চালু হবে।
 * (ছবি: /public/reviews/review-1.jpg ... review-8.jpg)
 */
const VIDEOS_READY = false;

const videoReviewsData = [
  {
    id: 1,
    name: "অনম",
    nameEn: "Anom",
    shop: "দোকান নং ১২৯, সপ্তপদী মার্কেট, ৭ মাথা, বগুড়া",
    shopEn: "Shop 129, Saptapadi Market, 7 Matha, Bogura",
    youtubeId: "t-4E7lvZ-AE",
  },
  {
    id: 2,
    name: "নাহিদ হাসান",
    nameEn: "Nahid Hasan",
    shop: "ফকির ইন্টারন্যাশনাল, জেলা পরিষদ, বগুড়া",
    shopEn: "Fakir International, District Council, Bogura",
    youtubeId: "4DCxByiuKsE",
  },
  {
    id: 3,
    name: "ইমতিয়াজ হোসেন",
    nameEn: "Imtiaz Hossain",
    shop: "তাজমা কম্পিউটার এন্ড সিস্টেম, সপ্তপদী মার্কেট, ৭ মাথা, বগুড়া",
    shopEn: "Tajma Computer & System, Saptapadi Market, 7 Matha, Bogura",
    youtubeId: "7pfHV_1T3Xo",
  },
  {
    id: 4,
    name: "নাহিদ হাসান",
    nameEn: "Nahid Hasan",
    shop: "সপ্তপদী মার্কেট, ২য় তলা, ৭ মাথা, বগুড়া",
    shopEn: "Saptapadi Market, 2nd Floor, 7 Matha, Bogura",
    youtubeId: "dVGVNzj86kQ",
  },
  {
    id: 5,
    name: "মো: সোহাগ",
    nameEn: "Md. Sohag",
    shop: "মলি কম্পিউটার, সপ্তপদী মার্কেট, ২য় তলা, সাতমাথা, বগুড়া",
    shopEn: "Moli Computer, Saptapadi Market, 2nd Floor, Satmatha, Bogura",
    youtubeId: "uJjuPlc5n68",
  },
  {
    id: 6,
    name: "আপেল মাহমুদ",
    nameEn: "Apel Mahmud",
    shop: "সপ্তপদী মার্কেট, ২য় তলা, ৭ মাথা, বগুড়া",
    shopEn: "Saptapadi Market, 2nd Floor, 7 Matha, Bogura",
    youtubeId: "dZMI2R-7dTQ",
  },
  {
    id: 7,
    name: "মাসুদ রানা",
    nameEn: "Masud Rana",
    shop: "মিল্লাত প্লাজা, জজ কোর্ট সংলগ্ন, জেলা পরিষদ, বগুড়া",
    shopEn: "Millat Plaza, near Judge Court, District Council, Bogura",
    youtubeId: "1oOrDZ6a3HI",
  },
  {
    id: 8,
    name: "মো: শাকিল মিয়া",
    nameEn: "Md. Shakil Mia",
    shop: "পুলিশ সুপার কার্যালয়ের অপজিটে, বগুড়া সদর, বগুড়া",
    shopEn: "Opposite the Police Superintendent’s Office, Bogura Sadar, Bogura",
    youtubeId: "4uPC1QAjmQY",
  },
];

const textReviews = [
  {
    quote:
      "We use Studio Seba to create business cards, flyers and notices for our shop very quickly. We no longer depend on a designer — we finish the work ourselves in minutes.",
    quoteBn: "আমরা আমাদের দোকানের বিজনেস কার্ড, ফ্লায়ার ও নোটিশ খুব দ্রুত তৈরি করতে Studio Seba ব্যবহার করি। এখন আর ডিজাইনারের ওপর নির্ভর করতে হয় না—কয়েক মিনিটেই নিজেরা কাজ শেষ করতে পারি।",
    name: "Anom",
    nameBn: "অনম",
    shop: "Shop 129, Saptapadi Market, 7th Mor, Bogura",
    shopBn: "দোকান নং ১২৯, সপ্তপদী মার্কেট, সাতমাথা, বগুড়া",
  },
  {
    quote:
      "Having print media and document templates in one place has made our work much easier. The Bangla interface is easy to understand, so we can serve customers faster.",
    quoteBn: "প্রিন্ট মিডিয়া ও ডকুমেন্ট টেমপ্লেট একই জায়গায় থাকায় আমাদের কাজ অনেক সহজ হয়েছে। বাংলা ইন্টারফেস সহজে বোঝা যায়, তাই আমরা গ্রাহকদের আরও দ্রুত সেবা দিতে পারি।",
    name: "Nahid Hasan",
    nameBn: "নাহিদ হাসান",
    shop: "Fakir International, District Council, Bogura",
    shopBn: "ফকির ইন্টারন্যাশনাল, জেলা পরিষদ, বগুড়া",
  },
  {
    quote:
      "As a computer shop we often handle NID, passport and visiting card jobs. Studio Seba tools make photo resizing and PDF creation fast.",
    quoteBn: "কম্পিউটার দোকান হিসেবে আমরা প্রায়ই NID, পাসপোর্ট ও ভিজিটিং কার্ডের কাজ করি। Studio Seba-এর টুল দিয়ে ছবি রিসাইজ ও PDF তৈরি দ্রুত করা যায়।",
    name: "Imtiaz Hossain",
    nameBn: "ইমতিয়াজ হোসেন",
    shop: "Tajma Computer & System, Saptapadi Market, 7th Mor, Bogura",
    shopBn: "তাজমা কম্পিউটার অ্যান্ড সিস্টেম, সপ্তপদী মার্কেট, সাতমাথা, বগুড়া",
  },
  {
    quote:
      "Studio Seba truly saves time for our shop. We edit templates and get print-ready files — customers stay happy too.",
    quoteBn: "Studio Seba সত্যিই আমাদের দোকানের সময় বাঁচায়। আমরা টেমপ্লেট সম্পাদনা করে প্রিন্টের জন্য প্রস্তুত ফাইল তৈরি করি—গ্রাহকরাও খুশি থাকেন।",
    name: "Moli Computer",
    nameBn: "মলি কম্পিউটার",
    shop: "Saptapadi Market, 2nd Floor, Satmatha, Bogura",
    shopBn: "সপ্তপদী মার্কেট, ২য় তলা, সাতমাথা, বগুড়া",
  },
  {
    quote:
      "Our print shop gets many jobs daily. With ready-made designs on Studio Seba we just add details and deliver fast — revenue has grown too.",
    quoteBn: "আমাদের প্রিন্টিং দোকানে প্রতিদিন অনেক কাজ আসে। Studio Seba-এর তৈরি ডিজাইনে শুধু তথ্য যোগ করেই দ্রুত কাজ ডেলিভারি দিতে পারি—আয়ও বেড়েছে।",
    name: "Rakibul Islam",
    nameBn: "রাকিবুল ইসলাম",
    shop: "Rakib Printing & Stationery, Thanchania, Bogura",
    shopBn: "রাকিব প্রিন্টিং অ্যান্ড স্টেশনারি, থানছানিয়া, বগুড়া",
  },
  {
    quote:
      "Studio Seba is very useful for family cards, fuel forms and government documents. Live preview helps reduce mistakes.",
    quoteBn: "পারিবারিক কার্ড, ফুয়েল ফর্ম ও সরকারি নথির কাজে Studio Seba খুবই উপকারী। লাইভ প্রিভিউ ভুল কমাতে সাহায্য করে।",
    name: "Salma Akter",
    nameBn: "সালমা আক্তার",
    shop: "Smart Digital Center, Sherpur Road, Bogura",
    shopBn: "স্মার্ট ডিজিটাল সেন্টার, শেরপুর রোড, বগুড়া",
  },
  {
    quote:
      "Studio Seba is excellent and perfect for beautiful photo work. I would give it a hundred out of a hundred.",
    quoteBn: "সুন্দর ছবি সম্পাদনার জন্য Studio Seba চমৎকার ও দারুণ উপযোগী। আমি ১০০-এর মধ্যে ১০০ দেব।",
    name: "Masud Rana",
    nameBn: "মাসুদ রানা",
    shop: "Millat Plaza, near Judge Court, Bogura",
    shopBn: "মিল্লাত প্লাজা, জজ কোর্টের পাশে, বগুড়া",
  },
  {
    quote:
      "Using Studio Seba I do various photo editing, ID cards, banners and many other tasks — and I really like it. So I want to thank everyone at Studio Seba.",
    quoteBn: "Studio Seba ব্যবহার করে আমি ছবি সম্পাদনা, আইডি কার্ড, ব্যানারসহ নানা কাজ করি—আমার সত্যিই ভালো লাগে। Studio Seba-এর সবাইকে ধন্যবাদ জানাই।",
    name: "Apel Mahamud",
    nameBn: "আপেল মাহমুদ",
    shop: "Saptapadi Market, 2nd Floor, Bogura",
    shopBn: "সপ্তপদী মার্কেট, ২য় তলা, বগুড়া",
  },
  {
    quote:
      "I use Studio Seba tools, I do photo editing work here. The photo editing gets done very fast.",
    quoteBn: "আমি Studio Seba-এর টুল ব্যবহার করে ছবি সম্পাদনার কাজ করি। এখানে ছবির সম্পাদনা খুব দ্রুত হয়ে যায়।",
    name: "Md Shakil Mia",
    nameBn: "মোঃ শাকিল মিয়া",
    shop: "Opposite the Police Super's Office, Bogura",
    shopBn: "পুলিশ সুপারের কার্যালয়ের বিপরীতে, বগুড়া",
  },
];

const steps = [
  {
    icon: Wrench,
    title: "Use Studio Seba",
    titleBn: "Studio Seba ব্যবহার করুন",
    text: "Try documents, tools or print media yourself first.",
    textBn: "প্রথমে নিজে ডকুমেন্ট, টুল বা প্রিন্ট মিডিয়ার কাজ করে দেখুন।",
    tone: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  },
  {
    icon: PenLine,
    title: "Write your feedback",
    titleBn: "আপনার মতামত লিখুন",
    text: "Prepare a short written note or a one-minute video.",
    textBn: "সংক্ষিপ্ত লিখিত মতামত অথবা এক মিনিটের একটি ভিডিও তৈরি করুন।",
    tone: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    icon: MessageCircle,
    title: "Send on WhatsApp",
    titleBn: "WhatsApp-এ পাঠান",
    text: "Send on WhatsApp with your name, shop and area.",
    textBn: "আপনার নাম, দোকান ও এলাকার তথ্যসহ WhatsApp-এ পাঠান।",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  {
    icon: Globe,
    title: "We publish",
    titleBn: "আমরা প্রকাশ করি",
    text: "We verify and publish it on this page.",
    textBn: "যাচাই করার পর আমরা এই পেজে তা প্রকাশ করি।",
    tone: "bg-sky-50 text-sky-600 ring-sky-100",
  },
];

const avatarTones = [
  "from-indigo-500 to-violet-500",
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

function Stars({ size = 14 }: { size?: number }) {
  const { locale } = useI18n();
  const isBn = String(locale ?? "en").toLowerCase().startsWith("bn");

  return (
    <div
      className="flex items-center gap-0.5 text-amber-400"
      aria-label={isBn ? "পাঁচটির মধ্যে পাঁচটি তারকা" : "5 out of 5 stars"}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  );
}

function Avatar({
  name,
  index,
  size = "w-11 h-11",
}: {
  name: string;
  index: number;
  size?: string;
}) {
  return (
    <div
      className={`${size} shrink-0 rounded-full bg-gradient-to-br ${avatarTones[index % avatarTones.length]} text-white flex items-center justify-center font-bold text-sm shadow-sm`}
    >
      {name.charAt(0)}
    </div>
  );
}

export default function ReviewsPage() {
  const { locale } = useI18n();
  const isBn = String(locale ?? "en").toLowerCase().startsWith("bn");
  const tx = (english: string, bangla: string) => (isBn ? bangla : english);
  const formatNum = (value: number) =>
    value.toLocaleString(isBn ? "bn-BD" : "en-US");
  const whatsappMessage = isBn
    ? "আসসালামু আলাইকুম, আমি Studio Seba সম্পর্কে আমার রিভিউ জমা দিতে চাই।"
    : "Assalamu Alaikum, I want to submit a review about Studio Seba.";
  const whatsappHref = `https://api.whatsapp.com/send/?phone=8801783666743&text=${encodeURIComponent(whatsappMessage)}&type=phone_number&app_absent=0`;

  const [selectedVideo, setSelectedVideo] = useState<
    (typeof videoReviewsData)[0] | null
  >(null);

  const [featured, ...restReviews] = textReviews;

  return (
    <div className="min-h-screen bg-[#FFFAF0] text-[#1E1B3A] flex flex-col relative">
      {/* ───────── 1. HERO ───────── */}
      <section className="relative w-full overflow-hidden border-b border-[#EFE3C8] bg-gradient-to-b from-[#FFF4DC] to-[#FFFAF0]">
        {/* soft background glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EFE3C8] text-indigo-700 text-xs sm:text-sm font-semibold shadow-sm mb-6">
              <BadgeCheck size={16} className="text-indigo-600" />
              {tx("Customer Reviews", "গ্রাহকদের রিভিউ")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-[#1E1B3A]">
              {tx("What Our ", "আমাদের গ্রাহকদের ")}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                {tx("Customers Say", "মতামত")}
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-xl font-medium leading-relaxed">
              {tx(
                "Print shops, digital centers and shop owners across the country share their real experiences with Studio Seba.",
                "দেশজুড়ে প্রিন্ট শপ, ডিজিটাল সেন্টার ও দোকানমালিকরা Studio Seba নিয়ে তাঁদের বাস্তব অভিজ্ঞতা শেয়ার করেন।",
              )}
            </p>
          </div>

          {/* Rating summary card */}
          <div className="relative">
            <div className="rounded-[28px] bg-white border border-[#EFE3C8] shadow-[0_20px_60px_-20px_rgba(79,70,229,0.25)] p-6 sm:p-8">
              <div className="flex items-end gap-4">
                <span className="text-6xl sm:text-7xl font-black leading-none tracking-tight text-[#1E1B3A]">
                  {isBn ? "৫.০" : "5.0"}
                </span>
                <div className="pb-1.5">
                  <Stars size={18} />
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {tx("Average rating", "গড় রেটিং")}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[5, 4, 3, 2, 1].map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-3 text-xs font-semibold text-slate-500"
                  >
                    <span className="w-3 text-right">{formatNum(n)}</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{ width: n === 5 ? "100%" : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-black text-[#1E1B3A]">
                    {formatNum(textReviews.length)}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {tx("Written reviews", "লিখিত রিভিউ")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1E1B3A]">{formatNum(100)}%</p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {tx("Verified by our team", "আমাদের টিম দ্বারা যাচাইকৃত")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── 2. MAIN ───────── */}
      <main className="flex-grow max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-24 w-full">
        {/* ── Video reviews ── */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <Clapperboard size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1E1B3A] leading-tight">
              {tx("Video Reviews", "ভিডিও রিভিউ")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {tx("Real customers, in their own words", "প্রকৃত গ্রাহকদের নিজেদের ভাষায়")}
            </p>
          </div>
        </div>

        {VIDEOS_READY ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full mb-16 sm:mb-24">
            {videoReviewsData.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedVideo(item)}
                className="rounded-3xl overflow-hidden shadow-lg relative h-[380px] sm:h-[420px] flex flex-col justify-end p-5 sm:p-6 text-left text-white group bg-cover bg-center cursor-pointer transition duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                style={{
                  backgroundImage: `url('/reviews/review-${index + 1}.jpg')`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-white/10">
                  <Star size={12} fill="currentColor" />
                  {tx("5.0 Rating", "৫.০ রেটিং")}
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <Play size={22} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
                <div className="z-10 flex flex-col">
                  <h4 className="text-sm font-bold">{isBn ? item.name : item.nameEn}</h4>
                  <span className="text-[11px] text-gray-300 leading-tight">
                    {isBn ? item.shop : item.shopEn}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* ── COMING SOON ── */
          <div className="relative overflow-hidden rounded-[32px] border border-[#EFE3C8] bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4C1D95] text-white mb-16 sm:mb-24 shadow-[0_30px_70px_-30px_rgba(49,46,129,0.6)]">
            <div className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative grid lg:grid-cols-2 gap-10 items-center p-7 sm:p-12 lg:p-14">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur px-3.5 py-1.5 text-xs sm:text-sm font-bold text-amber-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
                  </span>
                  {tx("Coming Soon", "শীঘ্রই আসছে")}
                </span>

                <h3 className="mt-5 text-3xl sm:text-4xl font-black leading-tight tracking-tight">
                  {tx("Video reviews are on the way", "ভিডিও রিভিউ শিগগিরই আসছে")}
                </h3>
                <p className="mt-4 text-sm sm:text-base text-indigo-100/90 font-medium leading-relaxed max-w-md">
                  {tx(
                    "We are recording short videos with shop owners who use Studio Seba every day. They will be published here very soon.",
                    "যেসব দোকানমালিক প্রতিদিন Studio Seba ব্যবহার করেন, তাঁদের সঙ্গে আমরা ছোট ভিডিও রেকর্ড করছি। খুব শিগগিরই সেগুলো এখানে প্রকাশ করা হবে।",
                  )}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs sm:text-sm px-6 py-3 shadow-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Clapperboard size={16} />
                    {tx("Share your video review", "আপনার ভিডিও রিভিউ পাঠান")}
                  </a>
                </div>
              </div>

              {/* Phone-frame placeholders */}
              <div
                className="relative flex justify-center lg:justify-end"
                aria-hidden="true"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {[
                    {
                      h: "h-44 sm:h-56",
                      tone: "from-white/15 to-white/5",
                      mt: "mt-8",
                    },
                    {
                      h: "h-56 sm:h-72",
                      tone: "from-white/25 to-white/10",
                      mt: "",
                    },
                    {
                      h: "h-44 sm:h-56",
                      tone: "from-white/15 to-white/5",
                      mt: "mt-8",
                    },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className={`${p.h} ${p.mt} w-24 sm:w-32 rounded-[22px] border border-white/20 bg-gradient-to-b ${p.tone} backdrop-blur-sm p-3 flex flex-col justify-between`}
                    >
                      <div className="flex items-center gap-1 self-start rounded-full bg-black/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                        <Star size={9} fill="currentColor" strokeWidth={0} />{" "}
                        {isBn ? "৫.০" : "5.0"}
                      </div>
                      <div className="self-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                        <Play
                          size={16}
                          fill="currentColor"
                          className="ml-0.5 text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-3/4 rounded-full bg-white/30" />
                        <div className="h-1.5 w-1/2 rounded-full bg-white/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Text reviews ── */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200">
            <Quote size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1E1B3A] leading-tight">
              {tx("Text Reviews", "লিখিত রিভিউ")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isBn
                ? `${formatNum(textReviews.length)}টি প্রকৃত গ্রাহকের লিখিত রিভিউ`
                : `${formatNum(textReviews.length)} written reviews from real customers`}
            </p>
          </div>
        </div>

        {/* Featured review */}
        <figure className="relative overflow-hidden rounded-[28px] bg-white border border-[#EFE3C8] p-7 sm:p-10 mb-5 sm:mb-6 shadow-[0_20px_50px_-30px_rgba(79,70,229,0.35)]">
          <Quote
            size={120}
            className="absolute -top-4 right-4 sm:right-10 text-indigo-50"
            strokeWidth={1.5}
          />
          <div className="relative">
            <Stars size={18} />
            <blockquote className="mt-4 text-lg sm:text-2xl font-bold leading-snug text-[#1E1B3A] max-w-3xl">
              &ldquo;{isBn ? featured.quoteBn : featured.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <Avatar name={isBn ? featured.nameBn : featured.name} index={0} size="w-12 h-12" />
              <div>
                <p className="text-sm font-bold text-[#1E1B3A]">
                  {isBn ? featured.nameBn : featured.name}
                </p>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin size={12} /> {isBn ? featured.shopBn : featured.shop}
                </p>
              </div>
            </figcaption>
          </div>
        </figure>

        {/* Masonry grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 sm:gap-6 mb-16 sm:mb-24 [&>*]:mb-5 sm:[&>*]:mb-6">
          {restReviews.map((rev, index) => (
            <figure
              key={index}
              className="break-inside-avoid rounded-3xl bg-white border border-[#EFE3C8] p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60"
            >
              <Stars />
              <blockquote className="mt-3 text-[13px] sm:text-sm leading-relaxed text-slate-700">
                &ldquo;{isBn ? rev.quoteBn : rev.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                <Avatar name={isBn ? rev.nameBn : rev.name} index={index + 1} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1E1B3A] truncate">
                    {isBn ? rev.nameBn : rev.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium leading-snug">
                    {isBn ? rev.shopBn : rev.shop}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* ── Share your review ── */}
        <section className="rounded-[32px] border border-[#EFE3C8] bg-white p-6 sm:p-10 md:p-14 shadow-[0_20px_60px_-30px_rgba(79,70,229,0.3)]">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-[#1E1B3A]">
              {tx("Share your review", "আপনার রিভিউ শেয়ার করুন")}
            </h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {tx("4 simple steps · text or video", "৪টি সহজ ধাপ · লিখিত বা ভিডিও")}
            </p>
          </div>

          <ol className="relative mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {/* connector line (desktop) */}
            <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-sky-200" />

            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.title}
                  className="relative flex flex-col items-center text-center px-2"
                >
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl ring-4 ring-white flex items-center justify-center ${s.tone} shadow-sm`}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1E1B3A] text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
                      {formatNum(i + 1)}
                    </span>
                  </div>
                  <h4 className="mt-5 text-sm font-bold text-[#1E1B3A]">
                    {tx(s.title, s.titleBn)}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-[200px]">
                    {tx(s.text, s.textBn)}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-10 flex justify-center">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] hover:bg-[#1fb957] text-white font-bold text-sm px-8 py-3.5 shadow-lg shadow-emerald-200/70 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <MessageCircle size={18} fill="currentColor" />
              {tx("Send review on WhatsApp", "WhatsApp-এ রিভিউ পাঠান")}
            </a>
          </div>

          <div className="mt-8 mx-auto max-w-3xl flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 p-4 sm:px-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Gift size={20} />
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="font-bold text-amber-800">
                {tx("Monthly gift:", "মাসিক উপহার:")}
              </strong>{" "}
              {tx(
                "Every month, 3 reviewers will be chosen by lottery to receive a T-shirt gift.",
                "প্রতি মাসে লটারির মাধ্যমে ৩ জন রিভিউদাতাকে একটি করে টি-শার্ট উপহার দেওয়া হবে।",
              )}
            </p>
          </div>
        </section>
      </main>

      {/* ───────── 3. VIDEO POPUP (only used when VIDEOS_READY = true) ───────── */}
      {VIDEOS_READY && selectedVideo && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-[380px] sm:max-w-[400px] h-[82vh] max-h-[720px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white transition cursor-pointer shadow-lg"
              aria-label={tx("Close modal", "পপআপ বন্ধ করুন")}
            >
              <X size={20} />
            </button>

            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={isBn ? selectedVideo.name : selectedVideo.nameEn}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            <div className="absolute bottom-0 left-0 right-0 z-20 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none flex items-end justify-between">
              <div className="flex flex-col text-white max-w-[80%]">
                <h4 className="text-sm font-bold leading-snug">
                  {isBn ? selectedVideo.name : selectedVideo.nameEn}
                </h4>
                <p className="text-[11px] text-gray-200 leading-relaxed">
                  {isBn ? selectedVideo.shop : selectedVideo.shopEn}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold border border-white/10 shrink-0">
                {tx("Shorts", "শর্টস")}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
