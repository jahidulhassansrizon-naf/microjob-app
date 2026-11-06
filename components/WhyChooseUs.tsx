"use client";
import { T } from "@/components/i18n/I18nProvider";
import {
  Clock,
  ShieldCheck,
  ThumbsUp,
  Headphones,
  Zap,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Aurora,
  EASE,
  GRAD_TEXT,
  IconTile,
  SectionHead,
  SpotCard,
} from "@/components/ui/Premium";

const benefits = [
  {
    title: "File sharing without USB drives",
    desc: "Your time is valuable, so we deliver service as fast as possible.",
    Icon: Clock,
  },
  {
    title: "Cybersecurity & permissions",
    desc: "Control access for multiple employees in your office or shop",
    Icon: ShieldCheck,
  },
  {
    title: "Instant search & tags",
    desc: "A simple and beautiful interface that anyone can use with ease.",
    Icon: ThumbsUp,
  },
  {
    title: "Fast search system",
    desc: "Quickly find edited or printed files by name, date and category",
    Icon: Headphones,
  },
  {
    title: "Pin your favorite files",
    desc: "Pin favorite files/templates for quick access",
    Icon: Zap,
  },
  {
    title: "Direct save, print & email",
    desc: "Save, print, or even send created files directly to a customer's email",
    Icon: Bookmark,
  },
];

export default function WhyChooseUs() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F6F8FF] px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <Aurora variant="side" />

      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-12 lg:gap-14">
        {/* Left: sticky heading */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
          <SectionHead
            align="left"
            icon={<Sparkles size={12} />}
            eyebrow={<T>{"Why Choose Us\r\n          "}</T>}
            title={
              <>
                <span className={GRAD_TEXT}>
                  <T>{"Easy to use,"}</T>
                </span>
                <br />
                <T>{"and more "}</T>
                <T>{"benefits\r\n          "}</T>
              </>
            }
            sub={
              <T>{"We provide fast, safe, and reliable solutions to simplify your daily\r\n            work\r\n          "}</T>
            }
          />
        </div>

        {/* Right: staggered card grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:pb-8 lg:col-span-7 sm:[&>*:nth-child(even)]:translate-y-8"
        >
          {benefits.map(({ title, desc, Icon }, idx) => (
            <SpotCard key={idx} innerClassName="p-7">
              <IconTile tone={idx}>
                <Icon size={20} />
              </IconTile>
              <h3 className="mt-6 text-lg font-extrabold leading-snug tracking-[-0.015em] text-slate-950">
                <T>{title}</T>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                <T>{desc}</T>
              </p>
            </SpotCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
