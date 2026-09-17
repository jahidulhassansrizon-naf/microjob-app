// app/pricing/page.tsx
"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
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
  LucideIcon,
} from "lucide-react";

import FaqSection from "@/components/FaqSection";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

// Strict Type Interface for Credit Items
interface CreditItem {
  icon: LucideIcon;
  title: string;
  credits: string;
  isFree: boolean;
  bg: string;
  text: string;
}

// Data array with Explicit Typing
const creditItems: CreditItem[] = [
  {
    icon: Sparkles,
    title: "AI Editor",
    credits: "⚡ 2 credits",
    isFree: false,
    bg: "bg-orange-50",
    text: "text-orange-500",
  },
  {
    icon: Edit3,
    title: "Manual Editor",
    credits: "⚡ 1 credit",
    isFree: false,
    bg: "bg-blue-50",
    text: "text-blue-500",
  },
  {
    icon: FileCode,
    title: "AI Template",
    credits: "⚡ 4 credits",
    isFree: false,
    bg: "bg-purple-50",
    text: "text-purple-500",
  },
  {
    icon: FileText,
    title: "Document Generate",
    credits: "⚡ 1 credit",
    isFree: false,
    bg: "bg-amber-50",
    text: "text-amber-500",
  },
  {
    icon: Printer,
    title: "Print Media",
    credits: "⚡ 1 credit",
    isFree: false,
    bg: "bg-sky-50",
    text: "text-sky-500",
  },
  {
    icon: Layers,
    title: "Bulk Photo Edit",
    credits: "⚡ 2 credits",
    isFree: false,
    bg: "bg-orange-50",
    text: "text-orange-500",
  },
  {
    icon: HelpCircle,
    title: "Question Create",
    credits: "Free",
    isFree: true,
    bg: "bg-pink-50",
    text: "text-pink-500",
  },
  {
    icon: CheckCircle,
    title: "Question Expert",
    credits: "Free",
    isFree: true,
    bg: "bg-emerald-50",
    text: "text-emerald-500",
  },
  {
    icon: FileCheck,
    title: "Form Autofill",
    credits: "Free",
    isFree: true,
    bg: "bg-indigo-50",
    text: "text-indigo-500",
  },
  {
    icon: Sparkles,
    title: "60+ SohozTools",
    credits: "Free",
    isFree: true,
    bg: "bg-rose-50",
    text: "text-rose-500",
  },
];

// Typed Framer Motion Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-gray-900 flex flex-col">
      {/* Main Pricing Section */}
      <main className="flex-grow w-full flex flex-col items-center">
        {/* Top Hero Section */}
        <div className="w-full bg-gradient-to-b from-[#FFF5EE] via-[#FAF0E6]/70 to-[#F2E5D5]/50 pt-16 md:pt-20 pb-36 md:pb-44 px-4 sm:px-8 flex flex-col items-center border-b border-orange-100/60">
          <div className="max-w-[1240px] w-full flex flex-col items-center text-center">
            {/* Top Tag */}
            <div className="inline-flex items-center px-5 py-1.5 rounded-full bg-[#FFF6EB] border border-[#F5A021] text-[#9A2200] text-xs md:text-sm font-medium mb-8 shadow-xs">
              <span>Simple Credit System</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-6">
              Pay only for <span className="text-[#FF5500]">what you use</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-base text-gray-500 max-w-xl font-medium leading-relaxed mb-4">
              No subscriptions, no hidden fees. Use credits to generate
              documents, images and print media. Every new account gets 20 bonus
              credits.
            </p>
          </div>
        </div>

        {/* Overlapping Banner Card Container */}
        <div className="w-full max-w-[1240px] px-4 sm:px-8 flex flex-col items-center -mt-24 md:-mt-32 z-10 mb-20">
          {/* Banner Card */}
          <div className="w-full max-w-[1140px] bg-gradient-to-r from-[#FF4E00] via-[#FF3300] to-[#C01D00] rounded-[30px] p-8 md:p-12 lg:p-14 text-white shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Background Glow Overlay Circles */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute right-16 bottom-0 w-72 h-72 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Left Column: Bonus Credits */}
            <div className="lg:col-span-4 flex flex-col items-start lg:border-r lg:border-white/20 lg:pr-10">
              <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-extrabold text-white uppercase tracking-wider mb-4 border border-white/20">
                <span>#</span>
                <span>New User Bonus</span>
              </div>
              <span className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-none">
                20
              </span>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-white mt-3">
                Bonus Credits
              </span>
              <span className="text-[11px] text-white/80 font-medium leading-relaxed mt-2 max-w-[220px]">
                (2 credits for register & 18 credits for profile completion)
              </span>
            </div>

            {/* Right Column: Title, Subtitle, Pills & CTA */}
            <div className="lg:col-span-8 flex flex-col items-start lg:pl-4 z-10">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Start creating for free — right now
              </h3>
              <p className="text-xs md:text-sm text-white/85 font-medium mt-2.5 mb-7">
                Get 20 bonus credits to create documents, images and more.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Check size={13} className="stroke-[3]" />
                  <span>40 Documents</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Check size={13} className="stroke-[3]" />
                  <span>10 AI Edits</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Check size={13} className="stroke-[3]" />
                  <span>40 Print Exports</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Check size={13} className="stroke-[3]" />
                  <span>5 AI Templates</span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href="/login"
                className="bg-white text-[#FF4E00] hover:bg-orange-50 transition font-extrabold text-xs md:text-sm px-7 py-3.5 rounded-xl shadow-lg inline-flex items-center gap-2 cursor-pointer group"
              >
                <Gift
                  size={16}
                  className="text-[#FF4E00] group-hover:scale-110 transition-transform"
                />
                <span>Claim 20 Free Credits</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Animated "What are credits, really?" Section */}
        <div className="max-w-[1240px] w-full px-4 sm:px-8 flex flex-col items-center mb-24">
          {/* Header Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              What are credits, really?
            </h2>
            <p className="text-sm md:text-base text-gray-500 max-w-xl font-medium">
              Every action uses a few credits — the more credits you have, the
              more you can do. Some modules are completely free.
            </p>
          </motion.div>

          {/* Staggered Grid Cards Animation */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full"
          >
            {creditItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow cursor-default"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl ${item.bg} ${item.text} flex items-center justify-center font-bold`}
                    >
                      <IconComponent size={20} />
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        item.isFree
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-orange-500 bg-orange-50"
                      }`}
                    >
                      {item.credits}
                    </span>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-gray-800">
                      {item.title}
                    </h4>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
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
