"use client";

import { T, useI18n } from "@/components/i18n/I18nProvider";
import React, { useState } from "react";
import { Phone, Mail, Clock, Loader2, House } from "lucide-react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";

const CONTACT_PHONE = "017836666743";
const CONTACT_EMAIL = "jahidulhassansrizon@gmail.com";

export default function ContactHero() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    details: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      phone_number: formData.phone,
      subject: formData.subject,
      message: formData.details,
    };

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_qblb0l8",
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_7a9yiov",
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "Q7oRWHz649z3LiY0f",
      );
      setStatus({ type: "success", msg: "Message sent successfully!" });
      setFormData({ name: "", email: "", phone: "", subject: "", details: "" });
    } catch (error) {
      console.error("EmailJS Error:", error);
      setStatus({ type: "error", msg: "Failed to send message. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "h-[43px] w-full rounded-[9px] border border-[#E7E1CB] bg-white/80 px-4 text-[13px] text-[#172033] outline-none placeholder:text-[#9695A3] focus:border-[#5364E8] focus:ring-2 focus:ring-[#5364E8]/10";
  const labelClass = "mb-2 block text-[13px] font-bold text-[#182033]";

  return (
    <section className="relative overflow-hidden bg-[#FFFBE7] px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_64%)]" />
      <div className="relative z-10 mx-auto max-w-[1100px] pb-20 pt-[76px] sm:pt-[92px]">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-[760px] text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#5965E8]/20 bg-white/75 px-4 py-2 text-[13px] font-semibold text-[#4354D9] shadow-sm">
            <T>{"Do you have questions or ideas?"}</T>
          </span>
          <h1 className="mt-6 text-[38px] font-extrabold leading-tight tracking-[-1.2px] text-[#121827] sm:text-[52px]">
            <span className="text-[#4259D9]"><T>{"Let's talk"}</T></span>{" "}
            <T>{"about your project."}</T>
          </h1>
          <p className="mx-auto mt-5 max-w-[710px] text-[16px] leading-7 text-[#555D70] sm:text-[17px]">
            <T>{"Sohoj Hub is independently built and operated from a home workspace in Tongi, Bangladesh. Send a message about support, feedback, or collaboration, and I'll reply as soon as I can."}</T>
          </p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-[900px] grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="rounded-[26px] border border-[#E9E2CC] bg-white/80 p-6 shadow-[0_18px_50px_rgba(48,48,80,0.07)] sm:p-8"
          >
            <h2 className="text-[27px] font-extrabold leading-tight tracking-[-0.7px] text-[#171D2D] sm:text-[29px]">
              <T>{"Send your message."}</T>
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#60677A]">
              <T>{"Tell me a little about what you need. I'll get back to you as soon as I can."}</T>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className={labelClass} htmlFor="contact-name"><T>{"Your name"}</T></label>
                <input id="contact-name" type="text" autoComplete="name" required placeholder={t("Enter your full name")} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="contact-email"><T>{"Email address"}</T> <span className="text-emerald-600">*</span></label>
                <input id="contact-email" type="email" autoComplete="email" required placeholder={t("Enter your email address")} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="contact-phone"><T>{"Phone number"}</T> <span className="text-emerald-600">*</span></label>
                <input id="contact-phone" type="tel" autoComplete="tel" required placeholder={t("Enter your phone number")} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="contact-subject"><T>{"Subject"}</T></label>
                <input id="contact-subject" type="text" placeholder={t("What would you like to discuss?")} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="contact-details"><T>{"Message details"}</T> <span className="text-emerald-600">*</span></label>
                <textarea id="contact-details" rows={5} required placeholder={t("Write your message here...")} value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} className="min-h-[112px] w-full resize-y rounded-[9px] border border-[#E7E1CB] bg-white/80 px-4 py-3 text-[13px] text-[#172033] outline-none placeholder:text-[#9695A3] focus:border-[#5364E8] focus:ring-2 focus:ring-[#5364E8]/10" />
              </div>

              {status && (
                <p role="status" aria-live="polite" className={`text-[13px] font-semibold ${status.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
                  <T>{status.msg}</T>
                </p>
              )}

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.985 }} type="submit" disabled={loading} className="flex h-[47px] w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#3F60DD] to-[#7215D5] px-6 text-[13px] font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><T>{"Sending..."}</T></> : <T>{"Send message"}</T>}
              </motion.button>
            </form>
          </motion.div>

          <div className="space-y-4">
            <motion.a href={`tel:${CONTACT_PHONE}`} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.18 }} whileHover={{ y: -3 }} className="block rounded-[23px] border border-[#E9E2CC] bg-white/80 p-5 shadow-[0_12px_32px_rgba(48,48,80,0.05)] sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-emerald-500 text-white"><Phone className="h-6 w-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-extrabold text-[#171D2D]"><T>{"Phone"}</T></span>
                  <span className="mt-1 block text-[12px] leading-5 text-[#697084]"><T>{"Call if you need a quick reply"}</T></span>
                </span>
              </div>
              <div className="my-4 h-px bg-[#EBE6D8]" />
              <span className="text-[15px] font-semibold text-[#3E58D7]">{CONTACT_PHONE}</span>
            </motion.a>

            <motion.a href={`mailto:${CONTACT_EMAIL}`} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.25 }} whileHover={{ y: -3 }} className="block rounded-[23px] border border-[#E9E2CC] bg-white/80 p-5 shadow-[0_12px_32px_rgba(48,48,80,0.05)] sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#4260DB] text-white"><Mail className="h-6 w-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-extrabold text-[#171D2D]"><T>{"Email"}</T></span>
                  <span className="mt-1 block text-[12px] leading-5 text-[#697084]"><T>{"Reach out any time"}</T></span>
                </span>
              </div>
              <div className="my-4 h-px bg-[#EBE6D8]" />
              <span className="break-all text-[13px] font-semibold text-[#3E58D7]">{CONTACT_EMAIL}</span>
            </motion.a>

            <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.32 }} whileHover={{ y: -3 }} className="rounded-[23px] border border-[#E9E2CC] bg-white/80 p-5 shadow-[0_12px_32px_rgba(48,48,80,0.05)] sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-violet-500 text-white"><House className="h-6 w-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-extrabold text-[#171D2D]"><T>{"Home-based workspace"}</T></span>
                  <span className="mt-1 block text-[12px] leading-5 text-[#697084]"><T>{"Flexible availability"}</T></span>
                </span>
              </div>
              <div className="my-4 h-px bg-[#EBE6D8]" />
              <p className="text-[13px] leading-6 text-[#555D70]"><T>{"I work from home and am usually reachable throughout the day. Urgent work or errands may occasionally delay a reply, so please contact me before visiting."}</T></p>
              <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-[#3E58D7]"><Clock className="h-4 w-4" /><T>{"No fixed office hours"}</T></div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
