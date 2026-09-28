"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

export default function AboutOffice() {
  // Container variants for staggered animation
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  // Item variants for header and badges
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1],
      },
    },
  };

  // Card variants for office cards
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="w-full min-h-[580px] m-0 px-4 pt-[92px] pb-[80px] text-center overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Badge */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          className="inline-flex cursor-default items-center justify-center h-10 px-5 rounded-full border border-blue-200 bg-white text-[13px] font-semibold text-[#0F172A] shadow-sm"
        >
          <span>Our address</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          variants={itemVariants}
          className="mt-6 mb-0 text-[46px] leading-[1.08] tracking-[-1.8px] font-extrabold text-[#0F172A]"
        >
          Institutions and{" "}
          <span className="text-[#2563EB]">Office information</span>
        </motion.h2>

        {/* Office cards grid */}
        <motion.div
          variants={itemVariants}
          className="mt-[70px] grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[896px] mx-auto text-left"
        >
          {/* Bangladesh Head Office */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative min-h-[222px] rounded-[28px] bg-white border border-[#E2E8F0] px-8 pt-8 pb-7 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md"
          >
            <span className="absolute top-8 left-8 inline-flex items-center h-[31px] px-4 rounded-full bg-blue-50 border border-blue-200 text-[12px] font-semibold text-[#2563EB]">
              Bangladesh - Head Office
            </span>

            <div className="mt-[58px] space-y-4 text-[15px] text-slate-600">
              <p className="flex items-center gap-3 m-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[17px] h-[17px] shrink-0 text-slate-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span className="italic text-slate-400">
                  Address will be updated soon...
                </span>
              </p>

              <p className="flex items-center gap-3 m-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[17px] h-[17px] shrink-0 text-slate-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 5.18 2 2 0 0 1 5.07 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.24a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                </svg>
                <span className="italic text-slate-400">
                  Phone number will be updated soon...
                </span>
              </p>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="m-0 text-[14px] text-slate-500">
                Trade License Number :{" "}
                <span className="ml-2 italic font-normal text-slate-400">
                  To be updated...
                </span>
              </p>
            </div>
          </motion.div>

          {/* United States Hub */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative min-h-[222px] rounded-[28px] bg-white border border-[#E2E8F0] px-8 pt-8 pb-7 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md"
          >
            <span className="absolute top-8 left-8 inline-flex items-center h-[31px] px-4 rounded-full bg-blue-50 border border-blue-200 text-[12px] font-semibold text-[#2563EB]">
              United States - Hub
            </span>

            <div className="mt-[58px] space-y-4 text-[15px] text-slate-600">
              <p className="flex items-center gap-3 m-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[17px] h-[17px] shrink-0 text-slate-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span className="italic text-slate-400">
                  Address will be updated soon...
                </span>
              </p>

              <p className="flex items-center gap-3 m-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[17px] h-[17px] shrink-0 text-slate-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 5.18 2 2 0 0 1 5.07 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.24a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                </svg>
                <span className="italic text-slate-400">
                  Phone number will be updated soon...
                </span>
              </p>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="m-0 text-[14px] text-slate-500">
                LLC EIN Number :{" "}
                <span className="ml-2 italic font-normal text-slate-400">
                  To be updated...
                </span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
