"use client";

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

    // EmailJS এ ডেটা পাঠানোর ফরম্যাট
    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      phone_number: formData.phone,
      subject: formData.subject,
      message: formData.details,
    };

    try {
      await emailjs.send(
        "service_qblb0l8", // আপনার Service ID
        "template_7a9yiov", // আপনার Template ID
        templateParams,
        "Q7oRWHz649z3LiY0f", // আপনার Public Key
      );

      setStatus({ type: "success", msg: "Message sent successfully!" });
      setFormData({ name: "", email: "", phone: "", subject: "", details: "" });
    } catch (error) {
      console.error("EmailJS Error:", error);
      setStatus({
        type: "error",
        msg: "Failed to send message. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#e5e7eb] px-4 sm:px-6 lg:px-8">
      {/* Background Gradient */}
      <div className="absolute inset-x-0 top-0 h-[680px] bg-gradient-to-b from-[#ffe6d0] via-[#fadae2] to-[#dbe0f0]" />

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-[1100px] pt-[102px] pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-[760px] text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex h-[35px] items-center rounded-full border border-[#ff8a00] bg-white/40 px-[17px] text-[13px] font-semibold leading-none text-[#ff7a00] shadow-sm backdrop-blur-sm"
          >
            Do you have questions?
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-[25px] text-center text-[52px] font-extrabold leading-[1.36] tracking-[-1.7px] text-black sm:text-[54px]"
          >
            <span className="text-[#ff7a00]">Easy communication</span>{" "}
            <span>Do it,</span>
            <br />
            <span>you will get the solution</span>
            <br />
            <span>quickly.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mx-auto mt-[30px] max-w-[700px] text-[17px] font-normal leading-[1.55] text-[#15243a]"
          >
            Our team is ready to answer your questions and support you. Fill out
            the form below
            <br className="hidden sm:block" />
            and we will get back to you shortly.
          </motion.p>
        </motion.div>

        {/* Form + contact cards */}
        <div className="mx-auto mt-[96px] grid max-w-[764px] grid-cols-1 items-start gap-5 lg:grid-cols-[500px_242px]">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="rounded-[26px] bg-white px-[34px] py-[31px] shadow-[0_12px_40px_rgba(26,31,44,0.08)]"
          >
            <h2 className="text-[29px] font-extrabold leading-[1.25] tracking-[-0.8px] text-black">
              Send your <span className="text-[#ff7a00]">message.</span>
            </h2>

            <p className="mt-[8px] text-[16px] leading-[1.45] text-[#344054]">
              Fill out the form and we will contact you soon.
            </p>

            <form onSubmit={handleSubmit} className="mt-[26px] space-y-[13px]">
              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Your name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name......."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-[43px] w-full rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Email Address <span className="text-[#ff7a00]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address........"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-[43px] w-full rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Phone number <span className="text-[#ff7a00]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Enter your phone number......."
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="h-[43px] w-full rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="What do you want to know about?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="h-[43px] w-full rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Details <span className="text-[#ff7a00]">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write your words..."
                  value={formData.details}
                  onChange={(e) =>
                    setFormData({ ...formData, details: e.target.value })
                  }
                  className="h-[102px] w-full resize-none rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] py-[12px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              {/* Status Message */}
              {status && (
                <p
                  className={`text-[13px] font-semibold ${
                    status.type === "success"
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {status.msg}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="mt-[3px] flex h-[45px] w-full cursor-pointer items-center justify-center gap-2 rounded-[7px] bg-[#ff5a00] px-6 text-[13px] font-bold text-white transition hover:bg-[#f45100] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send us"
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Contact information */}
          <div className="space-y-5">
            {/* Phone */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="min-h-[167px] rounded-[24px] border border-black/10 bg-white px-[26px] py-[25px] shadow-[0_8px_30px_rgba(26,31,44,0.06)]"
            >
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#00cc67] text-white">
                  <Phone className="h-[27px] w-[27px]" strokeWidth={2.1} />
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-black">
                    Phone number
                  </h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#7b8798]">
                    9 am to 6 pm
                  </p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#dfe3e8]" />

              <div className="space-y-[4px] text-[14px] font-semibold leading-[1.2] text-[#334155]">
                <p>+88 01700-559595</p>
                <p>+88 01718-542596</p>
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="min-h-[167px] rounded-[24px] border border-black/10 bg-white px-[26px] py-[25px] shadow-[0_8px_30px_rgba(26,31,44,0.06)]"
            >
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#1e9eff] text-white">
                  <Mail className="h-[27px] w-[27px]" strokeWidth={2.1} />
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-black">
                    Email
                  </h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#7b8798]">
                    Reply within 24 hours
                  </p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#dfe3e8]" />

              <div className="space-y-[4px] text-[13px] font-semibold leading-[1.2] text-[#334155]">
                <p>hello@sohozkaj.com</p>
                <p>support@sohozkaj.com</p>
              </div>
            </motion.div>

            {/* Office hours */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="min-h-[175px] rounded-[24px] border border-black/10 bg-white px-[26px] py-[25px] shadow-[0_8px_30px_rgba(26,31,44,0.06)]"
            >
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#d43ce8] text-white">
                  <Clock className="h-[27px] w-[27px]" strokeWidth={2.1} />
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-black">
                    Office hours
                  </h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#7b8798]">
                    Reliable and fast support
                  </p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#dfe3e8]" />

              <div className="space-y-[13px] text-[12px] text-[#475467]">
                <div>
                  <p className="font-extrabold text-black">Sunday - Thursday</p>
                  <p className="mt-[3px] text-[#667085]">09:00 AM - 05:00 PM</p>
                </div>

                <div>
                  <p className="font-extrabold text-black">Friday - Saturday</p>
                  <p className="mt-[3px] text-[#98a2b3]">Weekend</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
