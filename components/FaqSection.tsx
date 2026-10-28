"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FaqSection() {
  // বাই-ডিফল্ট প্রথম কার্ড (index 0) খোলা রাখার জন্য 0 দেওয়া হলো
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
      {
          id: "01",
          question: "What is Seba Lagbe and how does it work?",
          answer: "Seba Lagbe is an online document, photo editing, and print media platform. You can use 500+ ready-made templates to easily create various types of documents and edit photos online. Simply select a template, enter the required information or upload a photo to edit, and download your file within minutes.",
      },
      {
          id: "02",
          question: "How many types of templates are available?",
          answer: "We offer over 500+ templates covering official contracts, resumes, business cards, flyers, and daily office forms.",
      },
      {
          id: "03",
          question: "What is available in the Print Media service?",
          answer: "Our Print Media service provides high-quality print-ready designs for banners, posters, flyers, and business cards with customizable layers.",
      },
      {
          id: "04",
          question: "What is the AI Photoshop feature?",
          answer: "The AI Photoshop feature allows you to edit background, remove unwanted objects, and enhance photos automatically in just 20 seconds.",
      },
      {
          id: "05",
          question: "What formats can I download in?",
          answer: "You can download your output files in PDF, PNG, JPG, PSD, and CMYK formats depending on your project needs.",
      },
      {
          id: "06",
          question: "Can Seba Lagbe be used on mobile?",
          answer: "Yes, Seba Lagbe is fully responsive and works smoothly on mobile browsers without requiring any app installation.",
      },
      {
          id: "07",
          question: "How many free credits do new users get?",
          answer: "New registered users receive free trial credits to test editing photos and creating documents.",
      },
      {
          id: "08",
          question: "How many credits does each action cost?",
          answer: "Credit cost depends on the complexity of the operation. Simple document exports take 1 credit, while AI edits take 2 credits.",
      },
      {
          id: "09",
          question: "Which features are completely free?",
          answer: "Standard photo crop, basic document previews, and selected daily utility tools are completely free for all users.",
      },
      {
          id: "10",
          question: "Do credits expire?",
          answer: "Monthly package credits renew every month, while pay-as-you-go credits remain valid indefinitely.",
      },
      {
          id: "11",
          question: "Can I edit a created document later?",
          answer: "Yes, all created documents are saved in your user dashboard history for easy re-editing anytime.",
      },
      {
          id: "12",
          question: "Do I need to create an account to use Seba Lagbe?",
          answer: "You can browse templates freely, but an account is required to save and download your generated documents.",
      },
      {
          id: "13",
          question: "Are my documents or files safe?",
          answer: "Yes, we use high-grade SSL encryption and automated security protocols to keep your data private and safe.",
      },
      {
          id: "14",
          question: "Will new tools or features be added in the future?",
          answer: "Absolutely! We regularly release new tools, AI models, and updated templates every week.",
      },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Section Header (sticky on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-2xl space-y-5 text-center lg:sticky lg:top-28 lg:col-span-4 lg:mx-0 lg:self-start lg:text-left"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
            <T>{"FAQ\r\n          "}</T>
          </div>

          <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
            <T>{"Frequently Asked "}</T>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              <T>{"Questions"}</T>
            </span>
          </h2>

          <p className="text-base leading-relaxed text-slate-600">
            <T>{"Some common questions about Seba Lagbe.\r\n          "}</T>
          </p>
        </motion.div>

        {/* Accordion List */}
        <div className="space-y-3 lg:col-span-8">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border bg-white transition-all duration-200 ${
                  isOpen
                    ? "border-blue-200 shadow-md shadow-blue-900/5 ring-1 ring-blue-100"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono text-xs font-semibold transition-colors ${
                        isOpen ? "text-blue-600" : "text-slate-400"
                      }`}
                    >
                      {faq.id}
                    </span>
                    <h3 className="text-sm font-semibold leading-snug text-slate-900 sm:text-[15px]">
                      {<T>{faq.question}</T>}
                    </h3>
                  </div>

                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                      isOpen
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-sm font-medium leading-relaxed text-slate-600 sm:px-6">
                        {<T>{faq.answer}</T>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
