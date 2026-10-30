"use client";

import SiteBrandLogo from "@/app/_components/SiteBrandLogo";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Gift,
  ArrowRight,
  Image as ImageIcon,
  Type,
  Video,
  Wrench,
} from "lucide-react";
import { useI18n, T } from "@/components/i18n/I18nProvider";

/* ----------------------------- Data ----------------------------- */

// Our Services
const serviceItems = [
  {
    label: "AI Photo Edit",
    icon: Sparkles,
    href: "/login?redirect=/ai-editor",
  },
  {
    label: "Manual Photo Edit",
    icon: Edit3,
    href: "/login?redirect=/manual-editor",
  },
  {
    label: "Bulk Photo Edit",
    icon: Copy,
    href: "/login?redirect=/bulk-photo-edit",
  },
  {
    label: "AI Template",
    icon: FileCode,
    href: "/login?redirect=/ai-template",
  },
  { label: "Print Media", icon: Printer, href: "/login?redirect=/print-media" },
  {
    label: "Questions Create",
    icon: HelpCircle,
    href: "/login?redirect=/questions-create/create",
  },
];

// Seba Lagbe Tools mega menu
const sebaLagbeToolsCategories = [
  {
    title: "PDF Tools",
    count: "15 tools",
    icon: FileText,
    accent: "bg-rose-50 text-rose-600",
    tools: [
      { name: "Compress PDF", href: "/login?redirect=/sohoj-tools" },
      { name: "Merge PDFs", href: "/login?redirect=/sohoj-tools" },
      { name: "Create PDF", href: "/login?redirect=/sohoj-tools" },
      { name: "Split PDF", href: "/login?redirect=/sohoj-tools" },
      { name: "PDF to Image", href: "/login?redirect=/sohoj-tools" },
      { name: "Lock / Unlock PDF", href: "/login?redirect=/sohoj-tools" },
    ],
    moreText: "+9 more",
  },
  {
    title: "Image Tools",
    count: "18 tools",
    icon: ImageIcon,
    accent: "bg-emerald-50 text-emerald-600",
    tools: [
      { name: "Image Size Reducer", href: "/login?redirect=/sohoj-tools" },
      { name: "NID to PDF", href: "/login?redirect=/sohoj-tools" },
      { name: "Remove Background", href: "/login?redirect=/sohoj-tools" },
      {
        name: "Govt Job Photo & Sign Resizer",
        href: "/login?redirect=/sohoj-tools",
      },
      { name: "Passport to PDF", href: "/login?redirect=/sohoj-tools" },
      { name: "Image Convert", href: "/login?redirect=/sohoj-tools" },
    ],
    moreText: "+12 more",
  },
  {
    title: "Text Tools",
    count: "6 tools",
    icon: Type,
    accent: "bg-amber-50 text-amber-600",
    tools: [
      { name: "Bijoy ↔ Unicode", href: "/login?redirect=/sohoj-tools" },
      { name: "Banglish Typing", href: "/login?redirect=/sohoj-tools" },
      { name: "Number to Words", href: "/login?redirect=/sohoj-tools" },
      { name: "Image to Text", href: "/login?redirect=/sohoj-tools" },
      { name: "Text Analyzer", href: "/login?redirect=/sohoj-tools" },
      { name: "Date Format Converter", href: "/login?redirect=/sohoj-tools" },
    ],
  },
  {
    title: "Video Tools",
    count: "10 tools",
    icon: Video,
    accent: "bg-violet-50 text-violet-600",
    tools: [
      { name: "Compress Video", href: "/login?redirect=/sohoj-tools" },
      { name: "Trim/Cut Video", href: "/login?redirect=/sohoj-tools" },
      { name: "Merge Videos", href: "/login?redirect=/sohoj-tools" },
      { name: "Video to Audio", href: "/login?redirect=/sohoj-tools" },
      { name: "Add Watermark", href: "/login?redirect=/sohoj-tools" },
      { name: "Audio Volume Booster", href: "/login?redirect=/sohoj-tools" },
    ],
    moreText: "+4 more",
  },
  {
    title: "General Tools",
    count: "5 tools",
    icon: Wrench,
    accent: "bg-sky-50 text-sky-600",
    tools: [
      { name: "Family Card Form", href: "/login?redirect=/sohoj-tools" },
      { name: "Fuel Card Form", href: "/login?redirect=/sohoj-tools" },
      { name: "ATS Friendly CV Maker", href: "/login?redirect=/sohoj-tools" },
      { name: "Age Calculator", href: "/login?redirect=/sohoj-tools" },
      { name: "EMI Calculator", href: "/login?redirect=/sohoj-tools" },
    ],
  },
];

