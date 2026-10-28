"use client";

import { T } from "@/components/i18n/I18nProvider";
import { motion } from "framer-motion";
import { ArrowUpRight, House, MapPin, Mail, Phone } from "lucide-react";

const ADDRESS = "Bou Bazar Rd, Tongi 1230, Bangladesh";
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
const PHONE = "017836666743";
const EMAIL = "jahidulhassansrizon@gmail.com";

export default function ContactMap() {
  return (
    <section className="relative overflow-hidden bg-[#FFFBE7] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_50%,rgba(81,99,224,0.09),transparent_35%),radial-gradient(ellipse_at_90%_20%,rgba(123,34,213,0.07),transparent_32%)]" />
      <div className="relative mx-auto grid max-w-[1100px] items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#5965E8]/20 bg-white/75 px-4 py-2 text-[13px] font-semibold text-[#4354D9] shadow-sm"><House className="h-4 w-4" /><T>{"Home-based workspace"}</T></span>
          <h2 className="mt-5 text-[33px] font-extrabold leading-tight tracking-[-0.9px] text-[#151B2A] sm:text-[42px]">
            <T>{"A home workspace,"}</T><br /><span className="text-[#4359DC]"><T>{"built for a bigger idea."}</T></span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] leading-7 text-[#555D70] sm:text-[16px]">
            <T>{"Seba Lagbe is an independently built digital platform, currently developed and managed from a home workspace in Tongi, Bangladesh. There is no separate walk-in office, so please get in touch before planning a visit."}</T>
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3F60DD] to-[#7215D5] px-5 py-3 text-[13px] font-bold text-white shadow-md transition hover:brightness-105">
              <MapPin className="h-4 w-4" /><T>{"Find the area on Google Maps"}</T><ArrowUpRight className="h-4 w-4" />
            </a>
            <a href={`mailto:${EMAIL}`} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#E4DEC9] bg-white/80 px-5 py-3 text-[13px] font-bold text-[#29324B] transition hover:border-[#8D97EC]">
              <Mail className="h-4 w-4" /><T>{"Contact before visiting"}</T>
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }} className="relative overflow-hidden rounded-[28px] border border-[#E6E0CD] bg-[#080B19] p-6 text-white shadow-[0_24px_70px_rgba(22,25,58,0.18)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(108,67,255,0.28),transparent_44%),linear-gradient(135deg,rgba(39,61,143,0.22),transparent_54%)]" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#B9C5FF]"><MapPin className="h-7 w-7" /></div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#AAB5F5]"><T>{"Bangladesh · Tongi"}</T></p>
                <h3 className="mt-1 text-[21px] font-bold sm:text-[24px]"><T>{"Home workspace"}</T></h3>
              </div>
            </div>
            <div className="my-6 h-px bg-white/10" />
            <p className="text-[16px] font-semibold leading-7 text-white"><T>{ADDRESS}</T></p>
            <p className="mt-3 text-[13px] leading-6 text-slate-300"><T>{"This is a home-based working location, not a public reception or registered corporate office."}</T></p>
            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
              <a href={`tel:${PHONE}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.08]">
                <Phone className="h-4 w-4 shrink-0 text-emerald-300" />
                <span className="min-w-0"><span className="block text-[11px] text-slate-400"><T>{"Phone"}</T></span><span className="mt-1 block truncate text-[12px] font-semibold">{PHONE}</span></span>
              </a>
              <a href={`mailto:${EMAIL}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.08]">
                <Mail className="h-4 w-4 shrink-0 text-sky-300" />
                <span className="min-w-0"><span className="block text-[11px] text-slate-400"><T>{"Email"}</T></span><span className="mt-1 block truncate text-[12px] font-semibold">{EMAIL}</span></span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
