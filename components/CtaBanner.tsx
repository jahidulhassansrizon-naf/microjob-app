"use client";
import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { EASE, Shine } from "@/components/ui/Premium";

const highlights = [
  "Create files in one click",
  "All tools in one place",
  "Save time, reduce hassle",
];

export default function CtaBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-[#F3F5FD] px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-gradient-to-br from-blue-700 via-indigo-700 to-fuchsia-700 px-6 py-16 text-center text-white shadow-[0_50px_100px_-40px_rgba(67,56,202,0.8)] ring-1 ring-white/15 md:px-12 md:py-24"
      >
        {/* decorative layers */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_0%,#000_30%,transparent_100%)]" />
          <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />
          <div className="absolute -bottom-36 -right-24 h-[26rem] w-[26rem] rounded-full bg-fuchsia-300/30 blur-3xl" />
          {/* ring ornaments */}
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-[48rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-3.5 text-xs font-bold backdrop-blur-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-indigo-700">
              <Sparkles size={12} />
            </span>
            <T>{"Our Specialty\r\n        "}</T>
          </span>

          <h2 className="text-4xl font-black leading-[1.05] tracking-[-0.035em] md:text-6xl lg:text-[68px]">
            <T>{"Get Started for Free Now!\r\n        "}</T>
          </h2>

          <p className="max-w-lg text-sm leading-7 text-white/80 md:text-base">
            <T>{"Join our platform today and make your daily work easier with Seba Lagbe.\r\n        "}</T>
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Link
              href="/dashboard"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_20px_40px_-14px_rgba(15,23,42,0.6)] transition duration-300 hover:-translate-y-0.5 sm:w-auto"
            >
              <Shine />
              <span className="relative">
                <T>{"Start for Free"}</T>
              </span>
              <ArrowRight
                size={16}
                className="relative transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>

            <span className="inline-flex w-full cursor-default items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white/65 sm:w-auto">
              <T>{"Video coming soon"}</T>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-6">
            {highlights.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md"
              >
                <CheckCircle2 size={14} className="shrink-0 text-emerald-300" />
                <T>{item}</T>
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
