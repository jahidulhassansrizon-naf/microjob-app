// app/components/Navbar.tsx
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
  Menu,
  X,
} from "lucide-react";

// Our Services ডেটা
const serviceItems = [
  { label: "AI Photo Edit", icon: Sparkles, href: "/login" },
  { label: "Manual Photo Edit", icon: Edit3, href: "/login" },
  { label: "Bulk Photo Edit", icon: Copy, href: "/login" },
  { label: "AI Template", icon: FileCode, href: "/login" },
  { label: "Document Templates", icon: FileText, href: "/login" },
  { label: "Print Media", icon: Printer, href: "/login" },
  { label: "Questions Create", icon: HelpCircle, href: "/login" },
];

// SohozTools মেগা-মেনু ডেটা
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

// Important Links ডেটা (প্রথমটিতে /dorkar-link এবং বাকিগুলো #)
const importantLinksItems = [
  {
    title: "Govt Websites & Links",
    subtitle: "National essential services",
    count: "14",
    href: "/dorkar-link",
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // মোবাইল ড্রয়ারের ভেতরে অ্যাকর্ডিয়ন ওপেন/ক্লোজ রাখার স্টেট
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileImportantOpen, setMobileImportantOpen] = useState(false);

  // ড্যাশবোর্ড, অথেন্টিকেশন বা নির্দিষ্ট পেজ হলে মূল নেভবার হাইড থাকবে
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
    pathname.startsWith("/profile") ||
    pathname.startsWith("/free-tools")
  ) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-[999] w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs py-4 md:py-5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-between relative">
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

          {/* Center: Navigation Links (Desktop Only) */}
          <nav className="hidden lg:flex items-center gap-8 text-[14px] leading-[20px] font-semibold text-[#555555]">
            {/* Our Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                className="flex items-center gap-1 hover:text-amber-500 transition py-2 cursor-pointer"
              >
                Our Services{" "}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isServicesOpen ? "rotate-180" : ""
                  }`}
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
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="flex items-center gap-1 hover:text-amber-500 transition py-2 cursor-pointer"
              >
                SohozTools{" "}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isToolsOpen ? "rotate-180" : ""
                  }`}
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

            {/* Important Links Dropdown (মূল লেখায় ক্লিক করলে /dorkar-link এ যাবে) */}
            <div
              className="relative"
              onMouseEnter={() => setIsImportantOpen(true)}
              onMouseLeave={() => setIsImportantOpen(false)}
            >
              <Link
                href="/dorkar-link"
                onClick={() => setIsImportantOpen(false)}
                className="flex items-center gap-1 hover:text-amber-500 transition py-2 cursor-pointer"
              >
                Important Links{" "}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isImportantOpen ? "rotate-180" : ""
                  }`}
                />
              </Link>

              {isImportantOpen && (
                <div className="absolute top-full left-0 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 z-[1000] flex flex-col">
                  {importantLinksItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setIsImportantOpen(false)}
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
              <Star
                size={13}
                className="fill-amber-500 text-amber-500 inline"
              />
              <span>Review</span>
            </Link>
          </nav>

          {/* Right: Language, Login & Mobile Hamburger Trigger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden sm:flex bg-[#F3F4F5] border border-gray-200/80 p-0.5 rounded-full items-center text-[11px] font-bold shadow-2xs">
              <button className="text-[#555555] px-2.5 py-1 rounded-full cursor-pointer">
                বাং
              </button>
              <button className="bg-[#6B52FF] text-white px-2.5 py-1 rounded-full shadow-2xs cursor-pointer">
                EN
              </button>
            </div>

            <Link
              href="/login"
              className="bg-gradient-to-r from-[#F98800] via-[#E64B5D] to-[#A845B2] text-white text-xs sm:text-[15px] font-medium px-4 sm:px-6 py-2 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-xs hover:opacity-95 transition tracking-wide"
            >
              <LogIn size={16} strokeWidth={2.2} /> Login
            </Link>

            {/* Mobile Menu Open Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Off-canvas Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1100] lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-xs px-2 py-1.5 rounded-lg">
                  SK
                </div>
                <span className="font-extrabold text-gray-900 text-sm">
                  সহজ কাজ
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body Links */}
            <div className="p-5 flex flex-col gap-4 text-sm font-semibold text-gray-700">
              {/* Mobile Our Services Dropdown */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  className="flex items-center justify-between w-full py-1.5 text-xs font-bold text-gray-800"
                >
                  <span>Our Services</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileServicesOpen && (
                  <div className="flex flex-col gap-1 pl-3 border-l-2 border-orange-100 mt-1">
                    {serviceItems.map((item, idx) => {
                      const IconComp = item.icon;
                      return (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-xs text-gray-600 hover:text-[#FF5D00]"
                        >
                          <IconComp size={14} className="text-gray-400" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile SohozTools Link/Dropdown */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                  className="flex items-center justify-between w-full py-1.5 text-xs font-bold text-gray-800"
                >
                  <span>SohozTools</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${mobileToolsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileToolsOpen && (
                  <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-orange-100 mt-1 max-h-48 overflow-y-auto">
                    <Link
                      href="/tools"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-bold text-orange-500 py-1"
                    >
                      View All Tools &gt;
                    </Link>
                    {sohozToolsCategories.map((cat, cIdx) => (
                      <div key={cIdx} className="flex flex-col gap-1 py-1">
                        <span className="text-[11px] font-extrabold text-gray-900">
                          {cat.title}
                        </span>
                        {cat.tools.map((t, tIdx) => (
                          <Link
                            key={tIdx}
                            href={t.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-[11px] text-gray-600 hover:text-orange-500 pl-2"
                          >
                            - {t.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Important Links Dropdown */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setMobileImportantOpen(!mobileImportantOpen)}
                  className="flex items-center justify-between w-full py-1.5 text-xs font-bold text-gray-800"
                >
                  <span>Important Links</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${mobileImportantOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileImportantOpen && (
                  <div className="flex flex-col gap-1 pl-3 border-l-2 border-orange-100 mt-1">
                    {importantLinksItems.map((imp, iIdx) => (
                      <Link
                        key={iIdx}
                        href={imp.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between py-1.5 text-xs text-gray-600 hover:text-[#FF5D00]"
                      >
                        <span>{imp.title}</span>
                        {imp.count && (
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                            {imp.count}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2.5">
                <Link
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-[#FF5D00] text-xs font-bold text-gray-800"
                >
                  Package
                </Link>
                <Link
                  href="/reviews"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-1 hover:text-[#FF5D00] text-xs font-bold text-gray-800"
                >
                  <span>Review (5</span>
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                  <span>)</span>
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-4 sm:hidden flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold">
                  Language
                </span>
                <div className="bg-[#F3F4F5] border border-gray-200 p-0.5 rounded-full flex items-center text-[11px] font-bold">
                  <button className="text-[#555555] px-3 py-1 rounded-full">
                    বাং
                  </button>
                  <button className="bg-[#6B52FF] text-white px-3 py-1 rounded-full">
                    EN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
