"use client";
import { T } from "@/components/i18n/I18nProvider";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroFeatures() {
  return (
    <section className="relative w-full bg-white pb-8 pt-20 sm:pt-28">
      {/* hairline divider from the hero */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 mx-auto h-px max-w-[1400px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"
      />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        {/* Section Heading Area - Scroll Animated */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl space-y-5 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <Sparkles size={14} className="text-blue-600" />
            <span>
              <T>{"AI Photoshop"}</T>
            </span>
          </div>

          <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-6xl">
            <T>{"Create "}</T>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              <T>{"professional photos"}</T>
            </span>
            {<T> </T>}
            <T>{"faster "}</T>
            <br className="hidden sm:inline" />
            <T>{"and more precisely"}</T>
          </h2>

          <p className="mx-auto max-w-xl pt-1 text-base leading-relaxed text-slate-600 md:text-lg">
            <T>
              {
                "Create professional photos from normal images in just a few seconds without Photoshop, using ShohozKaj."
              }
            </T>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
