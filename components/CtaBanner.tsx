"use client";
import { T } from "@/components/i18n/I18nProvider";
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
    <section className="w-full overflow-hidden border-t border-slate-200/60 bg-slate-50 px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-16 text-center text-white shadow-2xl shadow-indigo-900/25 ring-1 ring-white/10 md:px-12 md:py-24">
        {/* decorative layers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px] [-webkit-mask-image:radial-gradient(ellipse_70%_80%_at_50%_0%,#000_30%,transparent_100%)] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_0%,#000_30%,transparent_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6"
        >
          <motion.div
            variants={itemVariants}
            className="inline-block rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md"
          >
            <T>{"Our Specialty\r\n        "}</T>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-4xl font-bold leading-tight tracking-tight md:text-6xl"
          >
            <T>{"Get Started for Free Now!\r\n        "}</T>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="max-w-lg text-sm font-medium text-white/80 md:text-base"
          >
            <T>
              {
                "Join our platform today and make your daily work easier with SohozKaj.\r\n        "
              }
            </T>
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row"
          >
            <Link
              href="/dashboard"
              className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 no-underline shadow-lg shadow-indigo-950/20 transition hover:scale-105 hover:bg-slate-50 sm:w-auto"
            >
              <span>
                <T>{"Start for Free"}</T>
              </span>
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>

            <button
              type="button"
              onClick={() => setIsVideoOpen(true)}
              className="w-full cursor-pointer rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
            >
              <T>{"Watch Demo Video\r\n          "}</T>
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
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md"
              >
                <CheckCircle2 size={14} className="shrink-0 text-white" />
                <span>{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Video Modal Popup */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:p-6"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative aspect-video w-full max-w-4xl rounded-2xl border border-white/10 bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-10 right-0 z-50 flex cursor-pointer items-center gap-1 text-white/90 transition hover:text-white"
                aria-label="Close video"
              >
                <X size={26} />
              </button>

              <iframe
                src="https://www.youtube.com/embed/NyGp0RiWXmM?autoplay=1&rel=0"
                title="SohozKaj Demo Video"
                className="h-full w-full rounded-2xl border-0"
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