// Important Links
const importantLinksItems = [
  {
    title: "Govt Websites & Links",
    subtitle: "National essential services",
    count: "14",
    countBg: "bg-blue-100/80 text-blue-600",
    href: "/dorkar-link?category=govt",
  },
  {
    title: "Visa & International",
    subtitle: "Visa, passport & expat services",
    count: "15",
    countBg: "bg-sky-100/80 text-sky-600",
    href: "/dorkar-link?category=visa",
  },
  {
    title: "Other Links",
    subtitle: "Results & other useful sites",
    count: "12",
    countBg: "bg-indigo-100/80 text-indigo-600",
    href: "/dorkar-link?category=other",
  },
  {
    title: "Contest",
    subtitle: "Use Seba Lagbe & win prizes!",
    isNew: true,
    isFeatured: true,
  },
  {
    title: "Contact",
    subtitle: "Get in touch with us",
    href: "/contact",
  },
];

// Pages where the navbar must NOT render
const hiddenExact = [
  "/login",
  "/register",
  "/my-files",
  "/ai-editor",
  "/subscription",
  "/settings",
  "/income-expenses",
  "/customers-invoices",
];
const hiddenPrefixes = [
  "/dashboard",
  "/manual-editor",
  "/bulk-photo-edit",
  "/ai-template",
  "/questions-create",
  "/jobs",
  "/print-media",
  "/sohoj-tools",
  "/profile",
  "/tutorial-video",
  "/whatsapp-support",
  "/free-tools",
  "/income-expenses/",
  "/customers-invoices/",
];

/* --------------------------- Small helpers --------------------------- */

const navTrigger = (active: boolean) =>
  `relative flex h-9 items-center gap-1 rounded-full px-3.5 text-[14px] font-semibold transition-colors cursor-pointer ${
    active
      ? "bg-blue-50 text-blue-700"
      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
  }`;

const Chevron = ({ open }: { open: boolean }) => (
  <ChevronDown
    size={14}
    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
  />
);

