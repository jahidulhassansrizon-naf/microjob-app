"use client";

import Link from "next/link";
import {
  Sparkles,
  Gift,
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
import CtaBanner from "@/components/CtaBanner"; // CTA Banner কম্পোনেন্ট
import Footer from "@/components/Footer"; // Footer কম্পোনেন্ট

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-gray-900 flex flex-col">
      {/* Navbar */}

      {/* Main Pricing Section */}
      <main className="flex-grow max-w-[1200px] mx-auto px-6 pt-16 pb-24 w-full flex flex-col items-center">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-100/60 border border-orange-200/60 text-orange-600 text-xs font-bold mb-6 shadow-2xs">
          <Sparkles size={14} />
          <span>Simple Credit System</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-center tracking-tight text-gray-900 mb-4">
          Pay only for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
            what you use
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-gray-500 text-center max-w-xl mb-14 font-medium leading-relaxed">
          No subscriptions, no hidden fees. Use credits to generate documents,
          images and print media. Every new account gets 20 bonus credits.
        </p>

        {/* Banner Card */}
        <div className="w-full bg-gradient-to-r from-[#FF6B00] via-[#FF453A] to-[#D938E2] rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 mb-24">
          {/* Background Glow Effect */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Left Side: 20 Bonus Credits */}
          <div className="flex items-center gap-6 z-10 w-full lg:w-auto">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex flex-col items-center justify-center shadow-inner">
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                # New User Bonus
              </span>
              <span className="text-6xl md:text-7xl font-black tracking-tight text-white">
                20
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Bonus Credits
              </span>
              <span className="text-xs text-white/80 font-medium max-w-[200px] mt-1">
                (2 credits for register & 18 credits for profile completion)
              </span>
            </div>
          </div>

          {/* Right Side: Description & Button */}
          <div className="flex flex-col items-start lg:items-end gap-5 z-10 w-full lg:w-auto">
            <div className="flex flex-col lg:items-end">
              <h3 className="text-lg md:text-xl font-bold tracking-tight">
                Start creating for free —{" "}
                <span className="underline decoration-white/50">right now</span>
              </h3>
              <p className="text-xs text-white/80 font-medium mt-1">
                Get 20 bonus credits to create documents, images and more.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap lg:justify-end gap-2">
              <span className="bg-white/20 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10">
                ✓ 20 Documents
              </span>
              <span className="bg-white/20 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10">
                ✓ 10 AI Edits
              </span>
              <span className="bg-white/20 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10">
                ✓ 20 Print Exports
              </span>
              <span className="bg-white/20 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10">
                ✓ 5 AI Templates
              </span>
            </div>

            {/* Action Button */}
            <button className="bg-white text-gray-900 hover:bg-gray-100 transition font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 mt-2 cursor-pointer">
              <Gift size={16} className="text-orange-500" />
              Claim 20 Free Credits
            </button>
          </div>
        </div>

        {/* What are credits, really? Section */}
        <div className="w-full flex flex-col items-center mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
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
