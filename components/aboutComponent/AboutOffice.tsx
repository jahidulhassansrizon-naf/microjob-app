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
    <section
      className="
        w-full
        min-h-[580px]
        m-0
        px-4
        pt-[92px]
        pb-[80px]
        text-center
        overflow-hidden
        bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.72)_27%,rgba(250,238,254,0.96)_72%,rgba(250,238,254,1)_100%)]
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
          className="
            inline-flex items-center justify-center
            gap-2
            h-10
            px-5
            rounded-full
            border border-orange-400
            bg-white/50
            text-[13px]
            font-medium
            text-orange-600
            cursor-default
          "
        >
          <span className="text-[14px] leading-none text-pink-500">✦</span>
          <span>Our address</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          variants={itemVariants}
          className="
            mt-6
            mb-0
            text-[46px]
            leading-[1.08]
            tracking-[-1.8px]
            font-extrabold
            text-gray-950
          "
        >
          Institutions and{" "}
          <span className="text-orange-500">Office information</span>
        </motion.h2>

        {/* Office cards grid */}
        <motion.div
          variants={itemVariants}
          className="
            mt-[70px]
            grid
            grid-cols-1
            md:grid-cols-2
            gap-8
            max-w-[896px]
            mx-auto
            text-left
          "
        >
          {/* Bangladesh Head Office */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="
              relative
              min-h-[222px]
              rounded-[28px]
              bg-white/95
              border border-white
              px-8
              pt-8
              pb-7
              shadow-[0_2px_2px_rgba(0,0,0,0.08)]
              transition-shadow
              duration-300
              hover:shadow-lg
            "
          >
            <span
              className="
                absolute
                top-8
                left-8
                inline-flex
                items-center
                h-[31px]
                px-4
                rounded-full
                bg-purple-50
                border border-purple-200
                text-[12px]
                font-medium
                text-purple-600
              "
            >
              Bangladesh - Head Office
            </span>

            <div className="mt-[58px] space-y-4 text-[15px] text-gray-700">
              <p className="flex items-center gap-3 m-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[17px] h-[17px] shrink-0 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>Bogra - 5800, Bangladesh</span>
              </p>

              <p className="flex items-center gap-3 m-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[17px] h-[17px] shrink-0 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 5.18 2 2 0 0 1 5.07 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.24a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                </svg>
                <span>+88 01700-559595</span>
              </p>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="m-0 text-[14px] text-gray-500">
                Trade License Number :{" "}
                <span className="ml-2 font-bold text-gray-800">26867</span>
              </p>
            </div>
          </motion.div>

          {/* United States Hub */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="
              relative
              min-h-[222px]
              rounded-[28px]
              bg-white/95
              border border-white
              px-8
              pt-8
              pb-7
              shadow-[0_2px_2px_rgba(0,0,0,0.08)]
              transition-shadow
              duration-300
              hover:shadow-lg
            "
          >
            <span
              className="
                absolute
                top-8
                left-8
                inline-flex
                items-center
                h-[31px]
                px-4
                rounded-full
                bg-purple-50
                border border-purple-200
                text-[12px]
                font-medium
                text-purple-600
              "
            >
              United States - Hub
            </span>

            <div className="mt-[58px] space-y-4 text-[15px] text-gray-700">
              <p className="flex items-center gap-3 m-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[17px] h-[17px] shrink-0 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>30 N Gould St Ste R, Sheridan, WY 82801</span>
              </p>

              <p className="flex items-center gap-3 m-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[17px] h-[17px] shrink-0 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 5.18 2 2 0 0 1 5.07 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.24a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                </svg>
                <span>+1 3073108090</span>
              </p>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="m-0 text-[14px] text-gray-500">
                LLC EIN Number :{" "}
                <span className="ml-2 font-bold text-gray-800">36-5158602</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
