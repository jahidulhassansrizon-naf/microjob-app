"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

export default function AboutValues() {
  const values = [
    {
      title: "Innovation comes first.",
      desc: "We don't follow trends, we create trends.",
      bg: "bg-[#edf5ff] text-[#1769ff]",
      icon: (
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "People are at the center.",
      desc: "The real function of technology is to serve people.",
      bg: "bg-[#effcf5] text-[#00a84f]",
      icon: (
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      title: "Learning mindset",
      desc: "We are constantly learning, constantly moving forward.",
      bg: "bg-[#f7efff] text-[#8a21e8]",
      icon: (
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2"
          />
        </svg>
      ),
    },
    {
      title: "Speed and quality",
      desc: "Fast delivery does not mean compromising on quality.",
      bg: "bg-[#fff6eb] text-[#ff4b00]",
      icon: (
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
          />
        </svg>
      ),
    },
    {
      title: "Result-based",
      desc: "Measurable business results are what matters most to us.",
      bg: "bg-[#fffbea] text-[#d99400]",
      icon: (
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: "Sustainable impact",
      desc: "We build with the long term in mind.",
      bg: "bg-[#fff0f7] text-[#e51b78]",
      icon: (
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
    },
  ];

  // Container variants for staggered entrance
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  // Item variants for badge, header & subtitle
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

  // Card variants for grid items
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
    <section
      className="
        w-full
        m-0
        px-4
        pt-[24px]
        pb-[76px]
        text-center
        bg-[#f8f9fa]
      "
    >
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
          className="inline-flex cursor-default items-center gap-2 h-[39px] px-5 rounded-full border border-orange-400 bg-white text-[13px] font-medium text-orange-600"
        >
          <span className="text-pink-500 text-[15px]">✦</span>
          <span>Our values</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          variants={itemVariants}
          className="mt-6 mb-0 text-[45px] leading-[1.08] tracking-[-1.8px] font-extrabold text-gray-950"
        >
          The faith we have{" "}
          <span className="text-orange-500">Takes the lead</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mt-7 mb-0 text-[17px] leading-6 text-gray-700"
        >
          Behind every action we take, there are some core values that guide us.
        </motion.p>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          className="mt-[62px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[28px] max-w-[1140px] mx-auto text-left"
        >
          {values.map((val, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="
                h-[228px]
                bg-white
                px-7
                pt-7
                pb-6
                rounded-[27px]
                border border-white
                shadow-[0_2px_2px_rgba(0,0,0,0.10)]
                transition-shadow duration-300
                hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]
              "
            >
              <div
                className={`w-[60px] h-[60px] rounded-[15px] flex items-center justify-center mb-6 ${val.bg}`}
              >
                {val.icon}
              </div>

              <h3 className="m-0 text-[20px] leading-6 font-extrabold text-[#071a31]">
                {val.title}
              </h3>

              <p className="mt-4 mb-0 text-[16px] leading-[23px] text-[#142b43] max-w-[310px]">
                {val.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
