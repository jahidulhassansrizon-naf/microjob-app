// app/dashboard/_components/DashboardNavbar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  FileEdit,
  Copy,
  FileText,
  Briefcase,
  Printer,
  ChevronDown,
  Search,
  Menu,
  LayoutGrid,
  ShoppingBag,
  LogOut,
  User as UserIcon,
  Settings,
  CreditCard,
  X,
  Command,
} from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

interface UserData {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
}

export default function DashboardNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // ভাষা পরিবর্তনের স্টেট (EN / BN)
  const [lang, setLang] = useState<"EN" | "BN">("EN");

  // Credit Bonus Visibility State
  const [showCreditBonus, setShowCreditBonus] = useState<boolean>(true);

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dropdown States
  const [aiTemplateOpen, setAiTemplateOpen] = useState<boolean>(false);
  const [questionPaperOpen, setQuestionPaperOpen] = useState<boolean>(false);
  const [printMediaOpen, setPrintMediaOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
    }
  }, []);

  // গুগল ট্রান্সলেটের কুকি পরিবর্তন করে ভাষা বদলানোর ফাংশন
  const changeGoogleLanguage = (targetLang: "EN" | "BN") => {
    setLang(targetLang);
    const googleLangCode = targetLang === "BN" ? "/en/bn" : "/en/en";
    document.cookie = `googtrans=${googleLangCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${googleLangCode}; path=/`;
    window.location.reload();
  };

  useEffect(() => {
    const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
    if (match) {
      if (match[2].includes("bn")) {
        setLang("BN");
      } else {
        setLang("EN");
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();

    document.cookie =
      "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    setUser(null);
    window.location.replace("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const aiTemplateItems = [
    "Motivational",
    "Creative Shots",
    "Victory Day",
    "Photo restoration",
    "Wedding Photo",
    "Product Advertisement",
    "Baby and Kids",
    "Couple Portraits",
    "Father's Day",
    "Greeting card",
    "Birthday wishes",
    "Family photo",
  ];

  const printMediaItems = [
    "গণঅভ্যুত্থান",
    "গণঅভ্যুত্থান দিবস",
    "স্মারকগ্রন্থ",
    "ঈদ মোবারক পোষ্টার",
    "নোটিশ",
    "বিবাহ আমন্ত্রণ",
    "ভিজিটিং কার্ড",
    "লেটারহেড",
    "শহীদ স্মরণ",
    "শ্রদ্ধাঞ্জলি",
    "সার্টিফিকেট",
    "ধন্যবাদ কার্ড",
  ];

  const searchTips = [
    { key: "doc:", desc: "নথি বা টেমপ্লেট খুঁজুন" },
    { key: "img:", desc: "তৈরি ছবি খুঁজুন" },
    { key: "photo:", desc: "এআই ছবি এডিট" },
    { key: "manual:", desc: "ম্যানুয়াল ছবি এডিট" },
    { key: "ai:", desc: "এআই টেমপ্লেট বানাও" },
    { key: "profile:", desc: "প্রোফাইল ও সেটিংস" },
    { key: "credits:", desc: "ক্রেডিট ব্যালেন্স" },
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm sticky top-0 z-50 gap-2 w-full">
        {/* Left Section: Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#FF5D00] rounded-xl flex items-center justify-center font-black text-white text-base">
              SK
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black text-gray-900 tracking-tight">
                Sohoz<span className="text-[#FF5D00]">kaj</span>
              </span>
              <span className="text-[8px] tracking-wider text-gray-400 font-bold uppercase">
                www.sohozkaj.com
              </span>
            </div>
          </Link>
        </div>

        {/* Center Section: Navigation Links Centered (Desktop Only) */}
        <nav className="hidden xl:flex items-center justify-start 2xl:justify-center flex-1 min-w-0 gap-1 xl:gap-1.5 2xl:gap-2.5 text-[11px] xl:text-[11.5px] 2xl:text-[13px] font-semibold text-gray-700 mx-1">
          {/* My Files */}
          <Link
            href="/my-files"
            className="flex items-center gap-1 hover:text-[#FF5D00] transition-colors whitespace-nowrap shrink-0"
          >
            <FileText size={14} className="text-blue-500 shrink-0" />
            <span>My Files</span>
          </Link>

          {/* AI Editor */}
          <Link
            href="/ai-editor"
            className="flex items-center gap-1 hover:text-[#FF5D00] transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles size={14} className="text-orange-500 shrink-0" />
            <span>AI Editor</span>
          </Link>

          {/* Manual Editor */}
          <Link
            href="/manual-editor"
            className="flex items-center gap-1 hover:text-[#FF5D00] transition-colors whitespace-nowrap shrink-0"
          >
            <FileEdit size={14} className="text-blue-600 shrink-0" />
            <span>Manual Editor</span>
          </Link>

          {/* Bulk Photo Edit */}
          <div className="relative flex items-center gap-0.5 whitespace-nowrap shrink-0">
            <Link
              href="/bulk-photo-edit"
              className="flex items-center gap-1 hover:text-[#FF5D00] transition-colors"
            >
              <Copy size={14} className="text-emerald-500 shrink-0" />
              <span>Bulk Photo Edit</span>
            </Link>
            <span className="bg-amber-500 text-white text-[8px] font-bold px-1 py-0.2 rounded-full uppercase leading-tight">
              New
            </span>
          </div>

          {/* AI Template Dropdown */}
          <div
            className="relative py-1 whitespace-nowrap shrink-0"
            onMouseEnter={() => setAiTemplateOpen(true)}
            onMouseLeave={() => setAiTemplateOpen(false)}
          >
            <Link
              href="/ai-template"
              className="flex items-center gap-0.5 hover:text-[#FF5D00] cursor-pointer"
            >
              <LayoutGrid size={14} className="text-purple-500 shrink-0" />
              <span>AI Template</span>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${
                  aiTemplateOpen ? "rotate-180" : ""
                }`}
              />
            </Link>

            {aiTemplateOpen && (
              <div className="absolute top-full left-0 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-[100] text-xs font-medium">
                {aiTemplateItems.map((item, index) => (
                  <Link
                    key={index}
                    href="/ai-template"
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FF5D00] transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Question Papers Dropdown */}
          <div
            className="relative py-1 whitespace-nowrap shrink-0"
            onMouseEnter={() => setQuestionPaperOpen(true)}
            onMouseLeave={() => setQuestionPaperOpen(false)}
          >
            <div
              className={`relative flex items-center gap-0.5 cursor-pointer ${
                pathname?.startsWith("/questions-create")
                  ? "text-[#FF5D00]"
                  : "hover:text-[#FF5D00]"
              }`}
            >
              <FileText size={14} className="text-red-500 shrink-0" />
              <span>Question Papers</span>
              <span className="bg-amber-500 text-white text-[8px] font-bold px-1 py-0.2 rounded-full uppercase leading-tight">
                New
              </span>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${
                  questionPaperOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {questionPaperOpen && (
              <div className="absolute top-full left-0 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-[100] text-xs font-medium">
                <Link
                  href="/questions-create/create"
                  className={`block px-4 py-2.5 transition-colors font-semibold ${
                    pathname === "/questions-create/create"
                      ? "bg-orange-50 text-[#FF5D00]"
                      : "text-gray-700 hover:bg-orange-50 hover:text-[#FF5D00]"
                  }`}
                >
                  Create Question
                </Link>
                <Link
                  href="/questions-create/manual"
                  className={`block px-4 py-2.5 transition-colors font-semibold ${
                    pathname === "/questions-create/manual"
                      ? "bg-orange-50 text-[#FF5D00]"
                      : "text-gray-700 hover:bg-orange-50 hover:text-[#FF5D00]"
                  }`}
                >
                  Manual Question
                </Link>
              </div>
            )}
          </div>

          {/* Jobs Link */}
          <div className="relative flex items-center gap-0.5 whitespace-nowrap shrink-0">
            <Link
              href="/jobs"
              className={`flex items-center gap-1 transition-colors ${
                pathname === "/jobs" ? "text-[#FF5D00]" : "hover:text-[#FF5D00]"
              }`}
            >
              <Briefcase size={14} className="text-amber-500 shrink-0" />
              <span>Jobs</span>
            </Link>
            <span className="bg-amber-500 text-white text-[8px] font-bold px-1 py-0.2 rounded-full uppercase leading-tight">
              New
            </span>
          </div>

          {/* Print Media Dropdown */}
          <div
            className="relative py-1 whitespace-nowrap shrink-0"
            onMouseEnter={() => setPrintMediaOpen(true)}
            onMouseLeave={() => setPrintMediaOpen(false)}
          >
            <Link
              href="/print-media"
              className={`flex items-center gap-0.5 transition-colors ${
                pathname === "/print-media"
                  ? "text-[#FF5D00]"
                  : "hover:text-[#FF5D00] text-gray-700"
              }`}
            >
              <Printer size={14} className="text-orange-600 shrink-0" />
              <span>Print Media</span>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${
                  printMediaOpen ? "rotate-180" : ""
                }`}
              />
            </Link>

            {printMediaOpen && (
              <div className="absolute top-full left-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-[100] text-xs font-semibold">
                {printMediaItems.map((item, index) => (
                  <Link
                    key={index}
                    href="/print-media"
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FF5D00] transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* SohozTools Link */}
          <div className="relative flex items-center gap-0.5 whitespace-nowrap shrink-0">
            <Link
              href="/sohoj-tools"
              className="flex items-center gap-1 hover:text-[#FF5D00] cursor-pointer"
            >
              <ShoppingBag size={14} className="text-rose-500 shrink-0" />
              <span>SohozTools</span>
            </Link>
            <span className="bg-emerald-500 text-white text-[8px] font-bold px-1 py-0.2 rounded-full uppercase leading-tight">
              Free
            </span>
          </div>

          {/* All Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-1 text-gray-700 hover:text-[#FF5D00] cursor-pointer pl-1 whitespace-nowrap bg-transparent border-0 shrink-0"
          >
            <Menu size={14} className="shrink-0" />
            <span>All Menu</span>
          </button>
        </nav>

        {/* Right Section: Language Switcher + Credit Bonus Badge + Search Button + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Language Switcher */}
          <div className="hidden sm:inline-flex items-center bg-gray-100 p-0.5 rounded-md text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => changeGoogleLanguage("EN")}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                lang === "EN"
                  ? "bg-[#FF5D00] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => changeGoogleLanguage("BN")}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                lang === "BN"
                  ? "bg-[#FF5D00] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              বাং
            </button>
          </div>

          {/* Credit Bonus Link */}
          {showCreditBonus && (
            <Link
              href="/profile"
              className="hidden 2xl:flex items-center gap-1 bg-orange-50 border border-orange-200 hover:border-orange-300 rounded-full p-0.5 pl-1.5 text-xs transition-all cursor-pointer shrink-0"
            >
              <span className="w-4 h-4 rounded-full bg-orange-200 text-[#FF5D00] text-[10px] font-bold flex items-center justify-center">
                16
              </span>
              <span className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full transition-colors whitespace-nowrap">
                18 Credit Bonus
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreditBonus(false);
                }}
                className="text-gray-400 hover:text-gray-600 px-0.5"
              >
                <X size={11} />
              </button>
            </Link>
          )}

          {/* Search Trigger Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          {/* Profile Dropdown */}
          <div className="relative z-50 shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 border border-gray-200 rounded-2xl px-1.5 py-1 hover:bg-gray-50 transition-all text-left"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {getInitials(user?.fullName)}
              </div>
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-xs font-bold text-gray-800 truncate max-w-[80px] xl:max-w-[90px] 2xl:max-w-[110px]">
                  {user?.fullName || "User Account"}
                </span>
                <span className="text-[10px] text-gray-400 font-medium truncate max-w-[80px] xl:max-w-[90px] 2xl:max-w-[110px]">
                  {user?.phoneNumber || user?.email || "User"}
                </span>
              </div>
              <ChevronDown size={14} className="text-gray-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-[100] text-xs">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-bold text-gray-900">
                    {user?.fullName || "User Account"}
                  </p>
                  <p className="text-gray-400 truncate">
                    {user?.phoneNumber || user?.email || "User"}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserIcon size={14} /> My Profile
                </Link>
                <Link
                  href="/credit-usage"
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <CreditCard size={14} /> Credit Usage
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={14} /> Settings
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 text-left font-semibold transition-colors cursor-pointer"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile/Tablet Drawer Trigger Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="xl:hidden p-1.5 sm:p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer bg-white shrink-0"
            aria-label="Open Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsSearchOpen(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-10">
            <div className="flex items-center px-4 py-3 border-b border-gray-100 gap-3">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="পদ এবং ফিচার খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[10px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition-colors"
              >
                Esc
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Search Tips
              </p>
              <div className="space-y-1.5">
                {searchTips.map((tip, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSearchQuery(tip.key)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-[#FF5D00] text-xs text-gray-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-gray-100 group-hover:bg-orange-100 group-hover:text-[#FF5D00] px-2 py-0.5 rounded text-gray-600">
                        {tip.key}
                      </span>
                      <span>{tip.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>টুলস এবং ফিচার সার্চ করতে টাইপ করুন</span>
              <span className="flex items-center gap-1 font-mono">
                <Command size={10} /> K
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Drawer */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
