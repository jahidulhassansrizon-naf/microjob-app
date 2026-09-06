// app/components/Navbar.tsx (অথবা আপনার সঠিক পাথ অনুযায়ী)
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Star,
  ChevronDown,
  LogIn,
  Sparkles,
  Edit3,
  Copy,
  FileCode,
  FileText,
  Printer,
  HelpCircle,
} from "lucide-react";

// Our Services ডেটা (সকল href /login এ সেট করা)
const serviceItems = [
  { label: "AI Photo Edit", icon: Sparkles, href: "/login" },
  { label: "Manual Photo Edit", icon: Edit3, href: "/login" },
  { label: "Bulk Photo Edit", icon: Copy, href: "/login" },
  { label: "AI Template", icon: FileCode, href: "/login" },
  { label: "Document Templates", icon: FileText, href: "/login" },
  { label: "Print Media", icon: Printer, href: "/login" },
  { label: "Questions Create", icon: HelpCircle, href: "/login" },
];

// SohozTools মেগা-মেনু ডেটা[cite: 4]
const sohozToolsCategories = [
  {
    title: "PDF Tools",
    count: "15 tools",
    tools: [
      { name: "Compress PDF", href: "/tools" },
      { name: "Merge PDFs", href: "/tools" },
      { name: "Create PDF", href: "/tools" },
      { name: "Split PDF", href: "/tools" },
      { name: "PDF to Image", href: "/tools" },
      { name: "Lock / Unlock PDF", href: "/tools" },
    ],
    moreText: "+9 more >",
  },
  {
    title: "Image Tools",
    count: "18 tools",
    tools: [
      { name: "Image Size Reducer", href: "/tools" },
      { name: "NID to PDF", href: "/tools" },
      { name: "Remove Background", href: "/tools" },
      { name: "Govt Job Photo & Sign Resizer", href: "/tools" },
      { name: "Passport to PDF", href: "/tools" },
      { name: "Image Convert", href: "/tools" },
    ],
    moreText: "+12 more >",
  },
  {
    title: "Text Tools",
    count: "6 tools",
    tools: [
      { name: "Bijoy ↔ Unicode", href: "/tools" },
      { name: "Banglish Typing", href: "/tools" },
      { name: "Number to Words", href: "/tools" },
      { name: "Image to Text", href: "/tools" },
      { name: "Text Analyzer", href: "/tools" },
      { name: "Date Format Converter", href: "/tools" },
    ],
  },
  {
    title: "Video Tools",
    count: "10 tools",
    tools: [
      { name: "Compress Video", href: "/tools" },
      { name: "Trim/Cut Video", href: "/tools" },
      { name: "Merge Videos", href: "/tools" },
      { name: "Video to Audio", href: "/tools" },
      { name: "Add Watermark", href: "/tools" },
      { name: "Audio Volume Booster", href: "/tools" },
    ],
    moreText: "+4 more >",
  },
  {
    title: "General Tools",
    count: "5 tools",
    tools: [
      { name: "Family Card Form", href: "/tools" },
      { name: "Fuel Card Form", href: "/tools" },
      { name: "ATS Friendly CV Maker", href: "/tools" },
      { name: "Age Calculator", href: "/tools" },
      { name: "EMI Calculator", href: "/tools" },
    ],
  },
];

