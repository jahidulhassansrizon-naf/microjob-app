// app/dorkar-link/page.tsx
"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Search, Check, X } from "lucide-react";
import Footer from "@/components/Footer";
// Static Data (Defined outside component to prevent re-allocation on re-renders)
const CATEGORIES = [
    "All Categories",
    "Govt Websites & Links",
    "Visa & International",
    "Other Links",
];
const TABS = [
    "All Links",
    "Govt Websites & Links",
    "Visa & International",
    "Other Links",
];
const LINKS_DATA = [
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
const FAQ_DATA = [
    {
        q: "What is the useful link?",
        ans: "Useful links are curated direct shortcuts to essential government portals, public services, and standard verification systems.",
    },
    {
        q: "Do I need an account to use these?",
        ans: "No account is required on Seba Lagbe to browse or access these public directory links.",
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
const BN_TITLES: Record<string, string> = {
    "Birth registration check": "জন্ম নিবন্ধন যাচাই",
    "National Identity Card New Application": "জাতীয় পরিচয়পত্র নতুন আবেদন",
    "Birth registration correction application": "জন্ম নিবন্ধন সংশোধনের আবেদন",
    "Download ledger": "লেজার ডাউনলোড",
    "NID Wallet": "এনআইডি ওয়ালেট",
    "Police Clearance Application": "পুলিশ ক্লিয়ারেন্সের আবেদন",
    "Driving License Manual": "ড্রাইভিং লাইসেন্স ম্যানুয়াল",
    "Elderly, widow, disabled allowance application": "বয়স্ক, বিধবা ও প্রতিবন্ধী ভাতার আবেদন",
    "Birth certificate download": "জন্ম সনদ ডাউনলোড",
    "Train ticket booking": "ট্রেনের টিকিট বুকিং",
    "Indian Visa Application": "ভারতীয় ভিসার আবেদন",
    "Application for nomination": "মনোনয়নের আবেদন",
    "Biman Bangladesh Air Ticket": "বিমান বাংলাদেশ এয়ার টিকিট",
    "Train Certificate Download": "প্রশিক্ষণ সনদ ডাউনলোড",
    "Online GO application": "অনলাইন জিও আবেদন",
    "Food Management Monitoring System": "খাদ্য ব্যবস্থাপনা মনিটরিং সিস্টেম",
    "BDSL": "বিডিএসএল",
    "Death registration check": "মৃত্যু নিবন্ধন যাচাই",
    "Saudi visa check": "সৌদি ভিসা যাচাই",
    "Expatriate Training TTC Application": "প্রবাসী প্রশিক্ষণ (টিটিসি) আবেদন",
    "SSC / HSC Result with all board numbers": "সকল বোর্ডের নম্বরসহ এসএসসি / এইচএসসি ফলাফল",
    "Bus ticket booking": "বাসের টিকিট বুকিং",
    "Application for electricity meter": "বিদ্যুৎ মিটারের আবেদন",
    "Passport location verification": "পাসপোর্ট অবস্থান যাচাই",
    "Saudi Visa Check-2": "সৌদি ভিসা যাচাই-২",
    "Expatriate Training Certificate Download": "প্রবাসী প্রশিক্ষণ সনদ ডাউনলোড",
    "Tanti's new application": "তাঁতির নতুন আবেদন",
    "Online Salary calculator": "অনলাইন বেতন ক্যালকুলেটর",
    "Typhoid-HPV vaccination registration": "টাইফয়েড-এইচপিভি টিকার নিবন্ধন",
    "Open University Result": "উন্মুক্ত বিশ্ববিদ্যালয়ের ফলাফল",
    "Saudi-Gamka Medical Report": "সৌদি-গামকা মেডিকেল রিপোর্ট",
    "VAT Registration": "ভ্যাট নিবন্ধন",
    "Freedom Fighter VGF/FD Download": "মুক্তিযোদ্ধা ভিজিএফ/এফডি ডাউনলোড",
    "Primary/Madrasah Education Completion Results": "প্রাথমিক/মাদ্রাসা শিক্ষা সমাপনী ফলাফল",
    "Saudi Gata Check": "সৌদি গাটা চেক",
    "Rajshahi College Admission and Form Fill-up": "রাজশাহী কলেজ ভর্তি ও ফরম পূরণ",
    "Saudi Arabia Muqeem check": "সৌদি আরব মুকিম যাচাই",
    "National University Update Notice": "জাতীয় বিশ্ববিদ্যালয়ের সর্বশেষ নোটিশ",
    "7 College Result Archive": "৭ কলেজ ফলাফল আর্কাইভ",
    "Degree Honors Masters Form Fill-up": "ডিগ্রি, অনার্স ও মাস্টার্স ফরম পূরণ",
    "Fazil Result (Islamic Arabic University)": "ফাজিল ফলাফল (ইসলামী আরবি বিশ্ববিদ্যালয়)",
    "Jagannath University Admit Card": "জগন্নাথ বিশ্ববিদ্যালয় প্রবেশপত্র",
    "Qatar visa check": "কাতার ভিসা যাচাই",
    "Qatar holiday period check": "কাতার ছুটির সময় যাচাই",
    "Technical Education Board Diploma Result": "কারিগরি শিক্ষা বোর্ড ডিপ্লোমা ফলাফল",
    "Square Hospital Doctor Serial": "স্কয়ার হাসপাতালের ডাক্তারের সিরিয়াল",
    "Honors Degree Board Challenge": "অনার্স ডিগ্রি বোর্ড চ্যালেঞ্জ",
    "HSC Result Comilla with Board Number": "কুমিল্লা বোর্ডের এইচএসসি ফলাফল (বোর্ড নম্বরসহ)",
    "Singapore Arrival Card": "সিঙ্গাপুর অ্যারাইভাল কার্ড",
    "Freedom Fighters Welfare Trust": "মুক্তিযোদ্ধা কল্যাণ ট্রাস্ট",
    "Qatar Medical Appointment": "কাতার মেডিকেল অ্যাপয়েন্টমেন্ট",
    "HSC Result Comilla with Number": "কুমিল্লা বোর্ডের এইচএসসি ফলাফল (নম্বরসহ)",
    "Ministry of Freedom Fighters Notice": "মুক্তিযুদ্ধ বিষয়ক মন্ত্রণালয়ের নোটিশ",
    "Freedom Fighter Janaka notice": "মুক্তিযোদ্ধা জনক নোটিশ",
    "Secondary Higher Secondary All Notices": "মাধ্যমিক ও উচ্চ মাধ্যমিক সকল নোটিশ",
    "Application for electricity notice (new)": "বিদ্যুৎ সংযোগের আবেদন নোটিশ (নতুন)",
    "Tax payment": "কর পরিশোধ",
    "TCB website": "টিসিবি ওয়েবসাইট",
    "Smart land design": "স্মার্ট ল্যান্ড ডিজাইন",
    "Death registration application": "মৃত্যু নিবন্ধনের আবেদন",
    "E-Passport Application": "ই-পাসপোর্টের আবেদন",
    "E-challan government fee payment": "ই-চালান সরকারি ফি পরিশোধ",
    "Land Development Tax Calculation": "ভূমি উন্নয়ন কর হিসাব",
    "Government job portal": "সরকারি চাকরির পোর্টাল",
    "Bangladesh National Information Portal": "বাংলাদেশ জাতীয় তথ্য বাতায়ন",
    "Postal Department Parcel Tracking": "ডাক বিভাগ পার্সেল ট্র্যাকিং",
    "BTRC IMEI Check": "বিটিআরসি আইএমইআই যাচাই",
    "Expatriate Welfare Services": "প্রবাসী কল্যাণ সেবা",
    "Bangladesh Bank": "বাংলাদেশ ব্যাংক",
    "Digital Land Services": "ডিজিটাল ভূমি সেবা",
    "Daraz Online Shopping": "দারাজ অনলাইন শপিং",
    "Buy Rokomari books": "রকমারি থেকে বই কিনুন",
    "Chaldal Online Market": "চালডাল অনলাইন বাজার",
    "Pickaboo Electronics Store": "পিকাবু ইলেকট্রনিক্স স্টোর",
    "Foodpanda Food Delivery": "ফুডপান্ডা ফুড ডেলিভারি",
    "Pathao Ride & Delivery": "পাঠাও রাইড ও ডেলিভারি",
    "Shohoz Ticket Booking": "সহজ টিকিট বুকিং",
    "MobileDokan Mobile Prices": "মোবাইলদোকান মোবাইলের দাম",
    "GSMArena Mobile Specs": "জিএসএমএরিনা মোবাইল স্পেসিফিকেশন",
    "Medex Medicine Info": "মেডেক্স ওষুধের তথ্য",
};
const BN_UI: Record<string, string> = {
    "All Categories": "সব ক্যাটাগরি",
    "All Links": "সব লিংক",
    "Govt Websites & Links": "সরকারি ওয়েবসাইট ও লিংক",
    "Visa & International": "ভিসা ও আন্তর্জাতিক",
    "Other Links": "অন্যান্য লিংক",
};
const BN_FAQ: Record<string, { q: string; ans: string }> = {
    "What is the useful link?": { q: "দরকারি লিংক কী?", ans: "দরকারি লিংক হলো গুরুত্বপূর্ণ সরকারি পোর্টাল, জনসেবা ও যাচাইকরণ ব্যবস্থার সরাসরি শর্টকাট, যা বেছে সাজানো হয়েছে।" },
    "Do I need an account to use these?": { q: "এগুলো ব্যবহার করতে কি অ্যাকাউন্ট লাগবে?", ans: "এই পাবলিক ডিরেক্টরির লিংকগুলো দেখতে বা ব্যবহার করতে সেবা লাগবে কোনো অ্যাকাউন্ট লাগে না।" },
    "Are these official websites?": { q: "এগুলো কি অফিসিয়াল ওয়েবসাইট?", ans: "আমরা সরাসরি সরকারি ও অনুমোদিত তৃতীয় পক্ষের অফিসিয়াল ডোমেইনের লিংক দিই।" },
    "Is my personal information safe?": { q: "আমার ব্যক্তিগত তথ্য কি নিরাপদ?", ans: "হ্যাঁ। বাইরের সরকারি পোর্টালে আপনি যে ব্যক্তিগত তথ্য বা পাসওয়ার্ড দেন, আমরা তা সংরক্ষণ, ট্র্যাক বা প্রসেস করি না।" },
    "How often are the links updated?": { q: "লিংকগুলো কত দিন পরপর আপডেট করা হয়?", ans: "লিংকগুলো সচল ও সঠিক রাখতে আমাদের টিম নিয়মিত ডিরেক্টরি পর্যালোচনা ও আপডেট করে।" },
    "Can board or exam results be seen here?": { q: "এখানে কি বোর্ড বা পরীক্ষার ফলাফল দেখা যাবে?", ans: "আমরা শিক্ষা বোর্ডের অফিসিয়াল ফলাফল পোর্টালের সরাসরি লিংক দিই, যেখানে আপনি ফলাফল দেখতে পারবেন।" },
    "What should I do if a link doesn't work?": { q: "কোনো লিংক কাজ না করলে কী করব?", ans: "সরকারি পোর্টালের সাময়িক সার্ভার সমস্যার কারণে লিংক কাজ না করলে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা আমাদের জানান।" },
    "Can I request that a new link be added?": { q: "নতুন লিংক যোগ করার অনুরোধ করা যাবে কি?", ans: "হ্যাঁ, নতুন দরকারি জনসেবা বা লিংকের পরামর্শ দিতে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করতে পারেন।" },
};
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const toBnNum = (n: number | string) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
type SearchParamsLike = { get(name: string): string | null } | null;
function DorkarLinksContent({ searchParams }: { searchParams: SearchParamsLike }) {
    const categoryParam = searchParams?.get("category") ?? null;
    const { locale } = useI18n();
    const isBn = locale === "bn";
    const ui = (text: string) => (isBn ? BN_UI[text] ?? text : text);
    const titleOf = (text: string) => (isBn ? BN_TITLES[text] ?? text : text);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [activeTab, setActiveTab] = useState("All Links");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
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
    // Close category dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)) {
                setCategoryOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    // Helper to change filter category synchronously
    const handleCategoryChange = (categoryName: string) => {
        const canonicalName = categoryName === "All Links" ? "All Categories" : categoryName;
        setSelectedCategory(canonicalName);
        setActiveTab(categoryName === "All Categories" ? "All Links" : categoryName);
        setCategoryOpen(false);
    };
    // Optimized Dynamic Filtering Logic
    const filteredLinks = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return LINKS_DATA.filter((item) => {
            const matchesCategory = selectedCategory === "All Categories" ||
                selectedCategory === "All Links" ||
                item.category === selectedCategory;
            const matchesSearch = !query || item.title.toLowerCase().includes(query) || (BN_TITLES[item.title] ?? "").toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);
    return (<div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full">
      {/* Hero Section Container */}
      <div className="relative w-full pt-14 pb-12 px-4 flex flex-col items-center text-center bg-gradient-to-b from-blue-50/40 via-slate-50 to-[#F8FAFC] z-10">
        {/* Background Blur Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-24 left-1/4 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl"/>
          <div className="absolute top-10 right-1/4 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl"/>
        </div>

        {/* Top Dynamic Count Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#10B981] text-[11px] font-extrabold mb-5 shadow-2xs">
          <span>{isBn ? toBnNum(LINKS_DATA.length) + "+ গুরুত্বপূর্ণ লিংক" : LINKS_DATA.length + "+ Essential Links"}</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight leading-tight mb-4 max-w-3xl">{isBn ? "সব প্রয়োজনীয় " : "All essential "}<span className="text-[#2563EB]">{isBn ? "সরকারি ওয়েবসাইট" : "Govt Websites"}</span>{isBn ? " ও লিংক" : <>{"& "}<br className="hidden sm:inline"/>{"Links"}</>}</h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mb-8 leading-relaxed font-normal">{isBn ? "সব প্রয়োজনীয় সরকারি ওয়েবসাইট ও সেবার লিংক পান এক জায়গায়। দ্রুত, নিরাপদ এবং ঝামেলাহীন।" : <>{"Find all essential government website and service links here. Quick, "}<br className="hidden sm:inline"/>{"secure, and hassle-free."}</>}</p>

        {/* Functional Search Bar & Category Dropdown */}
        <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-3 mb-8 relative z-40">
          {/* Search Box */}
          <div className="relative flex-1 w-full flex items-center bg-white border border-[#E2E8F0] rounded-full px-5 py-2.5 shadow-xs focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition">
            <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isBn ? "লিংক খুঁজুন... (যেমন: এনআইডি, জন্ম সনদ)" : "Search links... (e.g. NID, Birth Certificate)"} className="w-full bg-transparent outline-none text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 font-medium pr-20"/>
            <div className="absolute right-3.5 flex items-center gap-2">
              {searchQuery ? (<button onClick={() => setSearchQuery("")} className="p-1 hover:bg-[#E2E8F0] rounded-full text-slate-400 hover:text-[#0F172A] cursor-pointer" title={isBn ? "সার্চ মুছুন" : "Clear search"}>
                  <X className="w-3.5 h-3.5"/>
                </button>) : (<button onClick={() => searchInputRef.current?.focus()} className="bg-[#E2E8F0] text-[#0F172A] border border-slate-300/70 text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-slate-300 transition cursor-pointer" title={isBn ? "সার্চ করতে Ctrl + K চাপুন" : "Press Ctrl + K to search"}>Ctrl K</button>)}
              <Search className="w-4 h-4 text-[#2563EB]"/>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button onClick={() => setCategoryOpen(!categoryOpen)} className="w-full sm:w-auto bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-full px-5 py-2.5 shadow-xs text-xs sm:text-sm font-semibold text-[#0F172A] flex items-center justify-between sm:justify-center gap-3 transition min-w-[160px] cursor-pointer">
              <span>{ui(selectedCategory)}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`}/>
            </button>

            {/* Dropdown Options Menu */}
            {categoryOpen && (<div className="absolute left-1/2 sm:left-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="w-3 h-3 bg-[#2563EB] rotate-45 mx-auto -mt-3 border-t border-l border-blue-400 mb-1"/>

                <div className="flex flex-col gap-0.5">
                  {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (<button key={cat} onClick={() => handleCategoryChange(cat)} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${isSelected
                        ? "bg-[#2563EB] text-white shadow-xs"
                        : "text-[#0F172A] hover:bg-[#E2E8F0]/50"}`}>
                        <span>{ui(cat)}</span>
                        {isSelected && <Check className="w-4 h-4 text-white"/>}
                      </button>);
            })}
                </div>
              </div>)}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap max-w-3xl relative z-10">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (<button key={tab} onClick={() => handleCategoryChange(tab)} className={`text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${isActive
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "bg-[#E2E8F0] hover:bg-slate-300/80 text-[#0F172A]"}`}>
                {ui(tab)}
              </button>);
        })}
        </div>
      </div>

      {/* Dynamic Cards Grid */}
      <div className="w-full flex justify-center px-6 pt-6 relative z-0">
        <div className="max-w-[1200px] w-full pb-16">
          {filteredLinks.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {filteredLinks.map((item, index) => (<a key={`${item.title}-${index}`} href={item.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition flex flex-col items-center text-center gap-4 relative group cursor-pointer">
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#10B981]"></div>
                  <div className="w-12 h-12 rounded-full bg-[#E2E8F0]/60 flex items-center justify-center overflow-hidden p-2 group-hover:bg-[#E2E8F0] transition">
                    <img src={item.icon} alt={titleOf(item.title)} loading="lazy" className="w-full h-full object-contain"/>
                  </div>
                  <h3 className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition">
                    {titleOf(item.title)}
                  </h3>
                </a>))}
            </div>) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#E2E8F0] rounded-3xl p-8">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#2563EB] mb-4">
                <Search className="w-8 h-8"/>
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-1">{isBn ? "কোনো মিলে যাওয়া লিংক পাওয়া যায়নি" : "No matching links found"}</h3>
              <p className="text-xs text-slate-500 mb-5 max-w-sm">{isBn ? <>{"\""}{searchQuery}{"\" এর সাথে মিলে এমন কিছু পাওয়া যায়নি। অন্য কীওয়ার্ড দিয়ে খুঁজুন অথবা ফিল্টার রিসেট করুন।"}</> : <>{"We couldn't find anything matching \""}{searchQuery}{"\". Try searching with another keyword or reset filters."}</>}</p>
              <button onClick={() => {
                setSearchQuery("");
                handleCategoryChange("All Categories");
            }} className="bg-[#2563EB] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-blue-700 transition cursor-pointer">{isBn ? "সব ফিল্টার রিসেট করুন" : "Reset All Filters"}</button>
            </div>)}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="w-full flex flex-col items-center px-6 pb-20">
        <div className="max-w-[900px] w-full flex flex-col items-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#10B981] text-[11px] font-extrabold mb-3">{isBn ? "প্রশ্নোত্তর" : "FAQ"}</div>
          <h2 className="text-2xl md:text-4xl font-black text-[#0F172A] mb-10 text-center">{isBn ? "সাধারণ জিজ্ঞাসা " : "General inquiries "}<span className="text-[#10B981]">{isBn ? "(প্রশ্নোত্তর)" : "(FAQ)"}</span>
          </h2>

          <div className="w-full flex flex-col gap-3">
            {FAQ_DATA.map((faq, index) => {
            const isOpen = openFaq === index;
            return (<div key={index} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs transition">
                  <button onClick={() => setOpenFaq(isOpen ? null : index)} className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#F8FAFC]">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400">
                        {isBn ? toBnNum(index < 9 ? `0${index + 1}` : index + 1) : index < 9 ? `0${index + 1}` : index + 1}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-[#0F172A]">
                        {isBn ? BN_FAQ[faq.q]?.q ?? faq.q : faq.q}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}/>
                  </button>
                  {isOpen && (<div className="px-6 pb-4 pt-1 text-xs text-slate-600 pl-14 border-t border-[#E2E8F0]">
                      {isBn ? BN_FAQ[faq.q]?.ans ?? faq.ans : faq.ans}
                    </div>)}
                </div>);
        })}
          </div>

          {/* Disclaimer Box */}
          <div className="w-full mt-16 bg-[#E2E8F0]/40 border border-[#E2E8F0] rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute right-4 top-4 text-slate-300/50 text-7xl font-black pointer-events-none select-none">!</div>
            <h3 className="text-sm font-extrabold text-[#0F172A] mb-3 tracking-wide">{isBn ? "দাবিত্যাগ" : "Disclaimer"}</h3>
            <p className="text-[11px] md:text-xs text-slate-600 leading-relaxed max-w-3xl">{isBn ? "এই পাতায় দেওয়া লিংকগুলো মূলত বাংলাদেশ সরকার ও অন্যান্য কর্তৃপক্ষের (তৃতীয় পক্ষ) ওয়েবসাইট থেকে নেওয়া। ওই ওয়েবসাইটগুলোর কোনো তথ্য আমরা পরিবর্তন, নিয়ন্ত্রণ বা সংরক্ষণ করি না। সেবা গ্রহণকারীদের সুবিধার জন্য সব প্রয়োজনীয় লিংক এক জায়গায় সাজানো হয়েছে। সেখানকার কোনো ভুল তথ্য, সার্ভার সমস্যা বা আপনার ব্যক্তিগত তথ্যের জন্য সেবা লাগবে কর্তৃপক্ষ কোনোভাবেই দায়ী নয়।" : "The links provided on this page are mainly from the websites of the Bangladesh Government and other authorities (third parties). We do not modify, control or retain any information on those websites. For the convenience of the service users, all the necessary links have been arranged in one place. The Seba Lagbe Authority is in no way responsible for any incorrect information, server down or your personal data contained there."}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>);
}
// Fallback is the real page (no params) instead of an empty box, so reload never shows a blank page.
function SearchParamsBridge() {
    const searchParams = useSearchParams();
    return <DorkarLinksContent searchParams={searchParams}/>;
}
export default function DorkarLinksPage() {
    return (<Suspense fallback={<DorkarLinksContent searchParams={null}/>}>
      <SearchParamsBridge />
    </Suspense>);
}
