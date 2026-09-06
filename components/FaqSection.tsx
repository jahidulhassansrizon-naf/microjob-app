"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FaqSection() {
  // বাই-ডিফল্ট প্রথম কার্ড (index 0) খোলা রাখার জন্য 0 দেওয়া হলো
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      id: "01",
      question: "What is SohozKaj and how does it work?",
      answer:
        "SohozKaj is an online document, photo editing, and print media platform. You can use 500+ ready-made templates to easily create various types of documents and edit photos online. Simply select a template, enter the required information or upload a photo to edit, and download your file within minutes.",
    },
    {
      id: "02",
      question: "How many types of templates are available?",
      answer:
        "We offer over 500+ templates covering official contracts, resumes, business cards, flyers, and daily office forms.",
    },
    {
      id: "03",
      question: "What is available in the Print Media service?",
      answer:
        "Our Print Media service provides high-quality print-ready designs for banners, posters, flyers, and business cards with customizable layers.",
    },
    {
      id: "04",
      question: "What is the AI Photoshop feature?",
      answer:
        "The AI Photoshop feature allows you to edit background, remove unwanted objects, and enhance photos automatically in just 20 seconds.",
    },
    {
      id: "05",
      question: "What formats can I download in?",
      answer:
        "You can download your output files in PDF, PNG, JPG, PSD, and CMYK formats depending on your project needs.",
    },
    {
      id: "06",
      question: "Can SohozKaj be used on mobile?",
      answer:
        "Yes, SohozKaj is fully responsive and works smoothly on mobile browsers without requiring any app installation.",
    },
    {
      id: "07",
      question: "How many free credits do new users get?",
      answer:
        "New registered users receive free trial credits to test editing photos and creating documents.",
    },
    {
      id: "08",
      question: "How many credits does each action cost?",
      answer:
        "Credit cost depends on the complexity of the operation. Simple document exports take 1 credit, while AI edits take 2 credits.",
    },
    {
      id: "09",
      question: "Which features are completely free?",
      answer:
        "Standard photo crop, basic document previews, and selected daily utility tools are completely free for all users.",
    },
    {
      id: "10",
      question: "Do credits expire?",
      answer:
        "Monthly package credits renew every month, while pay-as-you-go credits remain valid indefinitely.",
    },
    {
      id: "11",
      question: "Can I edit a created document later?",
      answer:
        "Yes, all created documents are saved in your user dashboard history for easy re-editing anytime.",
    },
    {
      id: "12",
      question: "Do I need to create an account to use SohozKaj?",
      answer:
        "You can browse templates freely, but an account is required to save and download your generated documents.",
    },
    {
      id: "13",
      question: "Are my documents or files safe?",
      answer:
        "Yes, we use high-grade SSL encryption and automated security protocols to keep your data private and safe.",
    },
    {
      id: "14",
      question: "Will new tools or features be added in the future?",
      answer:
        "Absolutely! We regularly release new tools, AI models, and updated templates every week.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-[#F8F9FA] py-20 px-6 md:px-12">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center bg-orange-100/70 border border-orange-200/80 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
            FAQ
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-gray-950 tracking-tight leading-tight">
            Frequently Asked Questions <br />
            <span className="text-[#FF5D00]">Questions</span>
          </h2>

          <p className="text-gray-500 font-medium text-xs md:text-sm pt-1">
            Some common questions about SohozKaj.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`rounded-2xl transition-all duration-200 border ${
                  isOpen
                    ? "bg-white border-orange-300 shadow-xs"
                    : "bg-white/80 border-gray-100 hover:border-gray-200"
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-orange-500">
                      {faq.id}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition ${
                      isOpen
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-gray-500 font-medium leading-relaxed border-t border-gray-50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
