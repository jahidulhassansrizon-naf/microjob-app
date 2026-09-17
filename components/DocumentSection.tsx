"use client";

import { useState } from "react";
import {
  FileEdit,
  FileText,
  Send,
  ArrowRight,
  FileCheck,
  Eye,
  Keyboard,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DocumentSection() {
  const [activeVideoStart, setActiveVideoStart] = useState<number | null>(null);

  const cards = [
    {
      title: "Update information in a flash",
      desc: "Change information in up to 50 pages of paper through a simple form.",
      badge: "AI Powered",
      badgeStyle: "bg-emerald-100/70 text-emerald-700 border-emerald-200",
      iconBg: "bg-[#05B066]",
      icon: <FileEdit className="text-white" size={22} />,
      btnColor: "text-[#05B066]",
      arrowBg: "bg-[#05B066]",
      videoStart: 132, // 2 min 12 sec = 132 seconds
    },
    {
      title: "Export files as PDF",
      desc: "Save and download your created file as PDF.",
      badge: "Popular",
      badgeStyle: "bg-orange-100/70 text-orange-700 border-orange-200",
      iconBg: "bg-[#F95700]",
      icon: <FileText className="text-white" size={22} />,
      btnColor: "text-[#F95700]",
      arrowBg: "bg-[#F95700]",
      videoStart: 230, // 3 min 50 sec = 230 seconds
    },
    {
      title: "Share or email your document",
      desc: "Download or email your created document instantly, anytime.",
      badge: "Secure",
      badgeStyle: "bg-purple-100/70 text-purple-700 border-purple-200",
      iconBg: "bg-[#8B3DFF]",
      icon: <Send className="text-white" size={22} />,
      btnColor: "text-[#8B3DFF]",
      arrowBg: "bg-[#8B3DFF]",
      videoStart: null, // No video modal & no page jump
    },
  ];

  const extraFeatures = [
    {
      title: "Multiple page sizes & formats",
      desc: "Set custom margins and sizes — A4, A5, Deed, and more.",
      iconBg: "bg-[#FF5314]",
      icon: <FileCheck className="text-white" size={20} />,
      arrowBg: "bg-[#FF5314]",
    },
    {
      title: "Document preview system",
      desc: "Preview your document before downloading as PDF.",
      iconBg: "bg-[#D926B5]",
      icon: <Eye className="text-white" size={20} />,
      arrowBg: "bg-[#D926B5]",
    },
    {
      title: "Keyboard shortcuts to save time",
      desc: "Do everything quickly with just the keyboard, no mouse needed.",
      iconBg: "bg-[#0088FF]",
      icon: <Keyboard className="text-white" size={20} />,
      arrowBg: "bg-[#0088FF]",
    },
  ];

  // স্ট্যাগার্ড অ্যানিমেশন ভ্যারিয়েন্ট
  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
    <section className="bg-[#F8F9FA] py-16 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center bg-orange-100/70 border border-orange-200/80 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
            Document Creation
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-gray-950 tracking-tight leading-[1.2]">
            In Sohozkaj contracts & documents{" "}
            <br className="hidden sm:inline" />
            <span className="text-gray-950">instantly</span>
          </h2>

          <p className="text-gray-500 font-medium text-sm md:text-base max-w-xl mx-auto pt-1">
            Change text in contracts and other papers in moments through a
            simple form
          </p>
        </motion.div>

        {/* 3 Main Cards Grid */}
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xs flex flex-col justify-between min-h-[290px] relative transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-12 h-12 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-xs`}
                  >
                    {card.icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border ${card.badgeStyle}`}
                  >
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-950 mb-3 tracking-tight leading-snug">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-6">
                {card.videoStart !== null ? (
                  <button
                    type="button"
                    onClick={() => setActiveVideoStart(card.videoStart)}
                    className={`inline-flex items-center gap-2 text-xs font-bold ${card.btnColor} transition group cursor-pointer`}
                  >
                    <span>Learn more</span>
                    <div
                      className={`w-5 h-5 ${card.arrowBg} text-white rounded-full flex items-center justify-center transition group-hover:translate-x-0.5`}
                    >
                      <ArrowRight size={12} strokeWidth={3} />
                    </div>
                  </button>
                ) : (
                  <span
                    className={`inline-flex items-center gap-2 text-xs font-bold ${card.btnColor} select-none cursor-default`}
                  >
                    <span>Learn more</span>
                    <div
                      className={`w-5 h-5 ${card.arrowBg} text-white rounded-full flex items-center justify-center`}
                    >
                      <ArrowRight size={12} strokeWidth={3} />
                    </div>
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* And More Container */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-[#F0F2F5]/80 rounded-[36px] p-8 md:p-10 border border-gray-200/50 flex flex-col items-center"
        >
          <h3 className="text-2xl font-black text-gray-950 mb-1 tracking-tight">
            And more
          </h3>
          <p className="text-sm text-gray-500 font-medium mb-8">
            Extra features that make your work even easier
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            {extraFeatures.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100/80 shadow-2xs flex items-center justify-between gap-3 transition hover:shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 ${item.arrowBg} text-white rounded-full flex items-center justify-center shrink-0`}
                >
                  <ArrowRight size={11} strokeWidth={3} />
                </div>
              </motion.div>
            ))}
          </div>
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

              {/* Youtube Embedded Video with Start Time */}
              <iframe
                src={`https://www.youtube.com/embed/HWwuSrGQmSw?autoplay=1&rel=0&start=${activeVideoStart}`}
                title="SohozKaj Document Creation Tutorial"
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
