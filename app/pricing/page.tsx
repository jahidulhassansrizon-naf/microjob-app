// app/pricing/page.tsx
"use client";

import Link from "next/link";
import {
  Sparkles,
  Gift,
  Check,
  Edit3,
  FileCode,
  FileText,
  Printer,
  HelpCircle,
  Layers,
  CheckCircle,
  FileCheck,
} from "lucide-react";

import FaqSection from "@/components/FaqSection";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-gray-900 flex flex-col">
      {/* Main Pricing Section */}
      <main className="flex-grow w-full flex flex-col items-center">
        {/* Top Hero Section with Full-Width Background Gradient */}
        <div className="w-full bg-gradient-to-b from-[#FFF5EE] via-[#FAF0E6]/70 to-[#F2E5D5]/50 pt-12 md:pt-16 pb-28 md:pb-36 px-4 sm:px-8 flex flex-col items-center border-b border-orange-100/60">
          <div className="max-w-[1240px] w-full flex flex-col items-center">
            {/* Top Tag - Pixel-Perfect as Reference Image */}
            <div className="inline-flex items-center px-5 py-1 rounded-full bg-[#FFF6EB] border border-[#F5A021] text-[#9A2200] text-xs md:text-sm font-medium mb-6 shadow-2xs">
              <span>Simple Credit System</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-center tracking-tight text-gray-900 mb-4">
              Pay only for <span className="text-[#FF5500]">what you use</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-base text-gray-500 text-center max-w-xl font-medium leading-relaxed">
              No subscriptions, no hidden fees. Use credits to generate
              documents, images and print media. Every new account gets 20 bonus
              credits.
            </p>
          </div>
        </div>

        {/* Overlapping Banner Card Container */}
        <div className="w-full max-w-[1240px] px-4 sm:px-8 flex flex-col items-center -mt-20 md:-mt-28 z-10 mb-16">
          {/* Banner Card - Floating over the background boundary */}
          <div className="w-full max-w-[1140px] bg-gradient-to-r from-[#FF4E00] via-[#FF3300] to-[#C01D00] rounded-[30px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Background Glow Overlay Circles */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute right-16 bottom-0 w-72 h-72 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Left Column: Bonus Credits */}
            <div className="lg:col-span-4 flex flex-col items-start lg:border-r lg:border-white/20 lg:pr-8">
              <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-white uppercase tracking-wider mb-3 border border-white/20">
                <span>#</span>
                <span>New User Bonus</span>
              </div>
              <span className="text-6xl md:text-7xl font-black tracking-tight text-white leading-none">
                20
              </span>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-white mt-2">
                Bonus Credits
              </span>
              <span className="text-[11px] text-white/80 font-medium leading-tight mt-1.5 max-w-[210px]">
                (2 credits for register & 18 credits for profile completion)
              </span>
            </div>

            {/* Right Column: Title, Pills & CTA */}
            <div className="lg:col-span-8 flex flex-col items-start lg:pl-4 z-10">
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Start creating for free — right now
              </h3>
              <p className="text-xs md:text-sm text-white/85 font-medium mt-1.5 mb-6">
                Get 20 bonus credits to create documents, images and more.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2.5 mb-7">
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Check size={13} className="stroke-[3]" />
                  <span>40 Documents</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Check size={13} className="stroke-[3]" />
                  <span>10 AI Edits</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Check size={13} className="stroke-[3]" />
                  <span>40 Print Exports</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Check size={13} className="stroke-[3]" />
                  <span>5 AI Templates</span>
                </div>
              </div>

              {/* Action Button */}
              <button className="bg-white text-[#FF4E00] hover:bg-orange-50 transition font-extrabold text-xs md:text-sm px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer group">
                <Gift
                  size={16}
                  className="text-[#FF4E00] group-hover:scale-110 transition-transform"
                />
                <span>Claim 20 Free Credits</span>
              </button>
            </div>
          </div>
        </div>

        {/* What are credits, really? Section */}
        <div className="max-w-[1240px] w-full px-4 sm:px-8 flex flex-col items-center mb-24">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 text-center">
            What are credits, really?
          </h2>
          <p className="text-sm md:text-base text-gray-500 text-center max-w-xl mb-12 font-medium">
            Every action uses a few credits — the more credits you have, the
            more you can do. Some modules are completely free.
          </p>

          {/* Credits Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
            {/* Card 1 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg">
                  ⚡ 2 credits
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">AI Editor</h4>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
                  <Edit3 size={20} />
                </div>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg">
                  ⚡ 1 credit
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">
                  Manual Editor
                </h4>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center font-bold">
                  <FileCode size={20} />
                </div>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg">
                  ⚡ 4 credits
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">AI Template</h4>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg">
                  ⚡ 1 credit
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">
                  Document Generate
                </h4>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center font-bold">
                  <Printer size={20} />
                </div>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg">
                  ⚡ 1 credit
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">Print Media</h4>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold">
                  <Layers size={20} />
                </div>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg">
                  ⚡ 2 credits
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">
                  Bulk Photo Edit
                </h4>
              </div>
            </div>

            {/* Card 7 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center font-bold">
                  <HelpCircle size={20} />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Free
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">
                  Question Create
                </h4>
              </div>
            </div>

            {/* Card 8 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold">
                  <CheckCircle size={20} />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Free
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">
                  Question Expert
                </h4>
              </div>
            </div>

            {/* Card 9 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold">
                  <FileCheck size={20} />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Free
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">
                  Form Autofill
                </h4>
              </div>
            </div>

            {/* Card 10 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Free
                </span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800">
                  60+ SohozTools
                </h4>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <FaqSection />

      {/* CTA Banner Section */}
      <CtaBanner />

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
