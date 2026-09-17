"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

export default function AboutTeamCTA() {
  // Container variants for card reveal and staggered children
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  // Item variants for header, paragraph, and button
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

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-[1180px] mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[28px] p-10 md:py-16 md:px-12 text-center shadow-xl"
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight"
        >
          Meet our team
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-white/90 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed"
        >
          Look at the people behind the simple tasks — leadership, development,
          design, marketing, and support teams.
        </motion.p>

        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white text-purple-600 text-sm md:text-base font-bold py-3.5 px-8 rounded-full hover:bg-gray-100 transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
        >
          See our team <span className="text-lg">›</span>
        </motion.button>
      </motion.div>
    </section>
  );
}
