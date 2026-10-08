"use client";
import { T } from "@/components/i18n/I18nProvider";
import React, { useState } from "react";
import { Phone, Mail, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
export default function ContactHero() {
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
            await emailjs.send(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_qblb0l8", process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_7a9yiov", templateParams, process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "Q7oRWHz649z3LiY0f");
            setStatus({ type: "success", msg: "Message sent successfully!" });
            setFormData({ name: "", email: "", phone: "", subject: "", details: "" });
        }
        catch (error) {
            console.error("EmailJS Error:", error);
            setStatus({
                type: "error",
                msg: "Failed to send message. Please try again.",
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<section className="relative overflow-hidden bg-[#F8FAFC] px-4 sm:px-6 lg:px-8">
      {/* Background Gradient */}
      <div className="absolute inset-x-0 top-0 h-[680px] bg-gradient-to-b from-[#EFF6FF] via-[#E0F2FE]/50 to-[#F8FAFC]"/>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-[1100px] pt-[102px] pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="mx-auto max-w-[760px] text-center">
          <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="inline-flex h-[35px] items-center rounded-full border border-[#2563EB]/20 bg-white/60 px-[17px] text-[13px] font-semibold leading-none text-[#2563EB] shadow-sm backdrop-blur-sm"><T>{"Do you have questions?\r\n          "}</T></motion.span>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }} className="mt-[25px] text-center text-[52px] font-extrabold leading-[1.36] tracking-[-1.7px] text-[#0F172A] sm:text-[54px]">
            <span className="text-[#2563EB]"><T>{"Easy communication"}</T></span>{<T>{" "}</T>}
            <span><T>{"Do it,"}</T></span>
            <br />
            <span><T>{"you will get the solution"}</T></span>
            <br />
            <span><T>{"quickly."}</T></span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }} className="mx-auto mt-[30px] max-w-[700px] text-[17px] font-normal leading-[1.55] text-[#334155]"><T>{"Our team is ready to answer your questions and support you. Fill out\r\n            the form below\r\n            "}</T><br className="hidden sm:block"/><T>{"and we will get back to you shortly.\r\n          "}</T></motion.p>
        </motion.div>

        {/* Form + contact cards */}
        <div className="mx-auto mt-[96px] grid max-w-[764px] grid-cols-1 items-start gap-5 lg:grid-cols-[500px_242px]">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }} className="rounded-[26px] border border-[#E2E8F0] bg-white px-[34px] py-[31px] shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-[29px] font-extrabold leading-[1.25] tracking-[-0.8px] text-[#0F172A]"><T>{"Send your "}</T><span className="text-[#2563EB]"><T>{"message."}</T></span>
            </h2>

            <p className="mt-[8px] text-[16px] leading-[1.45] text-[#475569]"><T>{"Fill out the form and we will contact you soon.\r\n            "}</T></p>

            <form onSubmit={handleSubmit} className="mt-[26px] space-y-[13px]">
              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-[#0F172A]"><T>{"Your name\r\n                "}</T></label>
                <input type="text" required placeholder="Enter your full name......." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-[43px] w-full rounded-[7px] border border-[#E2E8F0] bg-white px-[15px] text-[13px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"/>
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-[#0F172A]"><T>{"Email Address "}</T><span className="text-[#10B981]"><T>{"*"}</T></span>
                </label>
                <input type="email" required placeholder="Enter your email address........" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-[43px] w-full rounded-[7px] border border-[#E2E8F0] bg-white px-[15px] text-[13px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"/>
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-[#0F172A]"><T>{"Phone number "}</T><span className="text-[#10B981]"><T>{"*"}</T></span>
                </label>
                <input type="tel" required placeholder="Enter your phone number......." value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-[43px] w-full rounded-[7px] border border-[#E2E8F0] bg-white px-[15px] text-[13px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"/>
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-[#0F172A]"><T>{"Subject\r\n                "}</T></label>
                <input type="text" placeholder="What do you want to know about?" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="h-[43px] w-full rounded-[7px] border border-[#E2E8F0] bg-white px-[15px] text-[13px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"/>
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-[#0F172A]"><T>{"Details "}</T><span className="text-[#10B981]"><T>{"*"}</T></span>
                </label>
                <textarea rows={5} required placeholder="Write your words..." value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} className="h-[102px] w-full resize-none rounded-[7px] border border-[#E2E8F0] bg-white px-[15px] py-[12px] text-[13px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"/>
              </div>

              {/* Status Message */}
              {status && (<p className={`text-[13px] font-semibold ${status.type === "success"
                ? "text-[#10B981]"
                : "text-red-500"}`}>
                  {status.msg}
                </p>)}

              <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="mt-[3px] flex h-[45px] w-full cursor-pointer items-center justify-center gap-2 rounded-[7px] bg-[#2563EB] px-6 text-[13px] font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-70 shadow-sm">
                {loading ? (<>
                    <Loader2 className="h-4 w-4 animate-spin"/><T>{"Sending...\r\n                  "}</T></>) : <T>{("Send us")}</T>}
              </motion.button>
            </form>
          </motion.div>

          {/* Contact information */}
          <div className="space-y-5">
            {/* Phone */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="min-h-[167px] rounded-[24px] border border-[#E2E8F0] bg-white px-[26px] py-[25px] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#10B981] text-white">
                  <Phone className="h-[27px] w-[27px]" strokeWidth={2.1}/>
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-[#0F172A]"><T>{"Phone number\r\n                  "}</T></h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#64748B]"><T>{"9 am to 6 pm\r\n                  "}</T></p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#E2E8F0]"/>

              <div className="space-y-[4px] text-[13px] italic font-normal text-[#64748B]">
                <p><T>{"Phone number will be updated soon..."}</T></p>
              </div>
            </motion.div>

            {/* Email */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="min-h-[167px] rounded-[24px] border border-[#E2E8F0] bg-white px-[26px] py-[25px] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#2563EB] text-white">
                  <Mail className="h-[27px] w-[27px]" strokeWidth={2.1}/>
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-[#0F172A]"><T>{"Email\r\n                  "}</T></h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#64748B]"><T>{"Reply within 24 hours\r\n                  "}</T></p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#E2E8F0]"/>

              <div className="space-y-[4px] text-[13px] italic font-normal text-[#64748B]">
                <p><T>{"Email address will be updated soon..."}</T></p>
              </div>
            </motion.div>

            {/* Office hours */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="min-h-[175px] rounded-[24px] border border-[#E2E8F0] bg-white px-[26px] py-[25px] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#6366F1] text-white">
                  <Clock className="h-[27px] w-[27px]" strokeWidth={2.1}/>
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-[#0F172A]"><T>{"Office hours\r\n                  "}</T></h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#64748B]"><T>{"Reliable and fast support\r\n                  "}</T></p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#E2E8F0]"/>

              <div className="space-y-[13px] text-[12px] text-[#475569]">
                <div>
                  <p className="font-extrabold text-[#0F172A]"><T>{"Sunday - Thursday\r\n                  "}</T></p>
                  <p className="mt-[3px] text-[#64748B]"><T>{"09:00 AM - 05:00 PM"}</T></p>
                </div>

                <div>
                  <p className="font-extrabold text-[#0F172A]"><T>{"Friday - Saturday\r\n                  "}</T></p>
                  <p className="mt-[3px] text-[#94A3B8]"><T>{"Weekend"}</T></p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>);
}
