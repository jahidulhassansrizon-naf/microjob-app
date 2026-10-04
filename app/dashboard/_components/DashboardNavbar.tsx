// app/dashboard/_components/DashboardNavbar.tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen,
  SlidersHorizontal,
  PenTool,
  Layers,
  LayoutGrid,
  FileText,
  Printer,
  Wrench,
  ChevronDown,
  Search,
  Menu,
  MoreHorizontal,
  LogOut,
  User as UserIcon,
  Settings,
  CreditCard,
  Command,
  type LucideIcon,
} from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { getSlug, toolsData } from "@/app/_components/toolsData";

interface UserData {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
}

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// প্রতিটা icon-এর জন্য একই ঘরানার (হালকা background + গাঢ় icon) রঙের জোড়া
const TONES = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  pink: "bg-pink-50 text-pink-600 ring-pink-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  cyan: "bg-cyan-50 text-cyan-600 ring-cyan-100",
  orange: "bg-orange-50 text-orange-600 ring-orange-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

type Tone = keyof typeof TONES;

interface NavConfig {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  match: string; // active অবস্থা চেনার path prefix
  upcoming?: boolean;
  tag?: { text: string; className: string };
  menu?: string[];
}

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

const NAV_ITEMS: NavConfig[] = [
  {
    id: "my-files",
    href: "/my-files",
    label: "My Files",
    icon: FolderOpen,
    tone: "blue",
    match: "/my-files",
  },
  {
    id: "ai-editor",
    href: "/ai-editor",
    label: "AI Editor",
    icon: SlidersHorizontal,
    tone: "violet",
    match: "/ai-editor",
  },
  {
    id: "manual-editor",
    href: "/manual-editor",
    label: "Manual Editor",
    icon: PenTool,
    tone: "pink",
    match: "/manual-editor",
  },
  {
    id: "bulk-photo-edit",
    href: "/bulk-photo-edit",
    label: "Bulk Photo Edit",
    icon: Layers,
    tone: "emerald",
    match: "/bulk-photo-edit",
  },
  {
    id: "ai-template",
    href: "/ai-template",
    label: "AI Template",
    icon: LayoutGrid,
    tone: "indigo",
    match: "/ai-template",
    menu: aiTemplateItems,
  },
  {
    id: "question-papers",
    href: "/questions-create/create",
    label: "Question Papers",
    icon: FileText,
    tone: "red",
    match: "/questions-create",
    tag: {
      text: "New",
      className: "bg-blue-50 text-[#1D4ED8] ring-1 ring-inset ring-blue-100",
    },
  },
  {
    id: "print-media",
    href: "/print-media",
    label: "Print Media",
    icon: Printer,
    tone: "cyan",
    match: "/print-media",
    upcoming: true,
    menu: printMediaItems,
  },
  {
    id: "sohoj-tools",
    href: "/sohoj-tools",
    label: "SohozTools",
    icon: Wrench,
    tone: "orange",
    match: "/sohoj-tools",
    tag: {
      text: "Free",
      className:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    },
  },
];

