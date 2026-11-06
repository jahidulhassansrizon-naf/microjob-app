"use client";
import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  Palette,
  Shirt,
  Image as ImageIcon,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  EASE,
  IconTile,
  SoonChip,
  SpotCard,
} from "@/components/ui/Premium";

const bottomCards = [
  {
    title: "Background & outfit changes",
    desc: "Change background color, hair color, and skin tone however you want with one click",
    Icon: Shirt,
  },
  {
    title: "Any size, any format, print ready",
    desc: "Save photos in specific sizes for passport, visa, NID, birth registration in JPG format",
    Icon: ImageIcon,
  },
  {
    title: "Share, print, download with ease",
    desc: "On Seba Lagbe, instantly download, share, or email your photos without any hassle.",
    Icon: Share2,
  },
];

const stats = [
  { big: "6+ Hours\r\n                  ", small: "saved every day\r\n                  " },
  { big: "One Click\r\n                  ", small: "photo creation\r\n                  " },
  { big: "You too", small: "get started\r\n                  " },
];

export default function AiEditorSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-4 pb-20 pt-6 sm:px-6 md:px-12 md:pb-28">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 md:gap-5">
        <div className="grid grid-cols-1 items-stretch gap-4 md:gap-5 lg:grid-cols-12">
          {/* Dark brand banner */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative flex min-h-[500px] flex-col justify-between overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white shadow-[0_40px_80px_-40px_rgba(30,27,75,0.8)] ring-1 ring-white/10 sm:p-10 md:p-12 lg:col-span-7"
          >
            {/* glows + grid */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/60 to-indigo-600/40 blur-3xl" />
              <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-gradient-to-tr from-fuchsia-600/40 to-violet-600/30 blur-3xl" />
              <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_80%_70%_at_100%_0%,#000_20%,transparent_75%)]" />
            </div>

            <div className="relative">
              <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-3.5 text-[11px] font-bold backdrop-blur">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500">
                  <Sparkles size={12} />
                </span>
                <T>{"AI POWERED"}</T>
              </span>

              <h2 className="text-5xl font-black leading-[1.02] tracking-[-0.035em] sm:text-6xl md:text-7xl">
                <T>{"10x Faster\r\n              "}</T>
              </h2>
              <h3 className="mt-2 bg-gradient-to-r from-blue-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl md:text-4xl">
                <T>{"Get the job done.\r\n              "}</T>
              </h3>

              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                <T>{"Use our advanced AI tools to finish hours of work in minutes and\r\n                create professional photos with ease.\r\n              "}</T>
              </p>

              <div className="mt-9 grid grid-cols-3 gap-2.5 sm:gap-3">
                {stats.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md sm:p-4"
                  >
                    <p className="text-sm font-extrabold sm:text-lg">
                      <T>{s.big}</T>
                    </p>
                    <span className="mt-1 block text-[10px] font-medium text-slate-400 sm:text-[11px]">
                      <T>{s.small}</T>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-10">
              <Link
                href="/dashboard"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-slate-950 shadow-[0_18px_34px_-14px_rgba(255,255,255,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-50 sm:w-auto"
              >
                <T>{"Start using AI Tools"}</T>
                <ArrowUpRight
                  size={18}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </motion.div>

          {/* Two stacked cards */}
          <div className="flex flex-col gap-4 md:gap-5 lg:col-span-5">
            <motion.div
              className="flex flex-1"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            >
              <SpotCard className="w-full" innerClassName="p-8 sm:p-9">
                <IconTile tone={0} size="lg">
                  <Sparkles size={24} />
                </IconTile>
                <h3 className="mt-6 text-xl font-extrabold tracking-[-0.02em] text-slate-950 sm:text-2xl">
                  <T>{"Seba Lagbe's Smart AI Editor.\r\n                "}</T>
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                  <T>{"Create professional photos from ordinary images in just a few\r\n                  seconds\u2014no Photoshop required\r\n                "}</T>
                </p>
                <div className="mt-auto pt-6">
                  <SoonChip />
                </div>
              </SpotCard>
            </motion.div>

            <motion.div
              className="flex flex-1"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            >
              <SpotCard className="w-full" innerClassName="p-8 sm:p-9">
                <IconTile tone={2} size="lg">
                  <Palette size={24} />
                </IconTile>
                <h3 className="mt-6 text-xl font-extrabold tracking-[-0.02em] text-slate-950 sm:text-2xl">
                  <T>{"One-click professional outfit editing\r\n                "}</T>
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                  <T>{"On Seba Lagbe, easily edit your photos with blue, black, or\r\n                  gray suits, navy blazers, white shirts, polo shirts, as well\r\n                  as casual and traditional outfits.\r\n                "}</T>
                </p>
                <div className="mt-auto pt-6">
                  <SoonChip />
                </div>
              </SpotCard>
            </motion.div>
          </div>
        </div>

        {/* 3 feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5"
        >
          {bottomCards.map(({ title, desc, Icon }, idx) => (
            <SpotCard key={idx} className="min-h-[250px]" innerClassName="p-7 sm:p-8">
              <IconTile tone={idx + 3}>
                <Icon size={22} />
              </IconTile>
              <h3 className="mt-6 text-lg font-extrabold tracking-[-0.015em] text-slate-950 sm:text-xl">
                <T>{title}</T>
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                <T>{desc}</T>
              </p>
              <div className="mt-auto pt-6">
                <SoonChip />
              </div>
            </SpotCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
