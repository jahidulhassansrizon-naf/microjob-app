"use client";

import { T } from "@/components/i18n/I18nProvider";
import { motion } from "framer-motion";
import { House, Phone, Mail, Clock, UserRound } from "lucide-react";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";
import { getContactList } from "@/app/_components/contactSettings";

export default function RegisteredAddress() {
  const { settings } = useSiteSettings();
  const addresses = getContactList(settings.contact, "locations");
  const phones = getContactList(settings.contact, "phones");
  const emails = getContactList(settings.contact, "emails");
  return (
    <section className="bg-[#FFFBE7] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-[1050px]">
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mx-auto max-w-[740px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#5965E8]/20 bg-white/75 px-4 py-2 text-[13px] font-semibold text-[#4354D9] shadow-sm"><House className="h-4 w-4" /><T>{"Workspace information"}</T></span>
          <h2 className="mt-5 text-[32px] font-extrabold leading-tight tracking-[-0.8px] text-[#151B2A] sm:text-[43px]">
            <T>{"Home workspace"}</T> <span className="text-[#4359DC]"><T>{"& contact details"}</T></span>
          </h2>
          <p className="mx-auto mt-4 max-w-[690px] text-[15px] leading-7 text-[#555D70] sm:text-[16px]">
            {`${settings.branding.siteName} is a solo developer-operated project. The platform is currently built and managed from a home workspace rather than a separate public office.`}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }} className="mx-auto mt-9 grid max-w-[900px] overflow-hidden rounded-[28px] border border-[#E7E0CA] bg-white/80 shadow-[0_18px_48px_rgba(48,48,80,0.06)] md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden bg-[#090C1A] p-7 text-white sm:p-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_5%,rgba(105,72,255,0.30),transparent_43%),linear-gradient(145deg,rgba(44,65,140,0.20),transparent_55%)]" />
            <div className="relative">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#C4CCFF]"><House className="h-7 w-7" /></span>
              <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#AAB5F5]"><T>{"Bangladesh · Tongi"}</T></p>
              <h3 className="mt-2 text-[25px] font-extrabold leading-tight"><T>{"A home-based studio"}</T></h3>
              <div className="mt-4 space-y-2">{addresses.map((address, index) => <p key={`${address}-${index}`} className="text-[14px] leading-7 text-slate-300"><T>{address}</T></p>)}</div>
              <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-[12px] leading-6 text-slate-300">{settings.contactPage.visitNote}</p>
            </div>
          </div>

          <div className="p-7 sm:p-9">
            <div className="flex items-start gap-4 border-b border-[#E9E3D2] pb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF0FF] text-[#4659DB]"><UserRound className="h-5 w-5" /></span>
              <div>
                <h3 className="text-[16px] font-extrabold text-[#172033]"><T>{"Independently operated"}</T></h3>
                <p className="mt-1 text-[13px] leading-6 text-[#646B7B]">{`${settings.branding.siteName} is currently developed and maintained by one full-stack developer.`}</p>
              </div>
            </div>
            {phones.map((phone, index) => <a key={`${phone}-${index}`} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-start gap-4 border-b border-[#E9E3D2] py-5 transition hover:opacity-80">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F9F0] text-emerald-700"><Phone className="h-5 w-5" /></span>
              <span className="min-w-0"><span className="block text-[15px] font-bold text-[#172033]"><T>{"Phone"}</T></span><span className="mt-1 block text-[13px] text-[#4659DB]">{phone}</span></span>
            </a>)}
            {emails.map((email, index) => <a key={`${email}-${index}`} href={`mailto:${email}`} className="flex items-start gap-4 border-b border-[#E9E3D2] py-5 transition hover:opacity-80">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#4659DB]"><Mail className="h-5 w-5" /></span>
              <span className="min-w-0"><span className="block text-[15px] font-bold text-[#172033]"><T>{"Email"}</T></span><span className="mt-1 block break-all text-[13px] text-[#4659DB]">{email}</span></span>
            </a>)}
            <div className="flex items-start gap-4 pt-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EAFE] text-violet-700"><Clock className="h-5 w-5" /></span>
              <div>
                <h3 className="text-[15px] font-bold text-[#172033]">{settings.contactPage.availabilityLabel}</h3>
                <p className="mt-1 text-[13px] leading-6 text-[#646B7B]">{settings.contactPage.availabilityText}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
