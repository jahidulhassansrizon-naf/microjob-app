"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import { HelpCircle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Aurora,
  EASE,
  GRAD_TEXT,
  SectionHead,
} from "@/components/ui/Premium";

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


export default function FaqSection() {
  // First question is open by default
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative isolate overflow-hidden bg-white px-4 py-20 sm:px-6 md:px-12 md:py-28">
      <Aurora variant="side" />

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Sticky heading */}
        <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <SectionHead
            align="left"
            icon={<HelpCircle size={12} />}
            eyebrow={<T>{"FAQ\r\n          "}</T>}
            title={
              <>
                <T>{"Frequently Asked "}</T>
                <br />
                <span className={GRAD_TEXT}>
                  <T>{"Questions"}</T>
                </span>
              </>
            }
            sub={<T>{"Some common questions about Seba Lagbe.\r\n          "}</T>}
          />
        </div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="space-y-2.5 lg:col-span-8"
        >
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`relative overflow-hidden rounded-[22px] bg-white ring-1 transition-all duration-300 ${
                  isOpen
                    ? "shadow-[0_24px_50px_-30px_rgba(67,56,202,0.5)] ring-indigo-200"
                    : "ring-slate-200/80 hover:ring-slate-300"
                }`}
              >
                {/* active accent rail */}
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-600 via-indigo-600 to-fuchsia-600 transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0"
                  }`}
                />
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:px-7"
                >
                  <h3
                    className={`text-[15px] font-bold leading-snug tracking-[-0.01em] transition-colors sm:text-base ${
                      isOpen ? "text-slate-950" : "text-slate-800"
                    }`}
                  >
                    <T>{faq.question}</T>
                  </h3>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      isOpen
                        ? "rotate-45 bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Plus size={16} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-3xl px-6 pb-6 text-sm leading-7 text-slate-600 sm:px-7 sm:text-[15px]">
                        <T>{faq.answer}</T>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