function LanguageToggle({
  layoutId,
  className = "",
  size = "md",
}: {
  layoutId: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const { locale, setLocale } = useI18n();
  const options = [
    { code: "bn" as const, label: "বাং" },
    { code: "en" as const, label: "EN" },
  ];
  return (
    <div
      className={`relative items-center rounded-full border border-slate-200 bg-slate-100/80 p-0.5 text-[11px] font-bold ${className}`}
    >
      {options.map((o) => {
        const active = locale === o.code;
        return (
          <button
            key={o.code}
            onClick={() => setLocale(o.code)}
            className={`relative z-10 cursor-pointer rounded-full transition-colors ${
              size === "lg" ? "px-4 py-1.5" : "px-3 py-1"
            } ${active ? "text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <T>{o.label}</T>
          </button>
        );
      })}
    </div>
  );
}

function MobileAccordion({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border transition-colors ${
        open ? "border-blue-100 bg-blue-50/30" : "border-slate-100 bg-white"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-slate-800"
      >
        <span>
          <T>{label}</T>
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            open ? "rotate-180 text-blue-600" : "text-slate-400"
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ Navbar ------------------------------ */

export default function Navbar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isImportantOpen, setIsImportantOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileImportantOpen, setMobileImportantOpen] = useState(false);

  // Shrink + add shadow after scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsServicesOpen(false);
    setIsToolsOpen(false);
    setIsImportantOpen(false);
  }, [pathname]);

  // Lock page scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  if (
    hiddenExact.includes(pathname) ||
    hiddenPrefixes.some((p) => pathname.startsWith(p))
  ) {
    return null;
  }

  const toolsActive = pathname.startsWith("/tools");
  const importantActive = pathname.startsWith("/dorkar-link");

  return (
    <>
      {/* ============ Top Navbar ============ */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-[999] w-full border-b transition-all duration-300 ${
          scrolled
            ? "border-slate-200/70 bg-white/85 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.18)] backdrop-blur-xl"
            : "border-transparent bg-white/70 backdrop-blur-md"
        }`}
      >
        <div
          className={`relative mx-auto flex max-w-[1400px] items-center justify-between px-4 transition-all duration-300 sm:px-6 md:px-12 ${
            scrolled ? "h-14 md:h-16" : "h-16 md:h-[76px]"
          }`}
        >
          {/* Left: Logo */}
          <Link href="/" className="flex items-center">
            <SiteBrandLogo width={140} height={45} className="h-[45px] w-auto" />
          </Link>

          {/* Center: Navigation (Desktop) */}
          <nav className="hidden h-full items-center gap-1 lg:flex">
            {/* Our Services */}
            <div
              className="relative flex h-full items-center"
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                className={navTrigger(isServicesOpen)}
              >
                <T>{"Our Services"}</T>
                <Chevron open={isServicesOpen} />
              </button>

              <AnimatePresence>
                {isServicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: 6, x: "-50%" }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute left-1/2 top-full z-[1000] pt-2"
                  >
                    <div className="w-64 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xl shadow-slate-900/10">
                      {serviceItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={index}
                            href={item.href}
                            onClick={() => setIsServicesOpen(false)}
                            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-blue-600 group-hover:text-white">
                              <Icon size={16} />
                            </span>
                            <span>
                              <T>{item.label}</T>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Seba Lagbe Tools Mega Menu (positioned against the header, not the trigger) */}
            <div
              className="flex h-full items-center"
              onMouseEnter={() => setIsToolsOpen(true)}
              onMouseLeave={() => setIsToolsOpen(false)}
            >
              <Link
                href="/tools"
                onClick={() => setIsToolsOpen(false)}
                className={navTrigger(isToolsOpen || toolsActive)}
              >
                <T>{"All Tools"}</T>
                <Chevron open={isToolsOpen} />
              </Link>

              <AnimatePresence>
                {isToolsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: 6, x: "-50%" }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-1/2 top-full z-[1000] pt-2"
                  >
                    <div className="w-[min(1100px,calc(100vw-3rem))] rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/10">
                      <div className="grid grid-cols-3 gap-5 xl:grid-cols-5">
                        {sebaLagbeToolsCategories.map((cat, idx) => {
                          const CatIcon = cat.icon;
                          return (
                            <div key={idx} className="flex flex-col gap-3">
                              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                                <span
                                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.accent}`}
                                >
                                  <CatIcon size={18} />
                                </span>
                                <div className="flex flex-col leading-tight">
                                  <span className="text-[13px] font-bold text-slate-900">
                                    <T>{cat.title}</T>
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    <T>{cat.count}</T>
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                {cat.tools.map((tool, tIdx) => (
                                  <Link
                                    key={tIdx}
                                    href={tool.href}
                                    onClick={() => setIsToolsOpen(false)}
                                    className="truncate rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-blue-50 hover:pl-3.5 hover:text-blue-700"
                                  >
                                    <T>{tool.name}</T>
                                  </Link>
                                ))}
                                {cat.moreText && (
                                  <Link
                                    href="/login?redirect=/sohoj-tools"
                                    onClick={() => setIsToolsOpen(false)}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[12px] font-bold text-blue-600 hover:underline"
                                  >
                                    <T>{cat.moreText}</T>
                                    <ArrowRight size={12} />
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-5 py-3">
                        <p className="text-xs font-semibold text-slate-600">
                          <T>{"30+ smart tools, one simple place."}</T>
                        </p>
                        <Link
                          href="/login?redirect=/sohoj-tools"
                          onClick={() => setIsToolsOpen(false)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          <T>{"View all tools"}</T>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Important Links */}
            <div
              className="relative flex h-full items-center"
              onMouseEnter={() => setIsImportantOpen(true)}
              onMouseLeave={() => setIsImportantOpen(false)}
            >
              <Link
                href="/dorkar-link"
                onClick={() => setIsImportantOpen(false)}
                className={navTrigger(isImportantOpen || importantActive)}
              >
                <T>{"Important Links"}</T>
                <Chevron open={isImportantOpen} />
              </Link>

              <AnimatePresence>
                {isImportantOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: 6, x: "-50%" }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute left-1/2 top-full z-[1000] pt-2"
                  >
                    <div className="flex w-[22rem] flex-col gap-0.5 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xl shadow-slate-900/10">
                      {importantLinksItems.map((item, index) => {
                        const isExternal =
                          !!item.href && item.href.startsWith("http");
                        const ext = {
                          target: isExternal ? "_blank" : undefined,
                          rel: isExternal ? "noopener noreferrer" : undefined,
                        };

                        if (item.isFeatured) {
                          return (
                            <div
                              key={index}
                              className="group my-1 flex items-center justify-between rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25">
                                  <Gift size={17} />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-bold text-slate-900">
                                      <T>{item.title}</T>
                                    </span>
                                    {item.isNew && (
                                      <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                                        <T>{"NEW"}</T>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-500">
                                    <T>{item.subtitle}</T>
                                  </span>
                                </div>
                              </div>
                              <ArrowRight
                                size={15}
                                className="shrink-0 text-blue-600 transition-transform group-hover:translate-x-0.5"
                              />
                            </div>
                          );
                        }

                        if (!item.href) return null;

                        return (
                          <Link
                            key={index}
                            href={item.href}
                            {...ext}
                            onClick={() => setIsImportantOpen(false)}
                            className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                          >
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-slate-800 group-hover:text-blue-700">
                                <T>{item.title}</T>
                              </span>
                              <span className="text-[11px] font-medium text-slate-400">
                                <T>{item.subtitle}</T>
                              </span>
                            </div>
                            {item.count && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  item.countBg || "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {item.count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/pricing"
              className={navTrigger(pathname.startsWith("/pricing"))}
            >
              <T>{"Package"}</T>
            </Link>

            <Link
              href="/reviews"
              className={`${navTrigger(pathname.startsWith("/reviews"))} gap-1`}
            >
              <span>
                <T>{"5"}</T>
              </span>
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>
                <T>{"Review"}</T>
              </span>
            </Link>
          </nav>

          {/* Right: Language, Login, Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageToggle
              layoutId="lang-pill-desktop"
              className="hidden sm:flex"
            />

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 sm:gap-2 sm:px-6 sm:text-[14px]"
              >
                <LogIn size={16} strokeWidth={2.2} />
                <T>{"Login"}</T>
              </Link>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(true)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50 lg:hidden"
              aria-label={t("Open Mobile Menu")}
            >
              <Menu size={20} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ============ Mobile Drawer ============ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[1100] flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="relative z-10 ml-auto flex h-full w-full max-w-xs flex-col bg-white shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <SiteBrandLogo width={140} height={45} className="h-[40px] w-auto" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                  aria-label={t("Close Mobile Menu")}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
                <MobileAccordion
                  label="Our Services"
                  open={mobileServicesOpen}
                  onToggle={() => setMobileServicesOpen(!mobileServicesOpen)}
                >
                  <div className="flex flex-col gap-0.5">
                    {serviceItems.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium text-slate-600 hover:text-blue-600"
                        >
                          <Icon size={15} className="text-slate-400" />
                          <span>
                            <T>{item.label}</T>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </MobileAccordion>

                <MobileAccordion
                  label="All Tools"
                  open={mobileToolsOpen}
                  onToggle={() => setMobileToolsOpen(!mobileToolsOpen)}
                >
                  <Link
                    href="/tools"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600"
                  >
                    <T>{"View All Tools"}</T>
                    <ArrowRight size={12} />
                  </Link>
                  <div className="flex flex-col gap-3">
                    {sebaLagbeToolsCategories.map((cat, cIdx) => {
                      const CatIcon = cat.icon;
                      return (
                        <div key={cIdx} className="flex flex-col gap-0.5">
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-md ${cat.accent}`}
                            >
                              <CatIcon size={13} />
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">
                              <T>{cat.title}</T>
                            </span>
                          </div>
                          {cat.tools.map((t, tIdx) => (
                            <Link
                              key={tIdx}
                              href={t.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="py-1 pl-8 text-xs text-slate-600 hover:text-blue-600"
                            >
                              <T>{t.name}</T>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </MobileAccordion>

                <MobileAccordion
                  label="Important Links"
                  open={mobileImportantOpen}
                  onToggle={() => setMobileImportantOpen(!mobileImportantOpen)}
                >
                  <div className="flex flex-col gap-0.5">
                    {importantLinksItems.map((imp, iIdx) => {
                      const isExternal =
                        !!imp.href && imp.href.startsWith("http");
                      if (!imp.href) {
                        return (
                          <div
                            key={iIdx}
                            className="flex items-center justify-between py-2 text-[13px] font-medium text-slate-600"
                          >
                            <span>
                              <T>{imp.title}</T>
                            </span>
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={iIdx}
                          href={imp.href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between py-2 text-[13px] font-medium text-slate-600 hover:text-blue-600"
                        >
                          <span>
                            <T>{imp.title}</T>
                          </span>
                          {imp.count && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                imp.countBg || "bg-slate-100"
                              }`}
                            >
                              {imp.count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </MobileAccordion>

                <Link
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-2xl border border-slate-100 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-100 hover:text-blue-600"
                >
                  <T>{"Package"}</T>
                </Link>
                <Link
                  href="/reviews"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 rounded-2xl border border-slate-100 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-100 hover:text-blue-600"
                >
                  <span>
                    <T>{"Review"}</T>
                  </span>
                  <span className="flex items-center gap-0.5 text-slate-500">
                    (5
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    )
                  </span>
                </Link>
              </div>

              {/* Drawer Footer: Language (only where header toggle is hidden) */}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:hidden">
                <span className="text-xs font-bold text-slate-500">
                  <T>{"Language"}</T>
                </span>
                <LanguageToggle
                  layoutId="lang-pill-mobile"
                  size="lg"
                  className="flex"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
