"use client";
import { T, useI18n } from "@/components/i18n/I18nProvider";
import React from "react";
import { Play, Mail, Phone } from "lucide-react";
type Tutorial = {
    id: number;
    title: string;
    description: string;
};
const tutorials: Tutorial[] = [
    {
        id: 1,
        title: "Studio Seba photo editing tutorial",
        description: "Learn how to edit photos, remove backgrounds, resize images, and complete essential design work quickly.",
    },
    {
        id: 2,
        title: "Easy photo editing with AI Photo Editor",
        description: "Learn the complete process of creating and editing photos quickly with the AI Photo Editor.",
    },
    {
        id: 3,
        title: "Manually remove photo backgrounds",
        description: "Select the required area manually and remove the background from your image with ease.",
    },
    {
        id: 4,
        title: "How to remove photo backgrounds",
        description: "Remove image backgrounds easily and prepare your photos for a clean new design.",
    },
    {
        id: 5,
        title: "Create an AI photo from your image",
        description: "Use AI tools to turn an existing image into a fresh visual with just a few simple steps.",
    },
    {
        id: 6,
        title: "Add text and design elements to photos",
        description: "Add text, logos, shapes, and other useful design elements to your images.",
    },
    {
        id: 7,
        title: "Convert PDF pages into images",
        description: "Convert PDF files into JPG or PNG images whenever you need them for editing or sharing.",
    },
    {
        id: 8,
        title: "Compress images and reduce file size",
        description: "Reduce image file size while keeping the visual quality as clean as possible.",
    },
    {
        id: 9,
        title: "Change colors with the Color Picker",
        description: "Pick exact colors from an image and work with HEX, RGB, HSL, and other useful color values.",
    },
    {
        id: 10,
        title: "Add a watermark to your image",
        description: "Protect and brand your images by adding a custom text or logo watermark.",
    },
    {
        id: 11,
        title: "Use the Image Color Picker",
        description: "Pick a color directly from any image and quickly copy the corresponding color code.",
    },
    {
        id: 12,
        title: "Compress videos and reduce file size",
        description: "Make video files smaller and easier to upload or share while preserving useful quality.",
    },
    {
        id: 13,
        title: "PDF থেকে টেক্সট বের করার সহজ পদ্ধতি",
        description: "PDF ফাইল থেকে প্রয়োজনীয় লেখা দ্রুত বের করে কপি, এডিট বা অন্য জায়গায় ব্যবহার করুন।",
    },
    {
        id: 14,
        title: "PDF ফাইল থেকে নির্দিষ্ট পেজ আলাদা করুন",
        description: "বড় PDF থেকে প্রয়োজনীয় পেজগুলো আলাদা করে নতুন PDF ফাইল হিসেবে সংরক্ষণ করার নিয়ম।",
    },
    {
        id: 15,
        title: "PDF একসাথে Merge করার নিয়ম",
        description: "একাধিক PDF ফাইলকে একটি মাত্র PDF-এ একত্র করে সুন্দরভাবে সাজানোর পদ্ধতি দেখুন।",
    },
    {
        id: 16,
        title: "PDF ফাইল Split করার সহজ নিয়ম",
        description: "একটি PDF-কে প্রয়োজন অনুযায়ী কয়েকটি ছোট অংশে ভাগ করে আলাদা ফাইল তৈরি করুন।",
    },
    {
        id: 17,
        title: "PDF Lock ও Unlock করার পদ্ধতি",
        description: "প্রয়োজন অনুযায়ী PDF-এ password protection যোগ করা বা নিরাপদভাবে remove করার নিয়ম।",
    },
    {
        id: 18,
        title: "PDF ফাইলের Page Permission পরিবর্তন",
        description: "PDF কে print, copy বা edit করার অনুমতি নিয়ন্ত্রণ করে ফাইলকে আরও সুরক্ষিত রাখুন।",
    },
    {
        id: 19,
        title: "ছবি থেকে Text বের করার সহজ পদ্ধতি",
        description: "একটি ছবির ভেতরের লেখা শনাক্ত করে দ্রুত text হিসেবে বের করার পদ্ধতি শিখুন।",
    },
    {
        id: 20,
        title: "Image Resize করার সহজ নিয়ম",
        description: "ছবির width ও height প্রয়োজন অনুযায়ী পরিবর্তন করে নির্দিষ্ট সাইজে প্রস্তুত করুন।",
    },
    {
        id: 21,
        title: "ছবির Format Convert করার পদ্ধতি",
        description: "JPG, PNG, WEBP এবং অন্যান্য image format-এর মধ্যে প্রয়োজন অনুযায়ী convert করুন।",
    },
    {
        id: 22,
        title: "ছবির Quality ঠিক রেখে Compress করুন",
        description: "ওয়েব বা সোশ্যাল মিডিয়ার জন্য প্রয়োজন অনুযায়ী image quality ও file size balance করার নিয়ম।",
    },
];
function VideoPreview({ large = false }: { large?: boolean }) {
    return (
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700/70 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-blue-500/15 blur-2xl" />
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <div className={`${large ? "h-14 w-14" : "h-11 w-11"} grid place-items-center rounded-full border border-white/15 bg-white/10 text-white/80 shadow-lg shadow-black/20`}>
            <Play size={large ? 24 : 19} className="ml-0.5 fill-current" />
          </div>
          <span className="text-[10px] font-medium tracking-wide text-slate-300"><T>{"Video coming soon"}</T></span>
        </div>
      </div>
    );
}
function TutorialCard({ tutorial }: {
    tutorial: Tutorial;
}) {
    return (<article className="rounded-[7px] border border-[#E2E8F0] bg-white p-[10px] shadow-[0_1px_3px_rgba(15,23,42,0.035)]">
      <div className="mb-[4px] text-[9px] font-medium text-[#64748B]"><T>{"Video "}</T>{tutorial.id}
      </div>

      <h3 className="min-h-[34px] text-[13px] font-bold leading-[1.35] text-[#0F172A]">
        {<T>{tutorial.title}</T>}
      </h3>

      <p className="mt-[7px] min-h-[44px] text-[9px] leading-[1.55] text-[#475569]">
        {<T>{tutorial.description}</T>}
      </p>

      <div className="mt-[10px]">
        <VideoPreview />
      </div>
    </article>);
}
export default function Hero() {
    const { t } = useI18n();
    return (<main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Large intro area */}
      <section className="relative h-[470px] overflow-hidden border-b border-[#E2E8F0] bg-[linear-gradient(180deg,#EFF6FF_0%,#F8FAFC_100%)]">
        <div className="mx-auto flex h-full max-w-[980px] flex-col items-center px-5 pt-[101px] text-center sm:px-6">
          <span className="rounded-full border border-[#2563EB]/20 bg-white px-[14px] py-[6px] text-[11px] font-semibold text-[#2563EB] shadow-sm"><T>{"Our specialty\r\n          "}</T></span>

          <h1 className="mt-[28px] font-extrabold leading-none tracking-[-0.045em] text-[#0F172A]">
            <span className="text-[50px] text-[#2563EB] sm:text-[52px]"><T>{"Studio Seba\r\n            "}</T></span>
            <span className="text-[50px] sm:text-[52px]"><T>{"Introduction"}</T></span>
          </h1>

          <p className="mt-[34px] max-w-[570px] text-[16px] font-normal leading-7 text-[#334155]"><T>{"Watch the video tutorials below to learn how to use Studio Seba.\r\n          "}</T></p>
        </div>
      </section>

      {/* Main white content panel */}
      <section className="relative z-10 px-4 pb-16 sm:px-5">
        <div className="mx-auto -mt-[99px] max-w-[1050px] rounded-[11px] bg-white border border-[#E2E8F0] px-[47px] pb-[42px] pt-[45px] shadow-[0_4px_18px_rgba(15,23,42,0.05)] sm:px-[48px]">
          {/* Featured tutorial */}
          <div>
            <div className="mb-[10px] text-[11px] font-medium text-[#64748B]"><T>{"Video 1\r\n            "}</T></div>

            <h2 className="text-[16px] font-bold leading-6 text-[#0F172A]"><T>{"Studio Seba introduction\r\n            "}</T></h2>

            <p className="mt-[4px] text-[11px] leading-5 text-[#334155]"><T>{"Use various digital tools to help computer operators complete\r\n              their daily tasks of images, documents, applications, and other\r\n              necessary tasks easily and quickly.\r\n            "}</T></p>

            <div className="mt-[15px]">
              <VideoPreview large />
            </div>
          </div>

          {/* Tutorial cards */}
          <div id="tutorials" className="mt-[18px] grid grid-cols-1 gap-[12px] md:grid-cols-3">
            {tutorials.map((tutorial) => (<TutorialCard key={tutorial.id} tutorial={tutorial}/>))}
          </div>

          {/* Contact */}
          <div id="contact" className="mt-[36px] border-t border-[#E2E8F0] pt-[24px]">
            <h2 className="text-[15px] font-bold text-[#0F172A]"><T>{"Contact"}</T></h2>

            <div className="mt-[10px] rounded-[7px] border border-[#E2E8F0] bg-[#EFF6FF]/60 px-[16px] py-[14px]">
              <p className="text-[10px] leading-5 text-[#475569]"><T>{"Contact us for any Studio Seba support or information.\r\n              "}</T></p>

              <div className="mt-[9px] flex flex-wrap items-center gap-x-[24px] gap-y-[7px] text-[10px] font-medium text-[#64748B] italic">
                <div className="inline-flex items-center gap-[6px] not-italic">
                  <Mail size={13} className="text-[#2563EB]"/>
                  <span><T>{"Email address will be updated soon..."}</T></span>
                </div>

                <div className="inline-flex items-center gap-[6px] not-italic">
                  <Phone size={13} className="text-[#10B981]"/>
                  <span><T>{"Phone number will be updated soon..."}</T></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp button */}
      <a href="#" onClick={(e) => {
            e.preventDefault();
            alert(t("WhatsApp contact will be updated soon..."));
        }} aria-label={t("Contact us on WhatsApp")} className="fixed bottom-[22px] right-[22px] z-50 grid h-[56px] w-[56px] place-items-center rounded-full bg-[#10B981] text-white shadow-[0_10px_28px_rgba(16,185,129,0.30)] transition hover:scale-105">
        <span className="text-[28px] leading-none"><T>{"\u25D4"}</T></span>
      </a>
    </main>);
}
