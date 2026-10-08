"use client";
import { T } from "@/components/i18n/I18nProvider";
import { Clock, ShieldCheck, ThumbsUp, Headphones, Zap, Bookmark, } from "lucide-react";
import { motion, Variants } from "framer-motion";
export default function WhyChooseUs() {
    const benefits = [
        {
            title: "File sharing without USB drives",
            desc: "Your time is valuable, so we deliver service as fast as possible.",
            icon: <Clock className="text-blue-600" size={20}/>,
            iconBg: "bg-blue-50",
        },
        {
            title: "Cybersecurity & permissions",
            desc: "Control access for multiple employees in your office or shop",
            icon: <ShieldCheck className="text-indigo-600" size={20}/>,
            iconBg: "bg-indigo-50",
        },
        {
            title: "Instant search & tags",
            desc: "A simple and beautiful interface that anyone can use with ease.",
            icon: <ThumbsUp className="text-violet-600" size={20}/>,
            iconBg: "bg-violet-50",
        },
        {
            title: "Fast search system",
            desc: "Quickly find edited or printed files by name, date and category",
            icon: <Headphones className="text-sky-600" size={20}/>,
            iconBg: "bg-sky-50",
        },
        {
            title: "Pin your favorite files",
            desc: "Pin favorite files/templates for quick access",
            icon: <Zap className="text-blue-600" size={20}/>,
            iconBg: "bg-blue-50",
        },
        {
            title: "Direct save, print & email",
            desc: "Save, print, or even send created files directly to a customer's email",
            icon: <Bookmark className="text-indigo-600" size={20}/>,
            iconBg: "bg-indigo-50",
        },
    ];
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };
    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };
    return (<section className="bg-slate-50/50 py-20 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-14">
        {/* Top Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs"><T>{"Why Choose Us\r\n          "}</T></div>

          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            <span className="text-blue-600"><T>{"Easy to use,"}</T></span><T>{"and more "}</T><br /><T>{"benefits\r\n          "}</T></h2>

          <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto pt-1"><T>{"We provide fast, safe, and reliable solutions to simplify your daily\r\n            work\r\n          "}</T></p>
        </motion.div>

        {/* 6 Feature Cards Grid */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((item, idx) => (<motion.div key={idx} variants={cardVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }} className="bg-white rounded-[28px] p-7 border border-slate-100 shadow-xs flex flex-col justify-start min-h-[190px] transition hover:shadow-md hover:shadow-slate-200/50">
              <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                {item.icon}
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight leading-snug">
                {<T>{item.title}</T>}
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>))}
        </motion.div>
      </div>
    </section>);
}
