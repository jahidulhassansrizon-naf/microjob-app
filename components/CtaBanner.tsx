"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

export default function CtaBanner() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const highlights = [
    "Create files in one click",
    "All tools in one place",
    "Save time, reduce hassle",
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const pillsVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <section className="w-full bg-gradient-to-r from-[#FF5100] via-[#E1007E] to-[#8000FF] py-20 px-6 md:px-12 text-center text-white relative overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-4xl mx-auto flex flex-col items-center gap-6 relative z-10"
      >
        <motion.div
          variants={itemVariants}
          className="inline-block bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs"
        >
          Our Specialty
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="text-4xl md:text-6xl font-black tracking-tight leading-tight"
        >
          Get Started for Free Now!
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-white/80 text-xs md:text-sm font-medium max-w-lg"
        >
          Join our platform today and make your daily work easier with SohozKaj.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 font-bold px-7 py-3.5 rounded-full text-sm inline-flex items-center justify-center gap-2 shadow-lg transition hover:scale-105 cursor-pointer"
          >
            <span>Start for Free</span>
            <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            onClick={() => setIsVideoOpen(true)}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/40 backdrop-blur-sm text-white font-bold px-7 py-3.5 rounded-full text-sm transition cursor-pointer"
          >
            Watch Demo Video
          </button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-3 pt-6"
        >
          {highlights.map((item, idx) => (
            <motion.div
              key={idx}
              variants={pillsVariants}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xs"
            >
              <CheckCircle2 size={14} className="text-white shrink-0" />
              <span>{item}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

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
                src="https://www.youtube.com/embed/NyGp0RiWXmM?autoplay=1&rel=0"
                title="SohozKaj Demo Video"
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
