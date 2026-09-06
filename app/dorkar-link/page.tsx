// app/dorkar-link/page.tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Footer from "@/components/Footer";

export default function DorkarLinksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const linksData = [
    {
      title: "Birth registration check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_1.webp",
    },
    {
      title: "National Identity Card New Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_2.webp",
    },
    {
      title: "Birth registration correction application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_3.webp",
    },
    {
      title: "Download ledger",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_4.webp",
    },
    {
      title: "NID Wallet",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_5.webp",
    },
    {
      title: "Police Clearance Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_6.webp",
    },
    {
      title: "Driving License Manual",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_7.webp",
    },
    {
      title: "Elderly, widow, disabled allowance application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_8.webp",
    },
    {
      title: "Birth certificate download",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_9.webp",
    },
    {
      title: "Train ticket booking",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_10.webp",
    },
    {
      title: "Indian Visa Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_11.webp",
    },
    {
      title: "Application for nomination",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_12.webp",
    },
    {
      title: "Biman Bangladesh Air Ticket",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_13.webp",
    },
    {
      title: "Train Certificate Download",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_14.webp",
    },
    {
      title: "Online GO application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_15.webp",
    },
    {
      title: "Food Management Monitoring System",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_16.webp",
    },
    {
      title: "BDSL",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_17.webp",
    },
    {
      title: "Death registration check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_18.webp",
    },
    {
      title: "Saudi visa check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_19.webp",
    },
    {
      title: "Expatriate Training TTC Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_20.webp",
    },
    {
      title: "SSC / HSC Result with all board numbers",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_21.webp",
    },
    {
      title: "Bus ticket booking",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_22.webp",
    },
    {
      title: "Application for electricity meter",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_23.webp",
    },
    {
      title: "Passport location verification",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_24.webp",
    },
    {
      title: "Saudi Visa Check-2",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_25.webp",
    },
    {
      title: "Expatriate Training Certificate Download",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_26.webp",
    },
    {
      title: "Tanti's new application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_27.webp",
    },
    {
      title: "Online Salary calculator",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_28.webp",
    },
    {
      title: "Typhoid-HPV vaccination registration",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_29.webp",
    },
    {
      title: "Open University Result",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_30.webp",
    },
    {
      title: "Saudi-Gamka Medical Report",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_31.webp",
    },
    {
      title: "VAT Registration",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_32.webp",
    },
    {
      title: "Freedom Fighter VGF/FD Download",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_33.webp",
    },
    {
      title: "Primary/Madrasah Education Completion Results",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_34.webp",
    },
    {
      title: "Saudi Gata Check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_35.webp",
    },
    {
      title: "Rajshahi College Admission and Form Fill-up",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_36.webp",
    },
    {
      title: "Saudi Arabia Muqeem check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_37.webp",
    },
    {
      title: "National University Update Notice",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_38.webp",
    },
    {
      title: "7 College Result Archive",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_39.webp",
    },
    {
      title: "Degree Honors Masters Form Fill-up",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_40.webp",
    },
    {
      title: "Fazil Result (Islamic Arabic University)",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_41.webp",
    },
    {
      title: "Jagannath University Admit Card",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_42.webp",
    },
    {
      title: "Qatar visa check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_43.webp",
    },
    {
      title: "Qatar holiday period check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_44.webp",
    },
    {
      title: "Technical Education Board Diploma Result",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_45.webp",
    },
    {
      title: "Square Hospital Doctor Serial",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_46.webp",
    },
    {
      title: "Honors Degree Board Challenge",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_47.webp",
    },
    {
      title: "HSC Result Comilla with Board Number",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_48.webp",
    },
    {
      title: "Singapore Arrival Card",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_49.webp",
    },
    {
      title: "Freedom Fighters Welfare Trust",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_50.webp",
    },
    {
      title: "Qatar Medical Appointment",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_51.webp",
    },
    {
      title: "HSC Result Comilla with Number",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_52.webp",
    },
    {
      title: "Ministry of Freedom Fighters Notice",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_53.webp",
    },
    {
      title: "Freedom Fighter Janaka notice",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_54.webp",
    },
    {
      title: "Secondary Higher Secondary All Notices",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_55.webp",
    },
    {
      title: "Application for electricity notice (new)",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_56.webp",
    },
    {
      title: "Tax payment",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_57.webp",
    },
    {
      title: "TCB website",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_58.webp",
    },
    {
      title: "Smart land design",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_59.webp",
    },
    {
      title: "Death registration application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_60.webp",
    },
    {
      title: "Service Link 61",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_61.webp",
    },
    {
      title: "Service Link 62",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_62.webp",
    },
    {
      title: "Service Link 63",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_63.webp",
    },
    {
      title: "Service Link 64",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_64.webp",
    },
    {
      title: "Service Link 65",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_65.webp",
    },
    {
      title: "Service Link 66",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_66.webp",
    },
    {
      title: "Service Link 67",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_67.webp",
    },
    {
      title: "Service Link 68",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_68.webp",
    },
    {
      title: "Service Link 69",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_69.webp",
    },
    {
      title: "Service Link 70",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_70.webp",
    },
    {
      title: "Service Link 71",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_71.webp",
    },
    {
      title: "Service Link 72",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_72.webp",
    },
    {
      title: "Service Link 73",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_73.webp",
    },
    {
      title: "Service Link 74",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_74.webp",
    },
    {
      title: "Service Link 75",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_75.webp",
    },
    {
      title: "Service Link 76",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_76.webp",
    },
    {
      title: "Service Link 77",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_77.webp",
    },
    {
      title: "Service Link 78",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_78.webp",
    },
    {
      title: "Service Link 79",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_79.webp",
    },
    {
      title: "Service Link 80",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_80.webp",
    },
    {
      title: "Service Link 81",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_81.webp",
    },
  ];

  const faqData = [
    {
      q: "What is the useful link?",
      ans: "Useful links are curated direct shortcuts to essential government portals, public services, and standard verification systems.",
    },
    {
      q: "Do I need an account to use these?",
      ans: "No account is required on SohojKaj to browse or access these public directory links.",
    },
    {
      q: "Are these official websites?",
      ans: "We provide links directly pointing to official government and authorized third-party domains.",
    },
    {
      q: "Is my personal information safe?",
      ans: "Yes. We do not store, track, or process any personal data or credentials you enter on external government portals.",
    },
    {
      q: "How often are the links updated?",
      ans: "Our team regularly reviews and updates the directory to ensure links remain active and accurate.",
    },
    {
      q: "Can board or exam results be seen here?",
      ans: "We provide direct links to official education board result portals where you can check your grades.",
    },
    {
      q: "What should I do if a link doesn't work?",
      ans: "If a link is broken due to temporary server issues from government portals, please try again later or report it to us.",
    },
    {
      q: "Can I request that a new link be added?",
      ans: "Yes, you can contact our support team to suggest new useful public services or links.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] flex flex-col w-full">
      {/* Hero Section */}
      <div className="w-full pt-12 pb-8 px-4 flex flex-col items-center text-center bg-gradient-to-b from-white to-[#FFFBF7]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[11px] font-extrabold mb-4 shadow-2xs">
          <span>81+ useful links</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
          Government websites and{" "}
          <span className="text-orange-500">links you need</span>
        </h1>

        <p className="text-xs md:text-sm text-gray-500 max-w-md mb-8">
          You will find links to all the necessary government websites and
          services here. Easy and fast!
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-2xl bg-white border border-gray-200/80 rounded-full shadow-sm p-2 flex flex-col sm:flex-row items-center gap-2 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 w-full sm:w-auto sm:flex-1 text-gray-400 text-xs">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search here... (eg: Birth Registration)"
              className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
            />
            <span className="hidden sm:inline-flex items-center gap-0.5 bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-500 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>

          <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-200 px-4 py-2 flex items-center justify-between sm:justify-start gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <span>All categories</span>
            <span>▼</span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap max-w-3xl">
          <button className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs">
            All links
          </button>
          <button className="bg-gray-100/80 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full transition">
            Government websites and links
          </button>
          <button className="bg-gray-100/80 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full transition">
            Visa and International
          </button>
          <button className="bg-gray-100/80 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full transition">
            Other links
          </button>
        </div>
      </div>

      {/* Cards Grid Container */}
      <div className="w-full flex justify-center px-6">
        <div className="max-w-[1200px] w-full pb-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {linksData.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col items-center text-center gap-4 relative"
            >
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500"></div>
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden p-2">
                <img
                  src={item.icon}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xs font-bold text-gray-900">{item.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section Container */}
      <div className="w-full flex flex-col items-center px-6 pb-20">
        <div className="max-w-[900px] w-full flex flex-col items-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[11px] font-extrabold mb-3">
            FAQ
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-10 text-center">
            General inquiries<span className="text-orange-500">(FAQ)</span>
          </h2>

          <div className="w-full flex flex-col gap-3">
            {faqData.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-gray-400">
                        {index < 9 ? `0${index + 1}` : index + 1}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-gray-800">
                        {faq.q}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-xs text-gray-500 pl-14 border-t border-gray-100">
                      {faq.ans}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Disclaimer Box */}
          <div className="w-full mt-16 bg-[#FFF4E6]/60 border border-orange-200/60 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute right-4 top-4 text-orange-200/50 text-7xl font-black pointer-events-none select-none">
              !
            </div>
            <h3 className="text-sm font-extrabold text-amber-900 mb-3 tracking-wide">
              Disclaimer
            </h3>
            <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed max-w-3xl">
              The links provided on this page are mainly from the websites of
              the Bangladesh Government and other authorities (third parties).
              We do not modify, control or retain any information on those
              websites. For the convenience of the service users, all the
              necessary links have been arranged in one place. The Sahajkaz
              Authority is in no way responsible for any incorrect information,
              server down or your personal data contained there.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}