// nav item-এর মাঝের ফাঁক (px) — gap-0.5 = 2px
const NAV_GAP = 2;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function IconTile({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span
      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md ring-1 ring-inset ${TONES[tone]}`}
    >
      <Icon size={13} strokeWidth={2.1} />
    </span>
  );
}

// "Upcoming" flag: label-এর উপরের খালি জায়গায় বসে, লেখার উপর নয়
function UpcomingFlag() {
  return (
    <span className="pointer-events-none absolute right-0 top-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-semibold leading-[14px] text-slate-600">
      Upcoming
    </span>
  );
}

const itemBase =
  "group flex items-center gap-1.5 rounded-lg px-1.5 2xl:px-2 py-1.5 whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";

const itemActive = "bg-blue-50 text-[#1D4ED8]";
const itemIdle = "text-slate-800 hover:bg-slate-100 hover:text-slate-950";

// Item-এর ভেতরের অংশ (icon + লেখা + ট্যাগ + তীর)। আসল item আর মাপার জন্য
// লুকানো কপি দুটোতেই একই জিনিস ব্যবহার হয়, তাই মাপ সবসময় মিলে যায়।
function NavLabel({ item, open }: { item: NavConfig; open?: boolean }) {
  return (
    <>
      <IconTile icon={item.icon} tone={item.tone} />
      <span>{item.label}</span>

      {item.tag && (
        <span
          className={`rounded-full px-1.5 text-[10px] font-semibold leading-[15px] ${item.tag.className}`}
        >
          {item.tag.text}
        </span>
      )}

      {item.menu && (
        <ChevronDown
          size={13}
          className={`-ml-0.5 transition-transform duration-200 ${
            open ? "rotate-180 text-[#1D4ED8]" : "text-slate-500"
          }`}
        />
      )}
    </>
  );
}

function NavItem({ item, active }: { item: NavConfig; active: boolean }) {
  return (
    <div className="relative flex h-full shrink-0 items-center">
      {item.upcoming && <UpcomingFlag />}

      <Link
        href={item.href}
        className={`${itemBase} ${active ? itemActive : itemIdle}`}
      >
        <NavLabel item={item} />
      </Link>
    </div>
  );
}

function NavDropdown({
  item,
  open,
  setOpen,
  active,
}: {
  item: NavConfig;
  open: boolean;
  setOpen: (v: boolean) => void;
  active: boolean;
}) {
  return (
    <div
      className="relative flex h-full shrink-0 items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {item.upcoming && <UpcomingFlag />}

      <Link
        href={item.href}
        aria-haspopup="true"
        aria-expanded={open}
        className={`${itemBase} ${active || open ? itemActive : itemIdle}`}
      >
        <NavLabel item={item} open={open} />
      </Link>

      {open && item.menu && (
        <div className="absolute left-0 top-full z-[100] w-52 rounded-xl border border-slate-200/80 bg-white p-1.5 text-[13px] font-medium shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] animate-in fade-in duration-150">
          {item.menu.map((entry, index) => (
            <Link
              key={index}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              {entry}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// জায়গা কম হলে যে item গুলো navbar-এ ধরে না, সেগুলো এখানে জমা হয়
function MoreMenu({
  items,
  open,
  setOpen,
  active,
  isActive,
}: {
  items: NavConfig[];
  open: boolean;
  setOpen: (v: boolean) => void;
  active: boolean;
  isActive: (prefix: string) => boolean;
}) {
  return (
    <div
      className="relative flex h-full shrink-0 items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`${itemBase} cursor-pointer ${
          active || open ? itemActive : itemIdle
        }`}
      >
        <IconTile icon={MoreHorizontal} tone="slate" />
        <span>More</span>

        <ChevronDown
          size={13}
          className={`-ml-0.5 transition-transform duration-200 ${
            open ? "rotate-180 text-[#1D4ED8]" : "text-slate-500"
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[100] w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200/80 bg-white p-1.5 text-[13px] font-medium shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] animate-in fade-in duration-150">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                isActive(item.match)
                  ? "bg-blue-50 text-[#1D4ED8]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <IconTile icon={item.icon} tone={item.tone} />

              <span className="flex-1">{item.label}</span>

              {item.upcoming && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-semibold leading-[14px] text-slate-500">
                  Upcoming
                </span>
              )}

              {item.tag && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold leading-[15px] ${item.tag.className}`}
                >
                  {item.tag.text}
                </span>
              )}
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

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Nav dropdown states
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState<boolean>(false);

  // Responsive nav: কয়টা item ধরবে সেটা মেপে ঠিক হয়
  const navRef = useRef<HTMLElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  const [visibleCount, setVisibleCount] = useState<number>(NAV_ITEMS.length);
  const [navReady, setNavReady] = useState<boolean>(false);

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

  // স্ক্রিনের মাপ বা zoom বদলালে কয়টা item ধরবে তা নতুন করে হিসাব করে
  useIsoLayoutEffect(() => {
    const nav = navRef.current;
    const ghost = ghostRef.current;

    if (!nav || !ghost) return;

    const measure = () => {
      const available = nav.clientWidth - 4;

      if (available <= 0) return; // এই screen-এ nav লুকানো (মোবাইল/ট্যাবলেট)

      const widths = (Array.from(ghost.children) as HTMLElement[]).map(
        (el) => el.offsetWidth,
      );

      const allMenuW = widths[widths.length - 1];
      const moreW = widths[widths.length - 2];
      const itemWidths = widths.slice(0, NAV_ITEMS.length);

      const total =
        itemWidths.reduce((sum, w) => sum + w + NAV_GAP, 0) + allMenuW;

      let count = NAV_ITEMS.length;

      if (total > available) {
        let used = allMenuW + moreW + NAV_GAP;

        count = 0;

        for (const w of itemWidths) {
          if (used + w + NAV_GAP > available) break;

          used += w + NAV_GAP;
          count += 1;
        }
      }

      setVisibleCount(count);
      setNavReady(true);
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(nav);
    observer.observe(ghost);

    document.fonts?.ready.then(measure);

    return () => observer.disconnect();
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
        setOpenMenu(null);
        setMoreOpen(false);
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

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isActive = (prefix: string) =>
    pathname === prefix || !!pathname?.startsWith(prefix + "/");

  const visibleItems = NAV_ITEMS.slice(0, visibleCount);
  const hiddenItems = NAV_ITEMS.slice(visibleCount);

  /* ---------------------------------------------------------------- */
  /* Search                                                            */
  /* ---------------------------------------------------------------- */

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchResults = normalizedSearch
    ? toolsData
        .filter((tool) => {
          const haystack = [tool.name, tool.category, tool.badge ?? "", tool.id]
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedSearch);
        })
        .slice(0, 8)
    : [];

  const menuSetter = (id: string) => (v: boolean) =>
    setOpenMenu((cur) => (v ? id : cur === id ? null : cur));

  const iconButton =
    "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";

  const profileLinkClass =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950";

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between gap-2 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
        {/* Left: Logo */}
        <Link
          href="/dashboard"
          className="flex min-w-0 shrink items-center gap-2.5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#2563EB] text-[15px] font-extrabold text-white shadow-sm ring-1 ring-inset ring-white/20">
            SK
          </div>

          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[17px] font-extrabold tracking-tight text-[#0F172A] sm:text-[19px]">
              Sohoz<span className="text-[#2563EB]">kaj</span>
            </span>

            <span className="mt-1 hidden text-[10px] font-medium text-slate-500 sm:block">
              www.sohozkaj.com
            </span>
          </div>
        </Link>

        {/* Center: Navigation */}
        <nav
          ref={navRef}
          aria-label="Main"
          className={`relative mx-1 hidden h-full min-w-0 flex-1 items-center justify-center gap-0.5 text-[13px] font-medium transition-opacity duration-150 lg:flex 2xl:text-[13.5px] 2xl:font-semibold ${
            navReady ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* মাপার জন্য লুকানো কপি */}
          <div
            aria-hidden="true"
            className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
          >
            <div ref={ghostRef} className="flex w-max items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <div key={item.id} className="flex shrink-0 items-center">
                  <div className={itemBase}>
                    <NavLabel item={item} />
                  </div>
                </div>
              ))}

              <div className="flex shrink-0 items-center">
                <div className={itemBase}>
                  <IconTile icon={MoreHorizontal} tone="slate" />
                  <span>More</span>
                  <ChevronDown size={13} className="-ml-0.5" />
                </div>
              </div>

              <div className="flex shrink-0 items-center">
                <div className={itemBase}>
                  <IconTile icon={Menu} tone="slate" />
                  <span>All Menu</span>
                </div>
              </div>
            </div>
          </div>

          {visibleItems.map((item) =>
            item.menu ? (
              <NavDropdown
                key={item.id}
                item={item}
                open={openMenu === item.id}
                setOpen={menuSetter(item.id)}
                active={isActive(item.match)}
              />
            ) : (
              <NavItem
                key={item.id}
                item={item}
                active={isActive(item.match)}
              />
            ),
          )}

          {hiddenItems.length > 0 && (
            <MoreMenu
              items={hiddenItems}
              open={moreOpen}
              setOpen={setMoreOpen}
              active={hiddenItems.some((item) => isActive(item.match))}
              isActive={isActive}
            />
          )}

          {/* All Menu */}
          <div className="flex h-full shrink-0 items-center">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`${itemBase} ${itemIdle} cursor-pointer`}
            >
              <IconTile icon={Menu} tone="slate" />
              <span>All Menu</span>
            </button>
          </div>
        </nav>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Language switcher */}
          <div className="hidden shrink-0 items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold sm:inline-flex">
            <button
              type="button"
              onClick={() => changeGoogleLanguage("EN")}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                lang === "EN"
                  ? "bg-white text-[#1D4ED8] shadow-sm ring-1 ring-slate-200/70"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              EN
            </button>

            <button
              type="button"
              onClick={() => changeGoogleLanguage("BN")}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                lang === "BN"
                  ? "bg-white text-[#1D4ED8] shadow-sm ring-1 ring-slate-200/70"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              বাং
            </button>
          </div>

          {/* Search */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className={iconButton}
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          {/* Profile */}
          <div className="relative z-50 shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-1 text-left outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 sm:pr-2"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold uppercase text-white">
                {getInitials(user?.fullName)}
              </div>

              <div className="hidden flex-col leading-tight 2xl:flex">
                <span className="max-w-[120px] truncate text-xs font-semibold text-[#0F172A]">
                  {user?.fullName || "User Account"}
                </span>

                <span className="max-w-[120px] truncate text-[11px] text-slate-500">
                  {user?.phoneNumber || user?.email || "User"}
                </span>
              </div>

              <ChevronDown
                size={14}
                className={`hidden shrink-0 text-slate-500 transition-transform duration-200 sm:block ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-[100] mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200/80 bg-white p-1.5 text-[13px] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] animate-in fade-in duration-150">
                <div className="mb-1 border-b border-slate-100 px-3 pb-2.5 pt-2">
                  <p className="truncate font-semibold text-[#0F172A]">
                    {user?.fullName || "User Account"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {user?.phoneNumber || user?.email || "User"}
                  </p>
                </div>

                <Link href="/profile" className={profileLinkClass}>
                  <UserIcon size={15} className="text-slate-500" />
                  My Profile
                </Link>

                <Link href="/subscription" className={profileLinkClass}>
                  <CreditCard size={15} className="text-slate-500" />
                  Subscription
                </Link>

                <Link href="/settings" className={profileLinkClass}>
                  <Settings size={15} className="text-slate-500" />
                  Settings
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile / tablet drawer trigger */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className={`${iconButton} lg:hidden`}
            aria-label="Open Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-900/40 px-4 pt-[14vh] backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
          />

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Search size={18} className="shrink-0 text-[#2563EB]" />

              <input
                type="text"
                autoFocus
                placeholder="Search tools and features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 bg-transparent text-[15px] font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Esc
              </button>
            </div>

            {/* Results / Empty state */}
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {!normalizedSearch ? (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                    <Search size={20} />
                  </span>

                  <p className="mt-4 text-sm font-black text-[#0F172A]">
                    Search tools and features
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Start typing to find what you need.
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((tool) => {
                    const ToolIcon = tool.icon;
                    const isPaid = tool.access === "paid";

                    return (
                      <Link
                        key={tool.id}
                        href={`/sohoj-tools/${getSlug(tool.name)}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tool.bgColor}`}
                        >
                          {ToolIcon && (
                            <ToolIcon
                              size={24}
                              className="text-white stroke-[1.75]"
                            />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-[#0F172A]">
                            {tool.name}
                          </span>

                          <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                            {tool.category} Tool
                          </span>
                        </span>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                            isPaid
                              ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          }`}
                        >
                          {isPaid ? "Paid" : "Free"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
                    <Search size={20} />
                  </span>

                  <p className="mt-4 text-sm font-black text-[#0F172A]">
                    No matching tools
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Try a different tool name or category.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold text-slate-400">
              <span>Press Esc to close</span>

              <span className="flex shrink-0 items-center gap-1 font-mono">
                <Command size={10} />K
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

// git status
// git add .
// git commit -m "ja mon chaise tai korsi"
// git push origin main
