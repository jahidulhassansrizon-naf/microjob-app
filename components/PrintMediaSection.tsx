"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  FileEdit,
  Image,
  ArrowRight,
  Printer,
  FolderDown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PrintMediaSection() {
  const [activeVideoStart, setActiveVideoStart] = useState<number | null>(null);

  const cards = [
    {
      title: "Massive print-ready design library",
      desc: "This huge collection of various categories (AI, PSD & preview) is completely free",
      icon: <LayoutGrid className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
      videoStart: 0,
    },
    {
      title: "Replace text in a flash",
      desc: "Create, edit and print with different information all at once",
      icon: <FileEdit className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
      videoStart: 62,
    },
    {
      title: "Replace logos, images and other photos",
      desc: "This huge collection of various categories (AI, PSD & preview) is completely free",
      icon: <Image className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
      videoStart: 73,
    },
    {
      title: "Create your file instantly",
      desc: "Create your file easily in the print media service.",
      icon: <ArrowRight className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
      videoStart: 118,
    },
    {
      title: "Share or email your created file",
      desc: "Instantly download or email your created file at any time.",
      icon: <Printer className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
      videoStart: null,
    },
    {
      title: "AI, PSD, PNG, CMYK, RGB — whatever you need",
      desc: "Save the final version in any format with one click.",
      icon: <FolderDown className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
      videoStart: 130,
    },
  ];

  // কার্ড গ্রিডের জন্য স্ট্যাগার্ড অ্যানিমেশন ভ্যারিয়েন্ট
  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="bg-[#FBEFFF] py-20 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center bg-orange-100/70 border border-orange-200/80 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
            Our Print Service
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-gray-950 tracking-tight leading-[1.15]">
            SohozKaj-Professional <br />
            <span className="text-[#FF5D00]">Print Media</span>{" "}
            <span className="text-gray-950">Solution</span>
          </h2>

          <p className="text-gray-500 font-medium text-sm md:text-base max-w-lg mx-auto pt-1">
            Banners, flyers, posters, business cards and more — quality print
            services for your brand.
          </p>
        </motion.div>

        {/* 6 Cards Grid (2 rows x 3 cols) */}
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white rounded-[28px] p-7 border border-purple-50 shadow-xs flex flex-col justify-between min-h-[220px] transition hover:shadow-md"
            >
              <div>
                <div
                  className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center mb-5 shadow-xs`}
                >
                  {card.icon}
                </div>

                <h3 className="text-lg font-bold text-gray-950 mb-2 tracking-tight leading-snug">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-5">
                {card.videoStart !== null ? (
                  <button
                    type="button"
                    onClick={() => setActiveVideoStart(card.videoStart)}
                    className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B5CF6] no-underline cursor-pointer"
                  >
                    <span>Learn more</span>
                    <ArrowRight
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </button>
                ) : (
                  <span className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B5CF6] select-none cursor-default no-underline">
                    <span>Learn more</span>
                    <ArrowRight
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Special Offer CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full bg-gradient-to-r from-[#8B00FF] via-[#5B32F3] to-[#0066FF] rounded-[36px] py-14 px-6 md:px-12 text-center text-white shadow-2xl shadow-purple-900/20 relative overflow-hidden flex flex-col items-center"
        >
          <div className="inline-block bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            Special Offer
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight max-w-2xl mb-4">
            Start Today with SohozKaj - Completely Free
          </h2>

          <p className="text-white/80 text-xs md:text-sm font-medium max-w-xl mb-8">
            Document creation, print media, professional photo creation —
            everything included.
          </p>

          <Link
            href="/dashboard"
            className="group bg-white text-[#7C3AED] hover:bg-gray-50 font-bold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2 shadow-lg transition hover:scale-105 cursor-pointer no-underline"
          >
            <span>Get Started Now</span>
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
      </div>

      {/* Demo Video Popup Modal */}
      <AnimatePresence>
        {activeVideoStart !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
            onClick={() => setActiveVideoStart(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveVideoStart(null)}
                className="absolute -top-10 right-0 z-50 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1"
                aria-label="Close video"
              >
                <X size={26} />
              </button>

              {/* Youtube Embedded Video */}
              <iframe
                src={`https://www.youtube.com/embed/gDJK6EXjG4Q?autoplay=1&rel=0&start=${activeVideoStart}`}
                title="SohozKaj Print Media Solution Tutorial"
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
