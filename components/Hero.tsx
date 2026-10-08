// components/Hero.tsx
"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowRight, Play, CheckCircle2, Check, X, Grid, Scissors, FileText, Printer, SlidersHorizontal, Download, User, Zap, } from "lucide-react";
// Left Content Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.1,
        },
    },
};
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};
export default function Hero() {
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    return (<section className="w-full bg-transparent min-h-[calc(100vh-90px)] flex items-center py-8 lg:py-12 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* ================= LEFT COLUMN ================= */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="lg:col-span-6 xl:col-span-6 space-y-5 text-center lg:text-left flex flex-col items-center lg:items-start">
          {/* Active Users Tag */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/80 text-blue-700 text-xs sm:text-[14px] font-semibold px-4 py-1.5 rounded-full shadow-xs">
            <Zap size={14} className="fill-blue-600 text-blue-600"/><T>{"35,000+ Active Users\r\n          "}</T></motion.div>

          {/* Main Heading */}
          <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl md:text-5xl lg:text-[55px] leading-tight sm:leading-tight lg:leading-[81px] font-black text-slate-900 tracking-tight">
            <span className="whitespace-normal sm:whitespace-nowrap"><T>{"All your "}</T><span className="text-blue-600"><T>{"digital work"}</T></span>
            </span>{<T>{" "}</T>}
            <br className="hidden lg:inline"/>
            <span className="text-indigo-600"><T>{"in one place,"}</T></span><T>{"simple"}</T>{<T>{" "}</T>}
            <br className="hidden lg:inline"/><T>{"and secure\r\n          "}</T></motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed font-semibold"><T>{"Photo edit, AI photo edit, manual edit and bulk edit, plus\r\n            documents, design and print media \u2014 use them all with ease.\r\n          "}</T></motion.p>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 w-full">
            {/* Get Started Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link href="/login" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-7 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-blue-500/25 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"><T>{"Get Started Now "}</T><ArrowRight size={16}/>
              </Link>
            </motion.div>

            {/* Watch Demo Video Button */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsVideoOpen(true)} className="flex items-center justify-center gap-2 text-slate-700 bg-white border border-slate-200 px-6 py-3.5 rounded-full font-semibold text-xs sm:text-sm hover:bg-slate-50 transition shadow-xs cursor-pointer w-full sm:w-auto">
              <Play size={14} className="text-blue-600 fill-blue-600"/><T>{"Watch\r\n              Demo Video\r\n            "}</T></motion.button>
          </motion.div>

          {/* Feature Bullets */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-5 text-xs text-slate-600 pt-4 sm:pt-6 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0"/>{<T>{" "}</T>}<T>{"Photo edit in one click\r\n            "}</T></span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-blue-500 shrink-0"/><T>{"All\r\n              tools in one place\r\n            "}</T></span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-indigo-500 shrink-0"/>{<T>{" "}</T>}<T>{"Save time, reduce hassle\r\n            "}</T></span>
          </motion.div>
        </motion.div>

        {/* ================= RIGHT COLUMN (HUMAN-MADE SAAS UI) ================= */}
        <div className="lg:col-span-6 xl:col-span-6 relative w-full max-w-xl mx-auto lg:max-w-none px-2 sm:px-0 mt-6 lg:mt-0">
          {/* Bento Grid Container */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4">
            {/* 1. A4 Print Sheet Layout Card (Top Left - 7 Cols) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="sm:col-span-7 bg-white rounded-2xl p-4 border border-slate-200 shadow-md shadow-slate-200/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                    <Grid size={15}/>
                  </div>
                  <span className="text-xs font-bold text-slate-800"><T>{"A4 Grid Layout\r\n                  "}</T></span>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200"><T>{"300 DPI\r\n                "}</T></span>
              </div>

              {/* Real Photo Grid with Crop Lines */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 grid grid-cols-4 gap-1.5">
                {[...Array(8)].map((_, i) => (<div key={i} className="aspect-[3/4] bg-white rounded border border-slate-300 relative flex flex-col items-center justify-center overflow-hidden">
                    {/* Crop Mark Corners */}
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-blue-500"/>
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-blue-500"/>
                    <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-blue-500"/>
                    <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-blue-500"/>

                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mt-1">
                      <User size={10}/>
                    </div>
                    <div className="w-5 h-2 bg-blue-100 rounded-t-sm mt-0.5"/>
                  </div>))}
              </div>

              <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-medium">
                <span><T>{"8 Copies \u2022 Passport"}</T></span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Check size={13} strokeWidth={3}/><T>{"Auto-Fit\r\n                "}</T></span>
              </div>
            </motion.div>

            {/* 2. Transparent Background Cutout Card (Top Right - 5 Cols) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="sm:col-span-5 bg-white rounded-2xl p-4 border border-slate-200 shadow-md shadow-slate-200/50 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <Scissors size={15}/>
                </div>
                <span className="text-xs font-bold text-slate-800"><T>{"Cutout Tool\r\n                "}</T></span>
              </div>

              {/* Photoshop-style Checkerboard BG */}
              <div className="my-2 p-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px] rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm mb-1.5">
                  <User size={18}/>
                </div>
                <span className="text-[10px] font-bold bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 shadow-2xs"><T>{"BG Removed\r\n                "}</T></span>
              </div>

              <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                <span><T>{"Edge Clean"}</T></span>
                <span className="text-slate-800 font-mono font-bold"><T>{"100%"}</T></span>
              </div>
            </motion.div>

            {/* 3. Exact Presets Card (Bottom Left - 6 Cols) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="sm:col-span-6 bg-white rounded-2xl p-4 border border-slate-200 shadow-md shadow-slate-200/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                    <FileText size={15}/>
                  </div>
                  <span className="text-xs font-bold text-slate-800"><T>{"Dimensions\r\n                  "}</T></span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold"><T>{"MM Scale\r\n                "}</T></span>
              </div>

              <div className="space-y-1.5 my-1">
                <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 text-[11px]">
                  <span className="text-slate-600 font-medium"><T>{"NID Size"}</T></span>
                  <span className="font-mono font-bold text-slate-800"><T>{"85.6 \u00D7 54 mm\r\n                  "}</T></span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 text-[11px]">
                  <span className="text-slate-600 font-medium"><T>{"Passport"}</T></span>
                  <span className="font-mono font-bold text-slate-800"><T>{"40 \u00D7 50 mm\r\n                  "}</T></span>
                </div>
              </div>
            </motion.div>

            {/* 4. Instant Output Export Card (Bottom Right - 6 Cols) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }} className="sm:col-span-6 bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-800 text-slate-200 rounded-lg border border-slate-700">
                    <Printer size={15}/>
                  </div>
                  <span className="text-xs font-bold text-white"><T>{"Print Ready\r\n                  "}</T></span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded">
                  <SlidersHorizontal size={10}/><T>{"CMYK\r\n                "}</T></div>
              </div>

              <div className="my-2.5 flex items-center justify-between bg-slate-800/80 px-2.5 py-2 rounded-lg border border-slate-700/80">
                <div className="flex items-center gap-2">
                  <Download size={14} className="text-blue-400"/>
                  <span className="text-[11px] font-medium text-slate-300"><T>{"File Output\r\n                  "}</T></span>
                </div>
                <span className="bg-blue-600 text-white font-mono font-bold px-2 py-0.5 rounded text-[10px]"><T>{"PDF / JPG\r\n                "}</T></span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Demo Video Popup Modal */}
      <AnimatePresence>
        {isVideoOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6" onClick={() => setIsVideoOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ duration: 0.25, ease: "easeOut" }} className="relative w-full max-w-4xl aspect-video bg-black rounded-xl shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsVideoOpen(false)} className="absolute -top-10 right-0 z-50 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1" aria-label="Close video">
                <X size={26}/>
              </button>

              <iframe src="https://www.youtube.com/embed/NyGp0RiWXmM?autoplay=1&rel=0" title="SohozKaj Demo Video" className="w-full h-full border-0 rounded-xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
    </section>);
}
