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
  FileSignature,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Aurora,
  EASE,
  GRAD_TEXT,
  IconTile,
  SectionHead,
  SoonChip,
  SpotCard,
} from "@/components/ui/Premium";

const cards = [
  {
    title: "Update information in a flash",
    desc: "Change information in up to 50 pages of paper through a simple form.",
    badge: "AI Powered",
    badgeStyle: "bg-blue-50 text-blue-700 ring-blue-200",
    Icon: FileEdit,
  },
  {
    title: "Export files as PDF",
    desc: "Save and download your created file as PDF.",
    badge: "Popular",
    badgeStyle: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    Icon: FileText,
  },
  {
    title: "Share or email your document",
    desc: "Download or email your created document instantly, anytime.",
    badge: "Secure",
    badgeStyle: "bg-violet-50 text-violet-700 ring-violet-200",
    Icon: Send,
  },
];

const extraFeatures = [
  {
    title: "Multiple page sizes & formats",
    desc: "Set custom margins and sizes — A4, A5, Deed, and more.",
    Icon: FileCheck,
  },
  {
    title: "Document preview system",
    desc: "Preview your document before downloading as PDF.",
    Icon: Eye,
  },
  {
    title: "Keyboard shortcuts to save time",
    desc: "Do everything quickly with just the keyboard, no mouse needed.",
    Icon: Keyboard,
  },
];

export default function DocumentSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F6F8FF] px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <Aurora variant="bottom" />

      <div className="mx-auto flex max-w-[1400px] flex-col gap-14">
        <SectionHead
          icon={<FileSignature size={12} />}
          eyebrow={<T>{"Document Creation\r\n          "}</T>}
          title={
            <>
              <T>{"In Seba Lagbe contracts & documents"}</T>
              {<T>{" "}</T>}
              <br className="hidden sm:inline" />
              <span className={GRAD_TEXT}>
                <T>{"instantly"}</T>
              </span>
            </>
          }
          sub={<T>{"Change text in contracts and other papers in moments through a\r\n            simple form\r\n          "}</T>}
        />

        {/* 3 main cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5"
        >
          {cards.map(({ title, desc, badge, badgeStyle, Icon }, idx) => (
            <SpotCard key={idx} className="min-h-[300px]" innerClassName="p-8">
              <div className="flex items-start justify-between">
                <IconTile tone={idx} size="lg">
                  <Icon size={24} />
                </IconTile>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${badgeStyle}`}
                >
                  <T>{badge}</T>
                </span>
              </div>
              <h3 className="mt-7 text-xl font-extrabold leading-snug tracking-[-0.02em] text-slate-950">
                <T>{title}</T>
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                <T>{desc}</T>
              </p>
              <div className="mt-auto pt-7">
                <SoonChip />
              </div>
            </SpotCard>
          ))}
        </motion.div>

        {/* "And more" — one glass bar, three divided items */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="overflow-hidden rounded-[30px] border border-white bg-white/80 shadow-[0_20px_50px_-30px_rgba(30,41,99,0.4)] ring-1 ring-slate-200/70 backdrop-blur"
        >
          <div className="flex flex-col gap-1 border-b border-slate-200/70 px-7 py-6 text-center sm:text-left md:px-10">
            <h3 className="text-2xl font-black tracking-[-0.02em] text-slate-950">
              <T>{"And more\r\n          "}</T>
            </h3>
            <p className="text-sm text-slate-500">
              <T>{"Extra features that make your work even easier\r\n          "}</T>
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-200/70 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {extraFeatures.map(({ title, desc, Icon }, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-4 px-7 py-6 transition-colors duration-300 hover:bg-indigo-50/40 md:px-10"
              >
                <IconTile tone={idx + 3} size="sm">
                  <Icon size={18} />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-extrabold leading-snug text-slate-900">
                    <T>{title}</T>
                  </h4>
                  <p className="mt-0.5 text-xs leading-snug text-slate-500">
                    <T>{desc}</T>
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 -translate-x-1 text-indigo-500 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
