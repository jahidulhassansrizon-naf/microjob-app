"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  Palette,
  Shirt,
  Image,
  Share2,
  X,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

export default function AiEditorSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoStartTime, setVideoStartTime] = useState(0);

  const handleOpenVideo = (startTime: number = 0) => {
    setVideoStartTime(startTime);
    setIsVideoOpen(true);
  };

  const bottomCards = [
    {
      title: "Background & outfit changes",
      desc: "Change background color, hair color, and skin tone however you want with one click",
      icon: <Shirt size={22} />,
      startTime: 61,
    },
    {
      title: "Any size, any format, print ready",
      desc: "Save photos in specific sizes for passport, visa, NID, birth registration in JPG format",
      icon: <Image size={22} />,
      startTime: 256,
    },
    {
      title: "Share, print, download with ease",
      desc: "On ShohozKaj, instantly download, share, or email your photos without any hassle.",
      icon: <Share2 size={22} />,
      startTime: 212,
    },
  ];

  // অ্যানিমেশন ভ্যারিয়েন্ট (Bottom Cards এর জন্য)
  const bottomContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const bottomCardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="bg-[#F8F9FA] py-12 sm:py-16 md:py-20 lg:pb-24 px-4 sm:px-6 md:px-8 overflow-hidden">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
        {/* Top Row: Green Banner + 2 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Green Banner Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-6 bg-gradient-to-b from-[#05B066] via-[#04A25E] to-[#038E52] text-white rounded-3xl md:rounded-[36px] p-6 sm:p-8 md:p-12 flex flex-col justify-between shadow-xs relative overflow-hidden min-h-[480px] sm:min-h-[520px]"
          >
            <div>
              {/* Top Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-6 sm:mb-8 tracking-wider">
                <Sparkles size={13} />
                <span>AI POWERED</span>
              </div>

              {/* Main Headings */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 sm:mb-3 tracking-tight">
                10x Faster
              </h2>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white/95 mb-4 sm:mb-6">
                Get the job done.
              </h3>

              {/* Description */}
              <p className="text-white/85 text-sm sm:text-base font-medium leading-relaxed max-w-lg mb-8 sm:mb-10">
                Use our advanced AI tools to finish hours of work in minutes and
                create professional photos with ease.
              </p>

              {/* 3 Stats Chips */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mb-8 sm:mb-12">
                <div className="bg-white/15 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-3.5 text-center">
                  <p className="text-sm sm:text-base font-extrabold">
                    6+ Hours
                  </p>
                  <span className="text-[9px] sm:text-[10px] text-white/80 block mt-1 font-medium">
                    saved every day
                  </span>
                </div>
                <div className="bg-white/15 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-3.5 text-center">
                  <p className="text-sm sm:text-base font-extrabold">
                    One Click
                  </p>
                  <span className="text-[9px] sm:text-[10px] text-white/80 block mt-1 font-medium">
                    photo creation
                  </span>
                </div>
                <div className="bg-white/15 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-3.5 text-center">
                  <p className="text-sm sm:text-base font-extrabold">You too</p>
                  <span className="text-[9px] sm:text-[10px] text-white/80 block mt-1 font-medium">
                    get started
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button Redirecting to Dashboard */}
            <div>
              <Link
                href="/dashboard"
                className="bg-white text-gray-900 font-extrabold text-xs sm:text-sm px-6 sm:px-8 py-3.5 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition w-full sm:w-auto cursor-pointer"
              >
                <span>Start using AI Tools</span>
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 2 Stacked Cards */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-6">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl md:rounded-[36px] p-6 sm:p-8 md:p-10 border border-gray-100 shadow-2xs flex flex-col justify-between flex-1 min-h-[220px] sm:min-h-[250px] transition-all duration-300 hover:shadow-lg hover:shadow-black/10"
            >
              <div>
                <div className="w-12 h-12 bg-[#E6F8F0] rounded-2xl flex items-center justify-center text-[#04A25E] mb-4 sm:mb-6">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                  ShohozKaj's Smart AI Editor.
                </h3>
                <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed max-w-lg">
                  Create professional photos from ordinary images in just a few
                  seconds—no Photoshop required
                </p>
              </div>
              <button
                onClick={() => handleOpenVideo(0)}
                className="inline-flex items-center gap-1 text-sm font-bold text-gray-800 hover:text-[#04A25E] transition mt-4 sm:mt-6 cursor-pointer w-fit"
              >
                See details &rsaquo;
              </button>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl md:rounded-[36px] p-6 sm:p-8 md:p-10 border border-gray-100 shadow-2xs flex flex-col justify-between flex-1 min-h-[220px] sm:min-h-[250px] transition-all duration-300 hover:shadow-lg hover:shadow-black/10"
            >
              <div>
                <div className="w-12 h-12 bg-[#E6F8F0] rounded-2xl flex items-center justify-center text-[#04A25E] mb-4 sm:mb-6">
                  <Palette size={24} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                  One-click professional outfit editing
                </h3>
                <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed max-w-lg">
                  On ShohozKaj, easily edit your photos with blue, black, or
                  gray suits, navy blazers, white shirts, polo shirts, as well
                  as casual and traditional outfits.
                </p>
              </div>
              <button
                onClick={() => handleOpenVideo(40)}
                className="inline-flex items-center gap-1 text-sm font-bold text-gray-800 hover:text-[#04A25E] transition mt-4 sm:mt-6 cursor-pointer w-fit"
              >
                See details &rsaquo;
              </button>
            </motion.div>
          </div>
        </div>

        {/* Bottom Row: 3 Feature Cards */}
        <motion.div
          variants={bottomContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {bottomCards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={bottomCardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl md:rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-2xs flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-300 hover:shadow-lg hover:shadow-black/10"
            >
              <div>
                <div className="w-12 h-12 bg-[#E6F8F0] rounded-2xl flex items-center justify-center text-[#04A25E] mb-4 sm:mb-6">
                  {card.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <button
                onClick={() => handleOpenVideo(card.startTime)}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-800 hover:text-[#04A25E] transition mt-4 sm:mt-6 cursor-pointer w-fit"
              >
                See details &rsaquo;
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Demo Video Popup Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-10 right-0 z-50 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1"
                aria-label="Close video"
              >
                <X size={26} />
              </button>

              <iframe
                src={`https://www.youtube.com/embed/ssUbVT5-b10?autoplay=1&rel=0&start=${videoStartTime}`}
                title="ShohozKaj AI Photo Edit Tutorial"
                className="w-full h-full border-0 rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
