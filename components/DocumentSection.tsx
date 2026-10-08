"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import { FileEdit, FileText, Send, ArrowRight, FileCheck, Eye, Keyboard, X, } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
export default function DocumentSection() {
    const [activeVideoStart, setActiveVideoStart] = useState<number | null>(null);
    const cards = [
        {
            title: "Update information in a flash",
            desc: "Change information in up to 50 pages of paper through a simple form.",
            badge: "AI Powered",
            badgeStyle: "bg-blue-50 text-blue-600 border-blue-200",
            iconBg: "bg-blue-600",
            icon: <FileEdit className="text-white" size={22}/>,
            btnColor: "text-blue-600",
            arrowBg: "bg-blue-600",
            videoStart: 132,
        },
        {
            title: "Export files as PDF",
            desc: "Save and download your created file as PDF.",
            badge: "Popular",
            badgeStyle: "bg-indigo-50 text-indigo-600 border-indigo-200",
            iconBg: "bg-indigo-600",
            icon: <FileText className="text-white" size={22}/>,
            btnColor: "text-indigo-600",
            arrowBg: "bg-indigo-600",
            videoStart: 230,
        },
        {
            title: "Share or email your document",
            desc: "Download or email your created document instantly, anytime.",
            badge: "Secure",
            badgeStyle: "bg-violet-50 text-violet-600 border-violet-200",
            iconBg: "bg-violet-600",
            icon: <Send className="text-white" size={22}/>,
            btnColor: "text-violet-600",
            arrowBg: "bg-violet-600",
            videoStart: null,
        },
    ];
    const extraFeatures = [
        {
            title: "Multiple page sizes & formats",
            desc: "Set custom margins and sizes — A4, A5, Deed, and more.",
            iconBg: "bg-blue-600",
            icon: <FileCheck className="text-white" size={20}/>,
            arrowBg: "bg-blue-600",
        },
        {
            title: "Document preview system",
            desc: "Preview your document before downloading as PDF.",
            iconBg: "bg-indigo-600",
            icon: <Eye className="text-white" size={20}/>,
            arrowBg: "bg-indigo-600",
        },
        {
            title: "Keyboard shortcuts to save time",
            desc: "Do everything quickly with just the keyboard, no mouse needed.",
            iconBg: "bg-sky-500",
            icon: <Keyboard className="text-white" size={20}/>,
            arrowBg: "bg-sky-500",
        },
    ];
    const cardContainerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
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
    return (<section className="bg-slate-50/50 py-16 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
        {/* Top Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs"><T>{"Document Creation\r\n          "}</T></div>

          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.2]"><T>{"In Sohozkaj contracts & documents"}</T>{<T>{" "}</T>}
            <br className="hidden sm:inline"/>
            <span className="text-blue-600"><T>{"instantly"}</T></span>
          </h2>

          <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto pt-1"><T>{"Change text in contracts and other papers in moments through a\r\n            simple form\r\n          "}</T></p>
        </motion.div>

        {/* 3 Main Cards */}
        <motion.div variants={cardContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (<motion.div key={idx} variants={cardVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[290px] relative transition hover:shadow-md hover:shadow-slate-200/50">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-xs`}>
                    {card.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${card.badgeStyle}`}>
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight leading-snug">
                  {<T>{card.title}</T>}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-6">
                {card.videoStart !== null ? (<button type="button" onClick={() => setActiveVideoStart(card.videoStart)} className={`inline-flex items-center gap-2 text-xs font-bold ${card.btnColor} transition group cursor-pointer`}>
                    <span><T>{"Learn more"}</T></span>
                    <div className={`w-5 h-5 ${card.arrowBg} text-white rounded-full flex items-center justify-center transition group-hover:translate-x-0.5`}>
                      <ArrowRight size={12} strokeWidth={3}/>
                    </div>
                  </button>) : (<span className={`inline-flex items-center gap-2 text-xs font-bold ${card.btnColor} select-none cursor-default`}>
                    <span><T>{"Learn more"}</T></span>
                    <div className={`w-5 h-5 ${card.arrowBg} text-white rounded-full flex items-center justify-center`}>
                      <ArrowRight size={12} strokeWidth={3}/>
                    </div>
                  </span>)}
              </div>
            </motion.div>))}
        </motion.div>

        {/* Extra Features Box */}
        <motion.div initial={{ opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="bg-slate-100/70 rounded-[36px] p-8 md:p-10 border border-slate-200/60 flex flex-col items-center">
          <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight"><T>{"And more\r\n          "}</T></h3>
          <p className="text-sm text-slate-500 font-medium mb-8"><T>{"Extra features that make your work even easier\r\n          "}</T></p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            {extraFeatures.map((item, idx) => (<motion.div key={idx} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-2xs flex items-center justify-between gap-3 transition hover:shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center shrink-0 shadow-2xs`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {<T>{item.title}</T>}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className={`w-5 h-5 ${item.arrowBg} text-white rounded-full flex items-center justify-center shrink-0`}>
                  <ArrowRight size={11} strokeWidth={3}/>
                </div>
              </motion.div>))}
          </div>
        </motion.div>
      </div>

      {/* Video Popup Modal */}
      <AnimatePresence>
        {activeVideoStart !== null && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6" onClick={() => setActiveVideoStart(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ duration: 0.25, ease: "easeOut" }} className="relative w-full max-w-4xl aspect-video bg-black rounded-xl shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setActiveVideoStart(null)} className="absolute -top-10 right-0 z-50 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1" aria-label="Close video">
                <X size={26}/>
              </button>

              <iframe src={`https://www.youtube.com/embed/HWwuSrGQmSw?autoplay=1&rel=0&start=${activeVideoStart}`} title="SohozKaj Document Creation Tutorial" className="w-full h-full border-0 rounded-xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
    </section>);
}
