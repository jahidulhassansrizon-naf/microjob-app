"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Edit3, FileText, Briefcase, Wrench, X } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
export default function HeroFeatures() {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    // সুরক্ষিত পেজগুলোর তালিকা
    const protectedRoutes = [
        "/ai-editor",
        "/manual-editor",
        "/jobs",
        "/sohoj-tools",
    ];
    const handleNavigation = (href?: string) => {
        if (!href)
            return;
        const hasTokenCookie = typeof window !== "undefined" &&
            document.cookie.split("; ").some((row) => row.startsWith("token="));
        const savedUserStr = typeof window !== "undefined"
            ? localStorage.getItem("user") || localStorage.getItem("userData")
            : null;
        const isLoggedIn = hasTokenCookie || !!savedUserStr;
        if (protectedRoutes.includes(href) && !isLoggedIn) {
            router.push(`/login?redirect=${encodeURIComponent(href)}`);
        }
        else {
            router.push(href);
        }
    };
    const features = [
        {
            title: "AI Photo Edit",
            value: "20 sec",
            subtitle: "Photo ready",
            bgColor: "bg-blue-600",
            icon: <Sparkles className="text-white" size={24}/>,
            href: "/ai-editor",
        },
        {
            title: "Manual Photo Edit",
            value: "Your way",
            subtitle: "Edit freely",
            bgColor: "bg-indigo-600",
            icon: <Edit3 className="text-white" size={24}/>,
            href: "/manual-editor",
        },
        {
            title: "Create Documents",
            value: "500+",
            subtitle: "Document files",
            bgColor: "bg-violet-600",
            icon: <FileText className="text-white" size={24}/>,
            isComingSoon: true,
        },
        {
            title: "Job Circular",
            value: "Daily",
            subtitle: "New updates",
            bgColor: "bg-emerald-500",
            icon: <Briefcase className="text-white" size={24}/>,
            href: "/jobs",
        },
        {
            title: "Easy Tools",
            value: "56+",
            subtitle: "Free tools",
            bgColor: "bg-sky-500",
            icon: <Wrench className="text-white" size={24}/>,
            href: "/sohoj-tools",
        },
    ];
    // অ্যানিমেশন ভ্যারিয়েন্ট
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
            },
        },
    };
    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 35 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };
    return (<section className="w-full pt-12 pb-16 relative">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Top 5 Cards Row - Scroll & Staggered Animated */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-20">
          {features.map((item, idx) => {
            const cardContent = (<>
                <div className={`absolute -top-6 w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center shadow-md`}>
                  {item.icon}
                </div>

                <h4 className="text-xs font-bold text-slate-700 mb-4">
                  {<T>{item.title}</T>}
                </h4>

                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {item.value}
                </p>
                <span className="text-[11px] font-medium text-slate-400 mt-1">
                  {<T>{item.subtitle}</T>}
                </span>
              </>);
            const cardClasses = "bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col items-center text-center relative pt-12 mt-6 cursor-pointer select-none";
            return (<motion.div key={idx} variants={cardVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }} whileTap={{ scale: 0.98 }} className={cardClasses} onClick={() => item.isComingSoon
                    ? setShowModal(true)
                    : handleNavigation(item.href)}>
                {cardContent}
              </motion.div>);
        })}
        </motion.div>

        {/* Section Heading Area - Scroll Animated */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
            <Sparkles size={14}/>
            <span><T>{"AI Photoshop"}</T></span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]"><T>{"Create "}</T><span className="text-blue-600"><T>{"professional photos"}</T></span>{<T>{" "}</T>}<T>{"faster "}</T><br className="hidden sm:inline"/><T>{"and more precisely\r\n          "}</T></h2>

          <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto pt-2"><T>{"Create professional photos from normal images in just a few seconds\r\n            without Photoshop, using ShohozKaj.\r\n          "}</T></p>
        </motion.div>
      </div>

      {/* Custom Modal with AnimatePresence */}
      <AnimatePresence>
        {showModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 15 }} transition={{ duration: 0.2, ease: "easeOut" }} className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-xl border border-slate-100 relative text-left" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={20}/>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight"><T>{"Create Documents\r\n                    "}</T></h3>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 inline-block mt-1"><T>{"\u0995\u09BE\u099C \u099A\u09B2\u099B\u09C7\r\n                    "}</T></span>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                  <X size={18}/>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal"><T>{"\u098F\u0987 \u09AB\u09BF\u099A\u09BE\u09B0\u099F\u09BF\u09B0 \u0995\u09BE\u099C \u099A\u09B2\u099B\u09C7\u0964 \u0996\u09C1\u09AC \u09B6\u09C0\u0998\u09CD\u09B0\u0987 \u0986\u09AA\u09A8\u09BF \u098F\u0996\u09BE\u09A8 \u09A5\u09C7\u0995\u09C7 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u09C0\u09DF\r\n                \u09A1\u0995\u09C1\u09AE\u09C7\u09A8\u09CD\u099F \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964\r\n              "}</T></p>

              <button onClick={() => setShowModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"><T>{"\u09A0\u09BF\u0995 \u0986\u099B\u09C7\r\n              "}</T></button>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
    </section>);
}
