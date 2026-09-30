// app/dashboard/_components/DashboardNavbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

interface UserData {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

// "Upcoming" flag: sits in the empty space above the label, never on top of it
function UpcomingFlag() {
  return (
    <span className="pointer-events-none absolute right-0 top-1.5 rounded-full border border-red-200 bg-red-50 px-1.5 text-[10px] font-semibold leading-[14px] text-red-600">
      Upcoming
    </span>
  );
}

function ActiveBar() {
  return (
    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#2563EB]" />
  );
}

const itemBase =
  "flex items-center gap-1.5 rounded-lg px-1.5 2xl:px-2 py-1.5 whitespace-nowrap transition-colors";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  active?: boolean;
  upcoming?: boolean;
  tag?: { text: string; className: string };
}

function NavItem({
  href,
  label,
  icon: Icon,
  iconClass,
  active,
  upcoming,
  tag,
}: NavItemProps) {
  return (
    <div className="relative flex h-full shrink-0 items-center">
      {upcoming && <UpcomingFlag />}
      <Link
        href={href}
        className={`${itemBase} ${
          active
            ? "text-[#2563EB]"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon size={15} className={`${iconClass} shrink-0`} />
        <span>{label}</span>
        {tag && (
          <span
            className={`rounded-full px-1.5 text-[10px] font-semibold leading-[15px] text-white ${tag.className}`}
          >
            {tag.text}
          </span>
        )}
      </Link>
      {active && <ActiveBar />}
    </div>
  );
}

interface NavDropdownProps {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  items: string[];
  open: boolean;
  setOpen: (v: boolean) => void;
  active?: boolean;
  upcoming?: boolean;
  panelClass?: string;
}

function NavDropdown({
  href,
  label,
  icon: Icon,
  iconClass,
  items,
  open,
  setOpen,
  active,
  upcoming,
  panelClass = "w-52",
}: NavDropdownProps) {
  return (
    <div
      className="relative flex h-full shrink-0 items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {upcoming && <UpcomingFlag />}
      <Link
        href={href}
        aria-haspopup="true"
        aria-expanded={open}
        className={`${itemBase} ${
          active
            ? "text-[#2563EB]"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon size={15} className={`${iconClass} shrink-0`} />
        <span>{label}</span>
        <ChevronDown
          size={13}
          className={`-ml-0.5 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </Link>
      {active && <ActiveBar />}

      {open && (
        <div
          className={`absolute left-0 top-full z-[100] rounded-xl border border-slate-200 bg-white p-1.5 text-[13px] shadow-lg ${panelClass}`}
        >
          {items.map((item, index) => (
            <Link
              key={index}
              href={href}
              className="block rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {item}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

export default function DashboardNavbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // ভাষা পরিবর্তনের স্টেট (EN / BN)
  const [lang, setLang] = useState<"EN" | "BN">("EN");

  // Credit Bonus Visibility State
  const [showCreditBonus, setShowCreditBonus] = useState<boolean>(true);

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dropdown States
  const [aiTemplateOpen, setAiTemplateOpen] = useState<boolean>(false);
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
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // প্রোফাইল ড্রপডাউনের বাইরে ক্লিক করলে বন্ধ হবে
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

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

  const isActive = (prefix: string) =>
    pathname === prefix || !!pathname?.startsWith(prefix + "/");

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
    { key: "manual:", desc: "ম্যানুয়াল ছবি এডিট" },
    { key: "ai:", desc: "এআই টেমপ্লেট বানাও" },
    { key: "profile:", desc: "প্রোফাইল ও সেটিংস" },
    { key: "credits:", desc: "ক্রেডিট ব্যালেন্স" },
  ];

  const iconButton =
    "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800";

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#2563EB] text-[15px] font-extrabold text-white">
            SK
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[19px] font-extrabold tracking-tight text-[#0F172A]">
              Sohoz<span className="text-[#2563EB]">kaj</span>
            </span>
            <span className="mt-1 text-[10px] font-medium text-slate-400">
              www.sohozkaj.com
            </span>
          </div>
        </Link>

        {/* Center: Navigation (desktop only) */}
        <nav
          className="mx-2 hidden h-full min-w-0 flex-1 items-center justify-start text-[12px] font-medium xl:flex 2xl:justify-center 2xl:text-[13px]"
          aria-label="Main"
        >
          <NavItem
            href="/my-files"
            label="My Files"
            icon={FileText}
            iconClass="text-[#2563EB]"
            active={isActive("/my-files")}
          />
          <NavItem
            href="/ai-editor"
            label="AI Editor"
            icon={Sparkles}
            iconClass="text-[#2563EB]"
            active={isActive("/ai-editor")}
          />
          <NavItem
            href="/manual-editor"
            label="Manual Editor"
            icon={FileEdit}
            iconClass="text-[#2563EB]"
            active={isActive("/manual-editor")}
          />
          <NavItem
            href="/bulk-photo-edit"
            label="Bulk Photo Edit"
            icon={Copy}
            iconClass="text-[#10B981]"
            active={isActive("/bulk-photo-edit")}
            upcoming
          />
          <NavDropdown
            href="/ai-template"
            label="AI Template"
            icon={LayoutGrid}
            iconClass="text-purple-500"
            items={aiTemplateItems}
            open={aiTemplateOpen}
            setOpen={setAiTemplateOpen}
            active={isActive("/ai-template")}
            upcoming
            panelClass="w-52"
          />
          <NavItem
            href="/questions-create/create"
            label="Question Papers"
            icon={FileText}
            iconClass="text-red-500"
            active={isActive("/questions-create")}
            tag={{ text: "New", className: "bg-amber-500" }}
          />
          <NavItem
            href="/jobs"
            label="Jobs"
            icon={Briefcase}
            iconClass="text-amber-500"
            active={isActive("/jobs")}
            upcoming
          />
          <NavDropdown
            href="/print-media"
            label="Print Media"
            icon={Printer}
            iconClass="text-[#2563EB]"
            items={printMediaItems}
            open={printMediaOpen}
            setOpen={setPrintMediaOpen}
            active={isActive("/print-media")}
            upcoming
            panelClass="w-52"
          />
          <NavItem
            href="/sohoj-tools"
            label="SohozTools"
            icon={ShoppingBag}
            iconClass="text-rose-500"
            active={isActive("/sohoj-tools")}
            tag={{ text: "Free", className: "bg-[#10B981]" }}
          />

          {/* All Menu */}
          <div className="flex h-full shrink-0 items-center">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`${itemBase} cursor-pointer text-slate-700 hover:bg-slate-100 hover:text-slate-900`}
            >
              <Menu size={15} className="shrink-0" />
              <span>All Menu</span>
            </button>
          </div>
        </nav>

        {/* Right: language, credit bonus, search, profile, drawer */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Language switcher */}
          <div className="hidden shrink-0 items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold sm:inline-flex">
            <button
              type="button"
              onClick={() => changeGoogleLanguage("EN")}
              className={`cursor-pointer rounded-md px-2 py-1 transition-colors ${
                lang === "EN"
                  ? "bg-[#2563EB] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => changeGoogleLanguage("BN")}
              className={`cursor-pointer rounded-md px-2 py-1 transition-colors ${
                lang === "BN"
                  ? "bg-[#2563EB] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              বাং
            </button>
          </div>

          {/* Credit bonus */}
          {showCreditBonus && (
            <div className="hidden shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-0.5 pr-1.5 2xl:flex">
              <Link href="/profile" className="flex items-center gap-1.5">
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#2563EB] ring-1 ring-slate-200">
                  16
                </span>
                <span className="rounded-full bg-[#10B981] px-2.5 py-1 text-[11px] font-semibold leading-none text-white transition-colors hover:bg-[#059669]">
                  18 Credit Bonus
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setShowCreditBonus(false)}
                aria-label="Dismiss credit bonus"
                className="cursor-pointer rounded-full p-0.5 text-slate-400 transition-colors hover:text-slate-700"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className={iconButton}
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          {/* Profile */}
          <div className="relative z-50 shrink-0" ref={profileRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold uppercase text-white">
                {getInitials(user?.fullName)}
              </div>
              <div className="hidden flex-col leading-tight lg:flex xl:hidden 2xl:flex">
                <span className="max-w-[120px] truncate text-xs font-semibold text-[#0F172A]">
                  {user?.fullName || "User Account"}
                </span>
                <span className="max-w-[120px] truncate text-[11px] text-slate-400">
                  {user?.phoneNumber || user?.email || "User"}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-[100] mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 text-[13px] shadow-lg">
                <div className="mb-1 border-b border-slate-100 px-3 pb-2.5 pt-2">
                  <p className="font-semibold text-[#0F172A]">
                    {user?.fullName || "User Account"}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {user?.phoneNumber || user?.email || "User"}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <UserIcon size={15} className="text-slate-500" /> My Profile
                </Link>
                <Link
                  href="/credit-usage"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <CreditCard size={15} className="text-slate-500" /> Credit
                  Usage
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <Settings size={15} className="text-slate-500" /> Settings
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile / tablet drawer trigger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`${iconButton} xl:hidden`}
            aria-label="Open Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsSearchOpen(false)}
          ></div>
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="পদ এবং ফিচার খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="cursor-pointer rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Esc
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3">
              <p className="mb-1.5 px-2 text-xs font-medium text-slate-400">
                Search tips
              </p>
              <div className="space-y-0.5">
                {searchTips.map((tip, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSearchQuery(tip.key)}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <span className="min-w-[68px] rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 group-hover:bg-[#2563EB] group-hover:text-white">
                      {tip.key}
                    </span>
                    <span>{tip.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
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
