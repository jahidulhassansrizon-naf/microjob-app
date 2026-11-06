"use client";
import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import {
  LayoutGrid,
  FileEdit,
  Image as ImageIcon,
  ArrowRight,
  Printer,
  FolderDown,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Aurora,
  BTN_PRIMARY,
  EASE,
  GRAD_TEXT,
  IconTile,
  SectionHead,
  Shine,
  SoonChip,
  SpotCard,
} from "@/components/ui/Premium";

const cards = [
  {
    title: "Massive print-ready design library",
    desc: "This huge collection of various categories (AI, PSD & preview) is completely free",
    Icon: LayoutGrid,
    span: "lg:col-span-2",
  },
  {
    title: "Replace text in a flash",
    desc: "Create, edit and print with different information all at once",
    Icon: FileEdit,
    span: "",
  },
  {
    title: "Replace logos, images and other photos",
    desc: "This huge collection of various categories (AI, PSD & preview) is completely free",
    Icon: ImageIcon,
    span: "",
  },
  {
    title: "Create your file instantly",
    desc: "Create your file easily in the print media service.",
    Icon: ArrowRight,
    span: "",
  },
  {
    title: "Share or email your created file",
    desc: "Instantly download or email your created file at any time.",
    Icon: Printer,
    span: "",
  },
  {
    title: "AI, PSD, PNG, CMYK, RGB — whatever you need",
    desc: "Save the final version in any format with one click.",
    Icon: FolderDown,
    span: "lg:col-span-2",
  },
];

export default function PrintMediaSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <Aurora variant="top" />

      <div className="mx-auto flex max-w-[1400px] flex-col gap-14 md:gap-16">
        <SectionHead
          icon={<Printer size={12} />}
          eyebrow={<T>{"Our Print Service\r\n          "}</T>}
          title={
            <>
              <T>{"Seba Lagbe-Professional "}</T>
              <br />
              <span className={GRAD_TEXT}>
                <T>{"Print Media"}</T>
              </span>
              {<T>{" "}</T>}
              <T>{"Solution"}</T>
            </>
          }
          sub={<T>{"Banners, flyers, posters, business cards and more \u2014 quality print\r\n            services for your brand.\r\n          "}</T>}
        />

        {/* Bento: wide cards at the start and end of the grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {cards.map(({ title, desc, Icon, span }, idx) => (
            <SpotCard
              key={idx}
              className={`min-h-[230px] ${span} ${
                span ? "md:col-span-2" : ""
              }`}
              innerClassName="p-7"
            >
              <div className="flex items-start justify-between">
                <IconTile tone={idx}>
                  <Icon size={20} />
                </IconTile>
                <SoonChip />
              </div>
              <h3
                className={`mt-6 font-extrabold leading-snug tracking-[-0.015em] text-slate-950 ${
                  span ? "text-xl" : "text-lg"
                }`}
              >
                <T>{title}</T>
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                <T>{desc}</T>
              </p>
            </SpotCard>
          ))}
        </motion.div>

        {/* CTA — light card with a gradient rim */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="rounded-[34px] bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 p-px shadow-[0_30px_70px_-34px_rgba(79,70,229,0.55)]"
        >
          <div className="relative flex flex-col items-start justify-between gap-8 overflow-hidden rounded-[33px] bg-white px-7 py-10 md:px-12 md:py-12 lg:flex-row lg:items-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-200/60 to-fuchsia-200/50 blur-3xl"
            />
            <div className="relative max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                <Sparkles size={12} />
                <T>{"Special Offer\r\n          "}</T>
              </span>
              <h2 className="text-3xl font-black leading-[1.1] tracking-[-0.03em] text-slate-950 md:text-[42px]">
                <T>{"Start Today with Seba Lagbe - Completely Free\r\n          "}</T>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                <T>{"Document creation, print media, professional photo creation \u2014\r\n            everything included.\r\n          "}</T>
              </p>
            </div>

            <Link href="/dashboard" className={`${BTN_PRIMARY} relative shrink-0`}>
              <Shine />
              <span className="relative">
                <T>{"Get Started Now"}</T>
              </span>
              <ArrowRight
                size={16}
                className="relative transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
