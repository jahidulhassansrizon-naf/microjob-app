"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

const journeyItems = [
  {
    title: "Beginning story",
    text: "Our journey began in 2012 with the founding of BDThemes. The goal was simple — to bridge the gap between cutting-edge technology and real business results. We have seen that many organizations struggle with digital transformation — not because of a lack of capability, but because of a lack of the right partner.",
  },
  {
    title: "Our growth",
    text: "Over time, new products and services have been added one after another. Along this growth path, we built Sigmative in 2020. Today, from a startup to a large organization with a team of more than 20 skilled members, we have successfully completed more than 50 projects in various sectors. Each project has taught us something new, making us better partners for the next challenge.",
  },
  {
    title: "Today and tomorrow",
    text: "Today, we don't just build websites or apps; we build entire digital ecosystems, implement AI solutions, and build platforms that can be easily scaled. But that's just the beginning. The digital future is being written now — and we want to write it with you.",
  },
];

export default function AboutJourney() {
  // Container animation variants for staggered children
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  // Item variants for left side elements & timeline steps
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

  // Right card container variants
  const rightCardVariants: Variants = {
    hidden: { opacity: 0, x: 30, scale: 0.96 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="w-full px-4 py-5 sm:px-6 md:py-8">
      <div className="mx-auto grid w-full max-w-[1145px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-[58px]">
        {/* Left: journey story */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="min-w-0"
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="mb-5 inline-flex cursor-default items-center gap-2 rounded-full border border-[#ffb23b] bg-white px-4 py-2 text-[14px] font-medium leading-none text-[#ef6a00] shadow-[0_2px_8px_rgba(255,171,52,0.06)]"
          >
            <span className="text-[14px] leading-none">✨</span>
            <span>Our journey</span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="mb-9 max-w-[590px] text-[34px] font-extrabold leading-[1.18] tracking-[-0.8px] text-[#111827] sm:text-[38px] lg:text-[39px]"
          >
            From a small dream to{" "}
            <span className="bg-gradient-to-r from-[#ff9b00] via-[#ff6d00] to-[#ff4b11] bg-clip-text text-transparent">
              a big journey
            </span>
          </motion.h2>

          <div className="space-y-7">
            {journeyItems.map((item, index) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="relative pl-5"
              >
                {/* Timeline line */}
                {index < journeyItems.length - 1 && (
                  <span className="absolute left-[5px] top-[13px] h-[calc(100%+28px)] w-px bg-[#eadcf8]" />
                )}

                {/* Timeline dot */}
                <motion.span
                  whileHover={{ scale: 1.3 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-[3px] h-3 w-3 rounded-full bg-gradient-to-br from-[#ff9640] via-[#ec4c78] to-[#b93be0] shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
                />

                <h3 className="mb-1 text-[16px] font-extrabold leading-6 text-[#111827]">
                  {item.title}
                </h3>
                <p className="max-w-[550px] text-[15px] font-normal leading-[1.72] text-[#374151]">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: statistics card */}
        <motion.div
          variants={rightCardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mx-auto w-full max-w-[540px] overflow-hidden rounded-[34px] bg-gradient-to-br from-[#14c964] via-[#07b274] to-[#079d92] p-[44px] text-white shadow-[0_26px_60px_rgba(10,177,126,0.23)]"
        >
          <div className="relative z-10 flex flex-col gap-[22px]">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-[124px] flex-col items-center justify-center rounded-[22px] border border-white/20 bg-white/10 px-6 py-5 text-center backdrop-blur-md transition-shadow duration-300 hover:shadow-lg"
            >
              <h3 className="text-[42px] font-extrabold leading-none tracking-[-1px] text-white">
                2012
              </h3>
              <p className="mt-2 text-[13px] font-medium leading-none text-white/90">
                The journey begins
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-[22px]">
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="flex min-h-[124px] flex-col items-center justify-center rounded-[22px] border border-white/20 bg-white/10 px-4 py-5 text-center backdrop-blur-md transition-shadow duration-300 hover:shadow-lg"
              >
                <h3 className="text-[40px] font-extrabold leading-none tracking-[-1px] text-white">
                  20+
                </h3>
                <p className="mt-2 text-[13px] font-medium leading-none text-white/90">
                  Team Member
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="flex min-h-[124px] flex-col items-center justify-center rounded-[22px] border border-white/20 bg-white/10 px-4 py-5 text-center backdrop-blur-md transition-shadow duration-300 hover:shadow-lg"
              >
                <h3 className="text-[40px] font-extrabold leading-none tracking-[-1px] text-white">
                  50+
                </h3>
                <p className="mt-2 text-[13px] font-medium leading-none text-white/90">
                  Completed projects
                </p>
              </motion.div>
            </div>
          </div>

          {/* Soft decorative glow */}
          <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-[#2dd4a2]/20 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}
