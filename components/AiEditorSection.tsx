"use client";
import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  Palette,
  Shirt,
  Image,
  Share2,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function AiEditorSection() {
  const bottomCards = [
    {
      title: "Background & outfit changes",
      desc: "Change background color, hair color, and skin tone however you want with one click",
      icon: <Shirt size={22} />,
      chip: "bg-blue-50 text-blue-600 ring-blue-100",
    },
    {
      title: "Any size, any format, print ready",
      desc: "Save photos in specific sizes for passport, visa, NID, birth registration in JPG format",
      icon: <Image size={22} />,
      chip: "bg-violet-50 text-violet-600 ring-violet-100",
    },
    {
      title: "Share, print, download with ease",
      desc: "On Seba Lagbe, instantly download, share, or email your photos without any hassle.",
      icon: <Share2 size={22} />,
      chip: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    },
  ];

  // অ্যানিমেশন ভ্যারিয়েন্ট (Bottom Cards এর জন্য)
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

  const cardBase =
    "group relative flex flex-1 flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 sm:p-9";
  return (
    <section className="overflow-hidden bg-white px-4 pb-20 pt-6 sm:px-6 md:px-12 md:pb-28">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 md:gap-6">
        {/* Top Row: Brand Banner + 2 Cards */}
        <div className="grid grid-cols-1 items-stretch gap-5 md:gap-6 lg:grid-cols-12">
          {/* Left Banner Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative flex min-h-[480px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-7 text-white shadow-2xl shadow-indigo-900/20 ring-1 ring-white/10 sm:min-h-[520px] sm:p-10 md:p-12 lg:col-span-7"
          >
            {/* decorative layers */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:44px_44px] [-webkit-mask-image:radial-gradient(ellipse_80%_70%_at_100%_0%,#000_20%,transparent_75%)] [mask-image:radial-gradient(ellipse_80%_70%_at_100%_0%,#000_20%,transparent_75%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
            />

            <div className="relative">
              {/* Top Badge */}
              <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[10px] font-bold tracking-wider backdrop-blur-md sm:mb-8 sm:text-[11px]">
                <Sparkles size={13} />
                <span>
                  <T>{"AI POWERED"}</T>
                </span>
              </div>

              {/* Main Headings */}
              <h2 className="mb-2 text-4xl font-bold tracking-tight sm:mb-3 sm:text-5xl md:text-6xl">
                <T>{"10x Faster\r\n              "}</T>
              </h2>
              <h3 className="mb-4 text-2xl font-semibold text-white/90 sm:mb-6 sm:text-3xl md:text-4xl">
                <T>{"Get the job done.\r\n              "}</T>
              </h3>

              {/* Description */}
              <p className="mb-8 max-w-lg text-sm font-medium leading-relaxed text-white/80 sm:mb-10 sm:text-base">
                <T>
                  {
                    "Use our advanced AI tools to finish hours of work in minutes and\r\n                create professional photos with ease.\r\n              "
                  }
                </T>
              </p>

              {/* 3 Stats Chips */}
              <div className="mb-8 grid grid-cols-3 gap-2.5 sm:mb-12 sm:gap-3.5">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-md sm:p-4">
                  <p className="text-sm font-bold sm:text-lg">
                    <T>{"6+ Hours\r\n                  "}</T>
                  </p>
                  <span className="mt-1 block text-[9px] font-medium text-white/75 sm:text-[11px]">
                    <T>{"saved every day\r\n                  "}</T>
                  </span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-md sm:p-4">
                  <p className="text-sm font-bold sm:text-lg">
                    <T>{"One Click\r\n                  "}</T>
                  </p>
                  <span className="mt-1 block text-[9px] font-medium text-white/75 sm:text-[11px]">
                    <T>{"photo creation\r\n                  "}</T>
                  </span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-md sm:p-4">
                  <p className="text-sm font-bold sm:text-lg">
                    <T>{"You too"}</T>
                  </p>
                  <span className="mt-1 block text-[9px] font-medium text-white/75 sm:text-[11px]">
                    <T>{"get started\r\n                  "}</T>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button Redirecting to Dashboard */}
            <div className="relative">
              <Link
                href="/dashboard"
                className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-xs font-bold text-slate-900 shadow-lg shadow-indigo-950/20 transition hover:bg-slate-50 sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
              >
                <span>
                  <T>{"Start using AI Tools"}</T>
                </span>
                <ArrowUpRight
                  size={18}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 2 Stacked Cards */}
          <div className="flex flex-col justify-between gap-5 md:gap-6 lg:col-span-5">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`${cardBase} min-h-[220px] sm:min-h-[250px]`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-100/70 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 sm:mb-6">
                  <Sparkles size={24} />
                </div>
                <h3 className="mb-2 text-xl font-semibold tracking-tight text-slate-900 sm:mb-3 sm:text-2xl">
                  <T>{"Seba Lagbe's Smart AI Editor.\r\n                "}</T>
                </h3>
                <p className="max-w-lg text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                  <T>
                    {
                      "Create professional photos from ordinary images in just a few\r\n                  seconds\u2014no Photoshop required\r\n                "
                    }
                  </T>
                </p>
              </div>
              <span className="relative mt-6 inline-flex w-fit cursor-default items-center text-xs font-medium text-slate-400"><T>{"Video coming soon"}</T></span>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`${cardBase} min-h-[220px] sm:min-h-[250px]`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-100/70 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 sm:mb-6">
                  <Palette size={24} />
                </div>
                <h3 className="mb-2 text-xl font-semibold tracking-tight text-slate-900 sm:mb-3 sm:text-2xl">
                  <T>{"One-click professional outfit editing\r\n                "}</T>
                </h3>
                <p className="max-w-lg text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                  <T>
                    {
                      "On Seba Lagbe, easily edit your photos with blue, black, or\r\n                  gray suits, navy blazers, white shirts, polo shirts, as well\r\n                  as casual and traditional outfits.\r\n                "
                    }
                  </T>
                </p>
              </div>
              <span className="relative mt-6 inline-flex w-fit cursor-default items-center text-xs font-medium text-slate-400"><T>{"Video coming soon"}</T></span>
            </motion.div>
          </div>
        </div>

        {/* Bottom Row: 3 Feature Cards */}
        <motion.div
          variants={bottomContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6"
        >
          {bottomCards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={bottomCardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group flex min-h-[240px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 sm:min-h-[260px] sm:p-8"
            >
              <div>
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ring-1 sm:mb-6 ${card.chip}`}
                >
                  {card.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-slate-900 sm:mb-3 sm:text-xl">
                  {<T>{card.title}</T>}
                </h3>
                <p className="text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                  {<T>{card.desc}</T>}
                </p>
              </div>
              <span className="mt-6 inline-flex w-fit cursor-default items-center text-xs font-medium text-slate-400"><T>{"Video coming soon"}</T></span>
            </motion.div>
          ))}
        </motion.div>
      </div>
</section>
  );
}
