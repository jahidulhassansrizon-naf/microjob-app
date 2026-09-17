// app/dorkar-link/page.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Search, Check, X } from "lucide-react";
import Footer from "@/components/Footer";

function DorkarLinksContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [activeTab, setActiveTab] = useState("All Links");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // URL Query Parameter অনুযায়ী ফিল্টার সিলেক্ট করার লজিক
  useEffect(() => {
    if (categoryParam) {
      const categoryMap: Record<string, string> = {
        govt: "Govt Websites & Links",
        visa: "Visa & International",
        other: "Other Links",
      };

      const matchedCategory = categoryMap[categoryParam.toLowerCase()];
      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
        setActiveTab(matchedCategory);
      }
    }
  }, [categoryParam]);

  // Ctrl + K / Cmd + K keyboard shortcut to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const categories = [
    "All Categories",
    "Govt Websites & Links",
    "Visa & International",
    "Other Links",
  ];

  const tabs = [
    "All Links",
    "Govt Websites & Links",
    "Visa & International",
    "Other Links",
  ];

  // Helper to change filter category from either Tabs or Dropdown synchronously
  const handleCategoryChange = (categoryName: string) => {
    const canonicalName =
      categoryName === "All Links" ? "All Categories" : categoryName;
    setSelectedCategory(canonicalName);
    setActiveTab(
      categoryName === "All Categories" ? "All Links" : categoryName,
    );
    setCategoryOpen(false);
  };

  const linksData = [
    {
      title: "Birth registration check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_1.webp",
      category: "Govt Websites & Links",
      url: "https://everify.bdris.gov.bd/",
    },
    {
      title: "National Identity Card New Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_2.webp",
      category: "Govt Websites & Links",
      url: "https://services.nidw.gov.bd/",
    },
    {
      title: "Birth registration correction application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_3.webp",
      category: "Govt Websites & Links",
      url: "https://bdris.gov.bd/",
    },
    {
      title: "Download ledger",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_4.webp",
      category: "Govt Websites & Links",
      url: "https://dlr.land.gov.bd/",
    },
    {
      title: "NID Wallet",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_5.webp",
      category: "Govt Websites & Links",
      url: "https://services.nidw.gov.bd/",
    },
    {
      title: "Police Clearance Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_6.webp",
      category: "Govt Websites & Links",
      url: "https://pcc.police.gov.bd/",
    },
    {
      title: "Driving License Manual",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_7.webp",
      category: "Govt Websites & Links",
      url: "https://bsp.brta.gov.bd/",
    },
    {
      title: "Elderly, widow, disabled allowance application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_8.webp",
      category: "Govt Websites & Links",
      url: "https://mis.bhata.gov.bd/",
    },
    {
      title: "Birth certificate download",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_9.webp",
      category: "Govt Websites & Links",
      url: "https://bdris.gov.bd/",
    },
    {
      title: "Train ticket booking",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_10.webp",
      category: "Other Links",
      url: "https://eticket.railway.gov.bd/",
    },
    {
      title: "Indian Visa Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_11.webp",
      category: "Visa & International",
      url: "https://www.ivacbd.com/",
    },
    {
      title: "Application for nomination",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_12.webp",
      category: "Govt Websites & Links",
      url: "https://land.gov.bd/",
    },
    {
      title: "Biman Bangladesh Air Ticket",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_13.webp",
      category: "Visa & International",
      url: "https://www.biman-airlines.com/",
    },
    {
      title: "Train Certificate Download",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_14.webp",
      category: "Other Links",
      url: "https://eticket.railway.gov.bd/",
    },
    {
      title: "Online GO application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_15.webp",
      category: "Govt Websites & Links",
      url: "https://mopa.gov.bd/",
    },
    {
      title: "Food Management Monitoring System",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_16.webp",
      category: "Govt Websites & Links",
      url: "https://dgfood.gov.bd/",
    },
    {
      title: "BDSL",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_17.webp",
      category: "Govt Websites & Links",
      url: "https://bdsl.gov.bd/",
    },
    {
      title: "Death registration check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_18.webp",
      category: "Govt Websites & Links",
      url: "https://everify.bdris.gov.bd/",
    },
    {
      title: "Saudi visa check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_19.webp",
      category: "Visa & International",
      url: "https://visa.mofa.gov.sa/",
    },
    {
      title: "Expatriate Training TTC Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_20.webp",
      category: "Govt Websites & Links",
      url: "https://bmet.gov.bd/",
    },
    {
      title: "SSC / HSC Result with all board numbers",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_21.webp",
      category: "Other Links",
      url: "http://www.educationboardresults.gov.bd/",
    },
    {
      title: "Bus ticket booking",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_22.webp",
      category: "Other Links",
      url: "https://shohoz.com/",
    },
    {
      title: "Application for electricity meter",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_23.webp",
      category: "Govt Websites & Links",
      url: "https://reb.gov.bd/",
    },
    {
      title: "Passport location verification",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_24.webp",
      category: "Govt Websites & Links",
      url: "https://epassport.gov.bd/",
    },
    {
      title: "Saudi Visa Check-2",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_25.webp",
      category: "Visa & International",
      url: "https://visa.mofa.gov.sa/",
    },
    {
      title: "Expatriate Training Certificate Download",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_26.webp",
      category: "Govt Websites & Links",
      url: "https://bmet.gov.bd/",
    },
    {
      title: "Tanti's new application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_27.webp",
      category: "Govt Websites & Links",
      url: "https://bhb.gov.bd/",
    },
    {
      title: "Online Salary calculator",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_28.webp",
      category: "Other Links",
      url: "https://cafopfm.gov.bd/",
    },
    {
      title: "Typhoid-HPV vaccination registration",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_29.webp",
      category: "Govt Websites & Links",
      url: "https://vaxepi.gov.bd/",
    },
    {
      title: "Open University Result",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_30.webp",
      category: "Other Links",
      url: "https://bou.ac.bd/",
    },
    {
      title: "Saudi-Gamka Medical Report",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_31.webp",
      category: "Visa & International",
      url: "https://wafid.com/",
    },
    {
      title: "VAT Registration",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_32.webp",
      category: "Govt Websites & Links",
      url: "https://vat.gov.bd/",
    },
    {
      title: "Freedom Fighter VGF/FD Download",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_33.webp",
      category: "Govt Websites & Links",
      url: "https://molwa.gov.bd/",
    },
    {
      title: "Primary/Madrasah Education Completion Results",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_34.webp",
      category: "Other Links",
      url: "http://dpe.portal.gov.bd/",
    },
    {
      title: "Saudi Gata Check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_35.webp",
      category: "Visa & International",
      url: "https://muqeem.sa/",
    },
    {
      title: "Rajshahi College Admission and Form Fill-up",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_36.webp",
      category: "Other Links",
      url: "https://rc.edu.bd/",
    },
    {
      title: "Saudi Arabia Muqeem check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_37.webp",
      category: "Visa & International",
      url: "https://muqeem.sa/",
    },
    {
      title: "National University Update Notice",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_38.webp",
      category: "Other Links",
      url: "https://nu.ac.bd/",
    },
    {
      title: "7 College Result Archive",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_39.webp",
      category: "Other Links",
      url: "https://7college.du.ac.bd/",
    },
    {
      title: "Degree Honors Masters Form Fill-up",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_40.webp",
      category: "Other Links",
      url: "https://nu.ac.bd/",
    },
    {
      title: "Fazil Result (Islamic Arabic University)",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_41.webp",
      category: "Other Links",
      url: "https://iau.edu.bd/",
    },
    {
      title: "Jagannath University Admit Card",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_42.webp",
      category: "Other Links",
      url: "https://jnu.ac.bd/",
    },
    {
      title: "Qatar visa check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_43.webp",
      category: "Visa & International",
      url: "https://portal.moi.gov.qa/",
    },
    {
      title: "Qatar holiday period check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_44.webp",
      category: "Visa & International",
      url: "https://portal.moi.gov.qa/",
    },
    {
      title: "Technical Education Board Diploma Result",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_45.webp",
      category: "Other Links",
      url: "https://bteb.gov.bd/",
    },
    {
      title: "Square Hospital Doctor Serial",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_46.webp",
      category: "Other Links",
      url: "https://squarehospital.com/",
    },
    {
      title: "Honors Degree Board Challenge",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_47.webp",
      category: "Other Links",
      url: "https://nu.ac.bd/",
    },
    {
      title: "HSC Result Comilla with Board Number",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_48.webp",
      category: "Other Links",
      url: "http://comillaboard.portal.gov.bd/",
    },
    {
      title: "Singapore Arrival Card",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_49.webp",
      category: "Visa & International",
      url: "https://eservices.ica.gov.sg/",
    },
    {
      title: "Freedom Fighters Welfare Trust",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_50.webp",
      category: "Govt Websites & Links",
      url: "https://ffwt.gov.bd/",
    },
    {
      title: "Qatar Medical Appointment",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_51.webp",
      category: "Visa & International",
      url: "https://qatarvisacenter.com/",
    },
    {
      title: "HSC Result Comilla with Number",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_52.webp",
      category: "Other Links",
      url: "http://comillaboard.portal.gov.bd/",
    },
    {
      title: "Ministry of Freedom Fighters Notice",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_53.webp",
      category: "Govt Websites & Links",
      url: "https://molwa.gov.bd/",
    },
    {
      title: "Freedom Fighter Janaka notice",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_54.webp",
      category: "Govt Websites & Links",
      url: "https://jamuka.gov.bd/",
    },
    {
      title: "Secondary Higher Secondary All Notices",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_55.webp",
      category: "Govt Websites & Links",
      url: "https://dshe.gov.bd/",
    },
    {
      title: "Application for electricity notice (new)",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_56.webp",
      category: "Govt Websites & Links",
      url: "https://reb.gov.bd/",
    },
    {
      title: "Tax payment",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_57.webp",
      category: "Govt Websites & Links",
      url: "https://etaxnbr.gov.bd/",
    },
    {
      title: "TCB website",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_58.webp",
      category: "Govt Websites & Links",
      url: "https://tcb.gov.bd/",
    },
    {
      title: "Smart land design",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_59.webp",
      category: "Govt Websites & Links",
      url: "https://land.gov.bd/",
    },
    {
      title: "Death registration application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_60.webp",
      category: "Govt Websites & Links",
      url: "https://bdris.gov.bd/",
    },
    {
      title: "Jagannath University Admit Card",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_61.webp",
      category: "Other Links",
      url: "https://jnuadmission.com/preliminary/login/",
    },
    {
      title: "E-Passport Application",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_62.webp",
      category: "Other Links",
      url: "https://www.epassport.gov.bd/onboarding",
    },
    {
      title: "E-challan government fee payment",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_63.webp",
      category: "Other Links",
      url: "https://echallan.gov.bd/",
    },
    {
      title: "Land Development Tax Calculation",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_64.webp",
      category: "Other Links",
      url: "https://ldtax.gov.bd/",
    },
    {
      title: "Government job portal",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_65.webp",
      category: "Other Links",
      url: "https://jobs.gov.bd/",
    },
    {
      title: "Bangladesh National Information Portal",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_66.webp",
      category: "Other Links",
      url: "https://bangladesh.gov.bd/",
    },
    {
      title: "Postal Department Parcel Tracking",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_67.webp",
      category: "Other Links",
      url: "https://www.epost.gov.bd/",
    },
    {
      title: "BTRC IMEI Check",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_68.webp",
      category: "Other Links",
      url: "https://neir.btrc.gov.bd/",
    },
    {
      title: "Expatriate Welfare Services",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_69.webp",
      category: "Other Links",
      url: "https://probashi.gov.bd/",
    },
    {
      title: "Bangladesh Bank",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_70.webp",
      category: "Other Links",
      url: "https://www.bb.org.bd/en/index.php",
    },
    {
      title: "Digital Land Services",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_71.webp",
      category: "Other Links",
      url: "https://land.gov.bd/",
    },
    {
      title: "Daraz Online Shopping",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_72.webp",
      category: "Other Links",
      url: "https://www.daraz.com.bd/",
    },
    {
      title: "Buy Rokomari books",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_73.webp",
      category: "Other Links",
      url: "https://www.rokomari.com/",
    },
    {
      title: "Chaldal Online Market",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_74.webp",
      category: "Other Links",
      url: "https://chaldal.com/",
    },
    {
      title: "Pickaboo Electronics Store",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_75.webp",
      category: "Other Links",
      url: "https://www.pickaboo.com/",
    },
    {
      title: "Foodpanda Food Delivery",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_76.webp",
      category: "Other Links",
      url: "https://www.foodpanda.com.bd/",
    },
    {
      title: "Pathao Ride & Delivery",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_77.webp",
      category: "Other Links",
      url: "https://pathao.com/bn/",
    },
    {
      title: "Shohoz Ticket Booking",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_78.webp",
      category: "Other Links",
      url: "https://www.shohoz.com/",
    },
    {
      title: "MobileDokan Mobile Prices",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_79.webp",
      category: "Other Links",
      url: "https://www.mobiledokan.com/",
    },
    {
      title: "GSMArena Mobile Specs",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_80.webp",
      category: "Other Links",
      url: "https://www.gsmarena.com/",
    },
    {
      title: "Medex Medicine Info",
      icon: "https://files.sohozkaj.com/sorkari-icons/icon_81.webp",
      category: "Other Links",
      url: "https://medex.com.bd/",
    },
  ];

  // Dynamic Filtering Logic based on Search Query & Selected Category
  const filteredLinks = linksData.filter((item) => {
    const matchesCategory =
      selectedCategory === "All Categories" ||
      selectedCategory === "All Links" ||
      item.category === selectedCategory;

    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim());

    return matchesCategory && matchesSearch;
  });

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
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col w-full font-sans">
      {/* Hero Section Container */}
      <div className="relative w-full pt-14 pb-12 px-4 flex flex-col items-center text-center bg-gradient-to-b from-[#F5F3FF]/40 via-[#FFF9F5] to-[#FDFBF7] z-10">
        {/* Background Blur Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-24 left-1/4 w-80 h-80 bg-purple-100/40 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-80 h-80 bg-orange-100/50 rounded-full blur-3xl" />
        </div>

        {/* Top Dynamic Count Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50/90 border border-orange-200/80 text-[#FF8A00] text-[11px] font-extrabold mb-5 shadow-2xs">
          <span>{linksData.length}+ Essential Links</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4 max-w-3xl">
          All essential <span className="text-[#FF7A00]">Govt Websites</span> &{" "}
          <br className="hidden sm:inline" />
          Links
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-gray-600 max-w-lg mb-8 leading-relaxed font-normal">
          Find all essential government website and service links here. Quick,{" "}
          <br className="hidden sm:inline" />
          secure, and hassle-free.
        </p>

        {/* Functional Search Bar & Category Dropdown */}
        <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-3 mb-8 relative z-40">
          {/* Functional Search Box */}
          <div className="relative flex-1 w-full flex items-center bg-white border border-gray-200/90 rounded-full px-5 py-2.5 shadow-xs focus-within:border-[#FF8A00] focus-within:ring-2 focus-within:ring-orange-100 transition">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search links... (e.g. NID, Birth Certificate)"
              className="w-full bg-transparent outline-none text-xs sm:text-sm text-gray-700 placeholder-gray-400 font-medium pr-20"
            />
            <div className="absolute right-3.5 flex items-center gap-2">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => searchInputRef.current?.focus()}
                  className="bg-orange-50 text-orange-600 border border-orange-200/70 text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-orange-100 transition cursor-pointer"
                  title="Press Ctrl + K to search"
                >
                  Ctrl K
                </button>
              )}
              <Search className="w-4 h-4 text-[#FF8A00]" />
            </div>
          </div>

          {/* Functional Category Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="w-full sm:w-auto bg-white border border-gray-200/90 hover:border-gray-300 rounded-full px-5 py-2.5 shadow-xs text-xs sm:text-sm font-semibold text-gray-700 flex items-center justify-between sm:justify-center gap-3 transition min-w-[160px] cursor-pointer"
            >
              <span>{selectedCategory}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  categoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Options Menu */}
            {categoryOpen && (
              <div className="absolute left-1/2 sm:left-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="w-3 h-3 bg-[#FF8A00] rotate-45 mx-auto -mt-3 border-t border-l border-orange-400 mb-1" />

                <div className="flex flex-col gap-0.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "bg-[#FF8A00] text-white shadow-xs"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Functional Filter Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap max-w-3xl relative z-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleCategoryChange(tab)}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#FF8A00] text-white shadow-xs"
                    : "bg-gray-100/90 hover:bg-gray-200/80 text-gray-600"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Cards Grid */}
      <div className="w-full flex justify-center px-6 pt-6 relative z-0">
        <div className="max-w-[1200px] w-full pb-16">
          {filteredLinks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {filteredLinks.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition flex flex-col items-center text-center gap-4 relative group cursor-pointer"
                >
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden p-2 group-hover:bg-orange-100 transition">
                    <img
                      src={item.icon}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#FF8A00] transition">
                    {item.title}
                  </h3>
                </a>
              ))}
            </div>
          ) : (
            /* Empty State when no links match search/filter */
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-100 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-[#FF8A00] mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">
                No matching links found
              </h3>
              <p className="text-xs text-gray-500 mb-5 max-w-sm">
                We couldn't find anything matching "{searchQuery}". Try
                searching with another keyword or reset filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  handleCategoryChange("All Categories");
                }}
                className="bg-[#FF8A00] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-orange-600 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FAQ Section */}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function DorkarLinksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" />}>
      <DorkarLinksContent />
    </Suspense>
  );
}
