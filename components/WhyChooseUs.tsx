"use client";
import { T } from "@/components/i18n/I18nProvider";
import {
  Clock,
  ShieldCheck,
  ThumbsUp,
  Headphones,
  Zap,
  Bookmark,
} from "lucide-react";
import { motion } from "framer-motion";

export default function WhyChooseUs() {
  const benefits = [
    {
      title: "File sharing without USB drives",
      desc: "Your time is valuable, so we deliver service as fast as possible.",
      icon: <Clock className="text-blue-600" size={20} />,
      iconBg: "bg-blue-50 ring-blue-100",
    },
    {
      title: "Cybersecurity & permissions",
      desc: "Control access for multiple employees in your office or shop",
      icon: <ShieldCheck className="text-indigo-600" size={20} />,
      iconBg: "bg-indigo-50 ring-indigo-100",
    },
    {
      title: "Instant search & tags",
      desc: "A simple and beautiful interface that anyone can use with ease.",
      icon: <ThumbsUp className="text-violet-600" size={20} />,
      iconBg: "bg-violet-50 ring-violet-100",
    },
    {
      title: "Fast search system",
      desc: "Quickly find edited or printed files by name, date and category",
      icon: <Headphones className="text-sky-600" size={20} />,
      iconBg: "bg-sky-50 ring-sky-100",
    },
    {
      title: "Pin your favorite files",
      desc: "Pin favorite files/templates for quick access",
      icon: <Zap className="text-amber-600" size={20} />,
      iconBg: "bg-amber-50 ring-amber-100",
    },
    {
      title: "Direct save, print & email",
      desc: "Save, print, or even send created files directly to a customer's email",
      icon: <Bookmark className="text-emerald-600" size={20} />,
      iconBg: "bg-emerald-50 ring-emerald-100",
    },
  ];

  return (
    <section className="overflow-hidden border-y border-slate-200/60 bg-slate-50 px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-14">
        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl space-y-5 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <T>{"Why Choose Us\r\n          "}</T>
          </div>

          <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 md:text-5xl">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              <T>{"Easy to use,"}</T>
            </span>
            <T>{"and more "}</T>
            <br />
            <T>{"benefits\r\n          "}</T>
          </h2>

          <p className="mx-auto max-w-xl pt-1 text-base leading-relaxed text-slate-600 md:text-lg">
            <T>
              {
                "We provide fast, safe, and reliable solutions to simplify your daily\r\n            work\r\n          "
              }
            </T>
          </p>
        </motion.div>

        {/* 6 Feature Cells — hairline-divided grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm md:grid-cols-2 lg:grid-cols-3"
        >
          {benefits.map((item, idx) => (
            <div
              key={idx}
              className="group relative flex min-h-[200px] flex-col justify-start bg-white p-8 transition-colors duration-300 hover:bg-slate-50/80"
            >
              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${item.iconBg}`}
              >
                {item.icon}
              </div>

              <h3 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-slate-900">
                {<T>{item.title}</T>}
              </h3>
              <p className="text-sm font-medium leading-relaxed text-slate-500">
                {<T>{item.desc}</T>}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
