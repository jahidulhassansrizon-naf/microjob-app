"use client";
import { T } from "@/components/i18n/I18nProvider";
import {
  FileEdit,
  FileText,
  Send,
  ArrowRight,
  FileCheck,
  Eye,
  Keyboard,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function DocumentSection() {
  const cards = [
    {
      title: "Update information in a flash",
      desc: "Change information in up to 50 pages of paper through a simple form.",
      badge: "AI Powered",
      badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "bg-blue-50 ring-blue-100",
      icon: <FileEdit className="text-blue-600" size={22} />,
      btnColor: "text-blue-600",
      arrowBg: "bg-blue-600",
      glow: "from-transparent via-blue-500/70 to-transparent",
    },
    {
      title: "Export files as PDF",
      desc: "Save and download your created file as PDF.",
      badge: "Popular",
      badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
      iconBg: "bg-indigo-50 ring-indigo-100",
      icon: <FileText className="text-indigo-600" size={22} />,
      btnColor: "text-indigo-600",
      arrowBg: "bg-indigo-600",
      glow: "from-transparent via-indigo-500/70 to-transparent",
    },
    {
      title: "Share or email your document",
      desc: "Download or email your created document instantly, anytime.",
      badge: "Secure",
      badgeStyle: "bg-violet-50 text-violet-700 border-violet-200",
      iconBg: "bg-violet-50 ring-violet-100",
      icon: <Send className="text-violet-600" size={22} />,
      btnColor: "text-violet-600",
      arrowBg: "bg-violet-600",
      glow: "from-transparent via-violet-500/70 to-transparent",
    },
  ];

  const extraFeatures = [
    {
      title: "Multiple page sizes & formats",
      desc: "Set custom margins and sizes — A4, A5, Deed, and more.",
      iconBg: "bg-blue-50 ring-blue-100",
      icon: <FileCheck className="text-blue-600" size={20} />,
      arrowBg: "bg-blue-600",
    },
    {
      title: "Document preview system",
      desc: "Preview your document before downloading as PDF.",
      iconBg: "bg-indigo-50 ring-indigo-100",
      icon: <Eye className="text-indigo-600" size={20} />,
      arrowBg: "bg-indigo-600",
    },
    {
      title: "Keyboard shortcuts to save time",
      desc: "Do everything quickly with just the keyboard, no mouse needed.",
      iconBg: "bg-sky-50 ring-sky-100",
      icon: <Keyboard className="text-sky-600" size={20} />,
      arrowBg: "bg-sky-500",
    },
  ];

  const cardContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <T>{"Document Creation\r\n          "}</T>
          </div>

          <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 md:text-5xl">
            <T>{"In Studio Seba contracts & documents"}</T>
            {<T>{" "}</T>}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              <T>{"instantly"}</T>
            </span>
          </h2>

          <p className="mx-auto max-w-xl pt-1 text-base leading-relaxed text-slate-600 md:text-lg">
            <T>
              {
                "Change text in contracts and other papers in moments through a\r\n            simple form\r\n          "
              }
            </T>
          </p>
        </motion.div>

        {/* 3 Main Cards */}
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6"
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60"
            >
              {/* top accent line on hover */}
              <div
                aria-hidden
                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${card.glow}`}
              />

              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${card.iconBg}`}
                  >
                    {card.icon}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${card.badgeStyle}`}
                  >
                    {<T>{card.badge}</T>}
                  </span>
                </div>

                <h3 className="mb-3 text-xl font-semibold leading-snug tracking-tight text-slate-900">
                  {<T>{card.title}</T>}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  {<T>{card.desc}</T>}
                </p>
              </div>

              <div className="pt-6">
                <span className={`inline-flex cursor-default select-none items-center text-xs font-semibold ${card.btnColor} opacity-70`}>
                  <T>{"Video coming soon"}</T>
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Extra Features Box */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10"
        >
          <h3 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">
            <T>{"And more\r\n          "}</T>
          </h3>
          <p className="mb-8 text-sm font-medium text-slate-500">
            <T>{"Extra features that make your work even easier\r\n          "}</T>
          </p>

          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
            {extraFeatures.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-md md:p-5"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${item.iconBg}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold leading-snug text-slate-900">
                      {<T>{item.title}</T>}
                    </h4>
                    <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500">
                      {<T>{item.desc}</T>}
                    </p>
                  </div>
                </div>

                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${item.arrowBg}`}
                >
                  <ArrowRight size={11} strokeWidth={3} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
</section>
  );
}
