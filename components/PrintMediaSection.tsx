"use client";
import { T } from "@/components/i18n/I18nProvider";
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
import { motion, AnimatePresence, Variants } from "framer-motion";

export default function PrintMediaSection() {
  const [activeVideoStart, setActiveVideoStart] = useState<number | null>(null);

  const cards = [
    {
      title: "Massive print-ready design library",
      desc: "This huge collection of various categories (AI, PSD & preview) is completely free",
      icon: <LayoutGrid className="text-blue-600" size={20} />,
      iconBg: "bg-blue-50 ring-blue-100",
      btnColor: "text-blue-600",
      videoStart: 0,
    },
    {
      title: "Replace text in a flash",
      desc: "Create, edit and print with different information all at once",
      icon: <FileEdit className="text-indigo-600" size={20} />,
      iconBg: "bg-indigo-50 ring-indigo-100",
      btnColor: "text-indigo-600",
      videoStart: 62,
    },
    {
      title: "Replace logos, images and other photos",
      desc: "This huge collection of various categories (AI, PSD & preview) is completely free",
      icon: <Image className="text-violet-600" size={20} />,
      iconBg: "bg-violet-50 ring-violet-100",
      btnColor: "text-violet-600",
      videoStart: 73,
    },
    {
      title: "Create your file instantly",
      desc: "Create your file easily in the print media service.",
      icon: <ArrowRight className="text-sky-600" size={20} />,
      iconBg: "bg-sky-50 ring-sky-100",
      btnColor: "text-sky-600",
      videoStart: 118,
    },
    {
      title: "Share or email your created file",
      desc: "Instantly download or email your created file at any time.",
      icon: <Printer className="text-emerald-600" size={20} />,
      iconBg: "bg-emerald-50 ring-emerald-100",
      btnColor: "text-emerald-600",
      videoStart: null,
    },
    {
      title: "AI, PSD, PNG, CMYK, RGB — whatever you need",
      desc: "Save the final version in any format with one click.",
      icon: <FolderDown className="text-amber-600" size={20} />,
      iconBg: "bg-amber-50 ring-amber-100",
      btnColor: "text-amber-600",
      videoStart: 130,
    },
  ];

  const cardContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="overflow-hidden bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-14 md:gap-16">
        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl space-y-5 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            <T>{"Our Print Service\r\n          "}</T>
          </div>

          <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 md:text-5xl">
            <T>{"SohozKaj-Professional "}</T>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              <T>{"Print Media"}</T>
            </span>
            {<T>{" "}</T>}
            <span className="text-slate-900">
              <T>{"Solution"}</T>
            </span>
          </h2>

          <p className="mx-auto max-w-lg pt-1 text-base leading-relaxed text-slate-600 md:text-lg">
            <T>
              {
                "Banners, flyers, posters, business cards and more \u2014 quality print\r\n            services for your brand.\r\n          "
              }
            </T>
          </p>
        </motion.div>

        {/* 6 Feature Cards */}
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="flex min-h-[220px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60"
            >
              <div>
                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${card.iconBg}`}
                >
                  {card.icon}
                </div>

                <h3 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-slate-900">
                  {<T>{card.title}</T>}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500">
                  {card.desc}
                </p>
              </div>

              <div className="pt-5">
                {card.videoStart !== null ? (
                  <button
                    type="button"
                    onClick={() => setActiveVideoStart(card.videoStart)}
                    className={`group inline-flex cursor-pointer items-center gap-1 text-xs font-semibold no-underline ${card.btnColor}`}
                  >
                    <span>
                      <T>{"Learn more"}</T>
                    </span>
                    <ArrowRight
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </button>
                ) : (
                  <span
                    className={`group inline-flex cursor-default select-none items-center gap-1 text-xs font-semibold no-underline ${card.btnColor}`}
                  >
                    <span>
                      <T>{"Learn more"}</T>
                    </span>
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

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex w-full flex-col items-center overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-center text-white shadow-2xl shadow-slate-900/20 ring-1 ring-white/10 md:px-12 md:py-20"
        >
          {/* decorative layers */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px] [-webkit-mask-image:radial-gradient(ellipse_70%_80%_at_50%_0%,#000_30%,transparent_100%)] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_0%,#000_30%,transparent_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] max-w-none -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600/40 via-indigo-500/40 to-violet-600/40 blur-3xl"
          />

          <div className="relative mb-6 inline-block rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
            <T>{"Special Offer\r\n          "}</T>
          </div>

          <h2 className="relative mb-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            <T>{"Start Today with SohozKaj - Completely Free\r\n          "}</T>
          </h2>

          <p className="relative mb-8 max-w-xl text-sm font-medium text-slate-300 md:text-base">
            <T>
              {
                "Document creation, print media, professional photo creation \u2014\r\n            everything included.\r\n          "
              }
            </T>
          </p>

          <Link
            href="/dashboard"
            className="group relative inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 no-underline shadow-lg transition hover:scale-105 hover:bg-slate-50"
          >
            <span>
              <T>{"Get Started Now"}</T>
            </span>
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
      </div>

      {/* Video Popup Modal */}
      <AnimatePresence>
        {activeVideoStart !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:p-6"
            onClick={() => setActiveVideoStart(null)}
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
                onClick={() => setActiveVideoStart(null)}
                className="absolute -top-10 right-0 z-50 flex cursor-pointer items-center gap-1 text-white/90 transition hover:text-white"
                aria-label="Close video"
              >
                <X size={26} />
              </button>

              <iframe
                src={`https://www.youtube.com/embed/gDJK6EXjG4Q?autoplay=1&rel=0&start=${activeVideoStart}`}
                title="SohozKaj Print Media Solution Tutorial"
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