// Important Links ডেটা[cite: 4]
const importantLinksItems = [
  {
    title: "Govt Websites & Links",
    subtitle: "National essential services",
    count: "14",
    href: "#",
  },
  {
    title: "Visa & International",
    subtitle: "Visa, passport & expat services",
    count: "15",
    href: "#",
  },
  {
    title: "Other Links",
    subtitle: "Results & other useful sites",
    count: "12",
    href: "#",
  },
  {
    title: "Job Circular",
    subtitle: "Latest job circulars",
    href: "#",
  },
  {
    title: "Important Articles",
    subtitle: "Blog & helpful articles",
    href: "#",
  },
  {
    title: "Contest",
    subtitle: "Use SohojKaj & win prizes!",
    isNew: true,
    href: "#",
  },
  {
    title: "Contact",
    subtitle: "Get in touch with us",
    href: "#",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isImportantOpen, setIsImportantOpen] = useState(false);

  // ড্যাশবোর্ড, অথেন্টিকেশন বা my-files পেজ হলে মূল নেভবার হাইড থাকবে[cite: 4, 6]
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/dashboard") ||
    pathname === "/my-files" ||
    pathname === "/ai-editor" ||
    pathname.startsWith("/manual-editor") ||
    pathname.startsWith("/bulk-photo-edit") ||
    pathname.startsWith("/ai-template") ||
    pathname.startsWith("/questions-create") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/print-media") ||
    pathname.startsWith("/sohoj-tools") ||
    pathname.startsWith("/profile")
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-[999] w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs py-5">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between relative">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-xs px-2.5 py-2 rounded-xl shadow-xs">
            SK
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 leading-tight">
              সহজ কাজ
            </h2>
            <p className="text-[9px] font-semibold text-gray-400 tracking-wider uppercase">
              www.sohojkaj.com
            </p>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-[14px] leading-[20px] font-semibold text-[#555555]">
          {/* Our Services Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={() => setIsServicesOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-amber-500 transition py-2 cursor-pointer">
              Our Services{" "}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isServicesOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isServicesOpen && (
              <div className="absolute top-full left-0 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 z-[1000] flex flex-col gap-1">
                {serviceItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#FF5D00] transition"
                    >
                      <IconComponent size={16} className="text-gray-400" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* SohozTools Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => setIsToolsOpen(true)}
            onMouseLeave={() => setIsToolsOpen(false)}
          >
            <Link
              href="/tools"
              className="flex items-center gap-1 hover:text-amber-500 transition py-2 cursor-pointer"
            >
              SohozTools{" "}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isToolsOpen ? "rotate-180" : ""}`}
              />
            </Link>

            {isToolsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1050px] bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 z-[1000] grid grid-cols-5 gap-4">
                {sohozToolsCategories.map((cat, idx) => (
                  <div key={idx} className="flex flex-col gap-3">
                    <div className="bg-gray-50/80 border border-gray-100 p-3 rounded-2xl flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-gray-900">
                        {cat.title}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {cat.count}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      {cat.tools.map((tool, tIdx) => (
                        <Link
                          key={tIdx}
                          href={tool.href}
                          className="text-[11px] font-semibold text-gray-600 hover:text-[#FF5D00] hover:bg-orange-50/50 px-2.5 py-1.5 rounded-lg transition truncate"
                        >
                          {tool.name}
                        </Link>
                      ))}
                      {cat.moreText && (
                        <Link
                          href="/tools"
                          className="text-[11px] font-bold text-orange-500 hover:underline px-2.5 py-1"
                        >
                          {cat.moreText}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}

                <div className="col-span-5 pt-3 border-t border-gray-100 text-center">
                  <Link
                    href="/tools"
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 inline-flex items-center gap-1"
                  >
                    View all tools &gt;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Important Links Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsImportantOpen(true)}
            onMouseLeave={() => setIsImportantOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-amber-500 transition py-2 cursor-pointer">
              Important Links{" "}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isImportantOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isImportantOpen && (
              <div className="absolute top-full left-0 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 z-[1000] flex flex-col">
                {importantLinksItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-orange-50 transition group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800 group-hover:text-[#FF5D00]">
                          {item.title}
                        </span>
                        {item.isNew && (
                          <span className="bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {item.subtitle}
                      </span>
                    </div>
                    {item.count && (
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/pricing" className="hover:text-amber-500 transition">
            Package
          </Link>
          <Link
            href="/reviews"
            className="flex items-center gap-0.5 hover:text-amber-500 transition cursor-pointer"
          >
            <span>5</span>
            <Star size={13} className="fill-amber-500 text-amber-500 inline" />
            <span>Review</span>
          </Link>
        </nav>

        {/* Right: Language & Login */}
        <div className="flex items-center gap-3">
          <div className="bg-[#F3F4F5] border border-gray-200/80 p-0.5 rounded-full flex items-center text-[11px] font-bold shadow-2xs">
            <button className="text-[#555555] px-2.5 py-1 rounded-full cursor-pointer">
              বাং
            </button>
            <button className="bg-[#6B52FF] text-white px-2.5 py-1 rounded-full shadow-2xs cursor-pointer">
              EN
            </button>
          </div>

          <Link
            href="/login"
            className="bg-gradient-to-r from-[#F98800] via-[#E64B5D] to-[#A845B2] text-white text-[15px] font-medium px-6 py-2 rounded-full flex items-center gap-2 shadow-xs hover:opacity-95 transition tracking-wide"
          >
            <LogIn size={18} strokeWidth={2.2} /> Login
          </Link>
        </div>
      </div>
    </header>
  );
}
