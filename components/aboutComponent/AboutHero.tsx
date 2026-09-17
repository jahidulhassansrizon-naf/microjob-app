"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

export default function AboutHero() {
  // Container variants for staggered entrance with TypeScript typing
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

  // Item variants for smooth fade & slide up animation
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.215, 0.61, 0.355, 1],
      },
    },
  };

  // Card animation variants
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    // -mt-[160px] দিয়ে নেভবারের ব্যাকগ্রাউন্ড কভার ঠিক রাখা হয়েছে
    <section className="relative isolate -mt-[160px] overflow-hidden bg-white p-0">
      {/* Soft pastel background glow with gentle fade-in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 7% 68%, rgba(182, 255, 218, 0.45) 0%, rgba(182, 255, 218, 0) 31%), radial-gradient(circle at 41% 100%, rgba(202, 196, 255, 0.40) 0%, rgba(202, 196, 255, 0) 34%), radial-gradient(circle at 93% 70%, rgba(255, 218, 205, 0.48) 0%, rgba(255, 218, 205, 0) 34%)",
        }}
      />

      {/* Main Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto flex w-full max-w-[1180px] flex-col items-center px-5 pb-[185px] pt-[190px] text-center sm:px-6 lg:px-8"
      >
        {/* Badge */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          className="inline-flex h-[35px] cursor-default items-center gap-2 rounded-full border border-[#ff9a21] bg-white/90 px-4 text-[13px] font-medium text-[#263247] shadow-[0_2px_7px_rgba(255,154,33,0.06)] backdrop-blur-sm"
        >
          <span className="text-[14px] leading-none text-[#ff175f]">✦</span>
          <span>Our story</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="mt-7 text-[47px] font-extrabold leading-[1.04] tracking-[-0.04em] text-[#050505] sm:text-[49px]"
        >
          <span className="text-[#ff7900]">About</span> us
        </motion.h1>

        {/* Description */}
        <motion.div variants={itemVariants} className="mt-7 max-w-[850px]">
          <p className="text-[16px] leading-[1.45] tracking-[-0.01em] text-[#14213d] sm:text-[17px]">
            Our journey began in 2012, with the founding of BDThemes. With the
            addition of new products and
            <br className="hidden sm:block" />
            services over time, in 2020, we built Sigmative — a technology-based
            organization, where a skilled team
            <br className="hidden sm:block" />
            of 20+ members is working today.
          </p>

          <p className="mt-3 text-[13px] leading-5 text-[#64748b]">
            Easy Task is a service of{" "}
            <span className="font-semibold text-[#111827]">Sigmative</span>.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="mt-14 grid w-full max-w-[680px] grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-[30px]"
        >
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="flex h-[120px] flex-col items-center justify-center rounded-[20px] border border-[#e9edf2] bg-white px-4 shadow-[0_2px_4px_rgba(15,23,42,0.06),0_10px_22px_rgba(15,23,42,0.035)] transition-shadow duration-300 hover:shadow-md"
          >
            <h3 className="text-[37px] font-extrabold leading-none tracking-[-0.03em] text-[#ff7900]">
              2012
            </h3>
            <p className="mt-2 text-[14px] font-medium leading-5 text-[#586174]">
              The journey begins
            </p>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="flex h-[120px] flex-col items-center justify-center rounded-[20px] border border-[#e9edf2] bg-white px-4 shadow-[0_2px_4px_rgba(15,23,42,0.06),0_10px_22px_rgba(15,23,42,0.035)] transition-shadow duration-300 hover:shadow-md"
          >
            <h3 className="text-[37px] font-extrabold leading-none tracking-[-0.03em] text-[#ff7900]">
              20+
            </h3>
            <p className="mt-2 text-[14px] font-medium leading-5 text-[#586174]">
              Team Member
            </p>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="flex h-[120px] flex-col items-center justify-center rounded-[20px] border border-[#e9edf2] bg-white px-4 shadow-[0_2px_4px_rgba(15,23,42,0.06),0_10px_22px_rgba(15,23,42,0.035)] transition-shadow duration-300 hover:shadow-md"
          >
            <h3 className="text-[37px] font-extrabold leading-none tracking-[-0.03em] text-[#ff7900]">
              50+
            </h3>
            <p className="mt-2 text-[14px] font-medium leading-5 text-[#586174]">
              Completed projects
            </p>
          </motion.div>
        </motion.div>

        {/* Green users banner */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="mt-5 flex min-h-[62px] w-full max-w-[680px] items-center justify-center gap-3 rounded-[14px] px-5 text-center text-[16px] font-bold text-white shadow-[0_9px_22px_rgba(0,177,125,0.13)] sm:text-[17px]"
          style={{
            background:
              "linear-gradient(100deg, #08c95b 0%, #08b977 48%, #0a9d8d 100%)",
          }}
        >
          <span className="text-[28px] font-medium leading-none">✓</span>
          <span>200,000+ users are using our service.</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
