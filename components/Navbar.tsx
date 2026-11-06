"use client";

import SiteBrandLogo from "@/app/_components/SiteBrandLogo";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
} from "framer-motion";
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

type MenuKey = "services" | "tools" | "important" | "pricing" | "reviews";

/** Visual shell of a desktop nav item: sliding hover pill + active dot. */
function Trigger({
  id,
  hovered,
  active,
  children,
}: {
  id: MenuKey;
  hovered: MenuKey | null;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`relative isolate flex h-10 cursor-pointer items-center gap-1 rounded-full px-3.5 text-[13px] font-semibold tracking-[-0.005em] transition-colors duration-200 ${
        active || hovered === id ? "text-slate-950" : "text-slate-600"
      }`}
    >
      {hovered === id && (
        <motion.span
          layoutId="nav-hover-pill"
          className="absolute inset-0 -z-10 rounded-full bg-slate-900/[0.06]"
          transition={{ type: "spring", stiffness: 480, damping: 36 }}
        />
      )}
      {children}
      {active && (
        <span className="absolute -bottom-[3px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600" />
      )}
    </span>
  );
}

const dropdownMotion = {
  initial: { opacity: 0, y: 10, scale: 0.98, x: "-50%" },
  animate: { opacity: 1, y: 0, scale: 1, x: "-50%" },
  exit: { opacity: 0, y: 6, scale: 0.985, x: "-50%" },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Navbar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<MenuKey | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileImportantOpen, setMobileImportantOpen] = useState(false);

  // Thin reading-progress line along the bottom edge of the bar
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.3,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setHovered(null);
  }, [pathname]);

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
  const pricingActive = pathname.startsWith("/pricing");
  const reviewsActive = pathname.startsWith("/reviews");
  const close = () => setHovered(null);

  return (
    <>
      {/* ============ Floating island navbar ============ */}
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`pointer-events-none sticky top-0 z-[999] w-full px-3 pt-3 sm:px-5 ${
          pathname === "/" ? "-mb-[76px]" : ""
        }`}
      >
        <div
          className={`pointer-events-auto relative mx-auto flex h-16 max-w-[1240px] items-center justify-between rounded-full border pl-4 pr-2 ring-1 ring-slate-900/[0.04] backdrop-blur-2xl transition-[background-color,box-shadow,border-color] duration-300 sm:pl-6 ${
            scrolled
              ? "border-slate-200/90 bg-white/85 shadow-[0_22px_50px_-22px_rgba(30,41,99,0.45)]"
              : "border-white/80 bg-white/70 shadow-[0_12px_40px_-26px_rgba(30,41,99,0.35)]"
          }`}
        >
          {/* subtle top sheen */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
          />
          {/* scroll progress */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 bottom-0 h-[2px] overflow-hidden rounded-full"
          >
            <motion.span
              style={{ scaleX: progress }}
              className="block h-full origin-left bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
            />
          </span>

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4"
          >
            <SiteBrandLogo width={148} height={46} className="h-[40px] w-auto" />
          </Link>

          {/* Desktop navigation */}
          <nav
            onMouseLeave={close}
            className="hidden items-center gap-0.5 lg:flex"
          >
            {/* Our Services */}
            <div
              className="relative flex h-16 items-center"
              onMouseEnter={() => setHovered("services")}
            >
              <button
                onClick={() =>
                  setHovered(hovered === "services" ? null : "services")
                }
                aria-expanded={hovered === "services"}
                className="outline-none"
              >
                <Trigger id="services" hovered={hovered} active={false}>
                  <T>{"Our Services"}</T>
                  <Chevron open={hovered === "services"} />
                </Trigger>
              </button>

              <AnimatePresence>
                {hovered === "services" && (
                  <motion.div
                    {...dropdownMotion}
                    className="absolute left-1/2 top-full z-[1000] pt-1"
                  >
                    <div className="w-[17rem] rounded-[22px] border border-slate-200/80 bg-white/95 p-2 shadow-[0_30px_70px_-24px_rgba(30,41,99,0.4)] backdrop-blur-xl">
                      {serviceItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={index}
                            href={item.href}
                            onClick={close}
                            className="group flex items-center gap-3 rounded-2xl px-2.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition duration-200 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-violet-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-500/30">
                              <Icon size={16} />
                            </span>
                            <span className="flex-1">
                              <T>{item.label}</T>
                            </span>
                            <ArrowRight
                              size={14}
                              className="-translate-x-1 text-indigo-500 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* All Tools mega menu (anchored to the whole bar, not the trigger) */}
            <div
              className="flex h-16 items-center"
              onMouseEnter={() => setHovered("tools")}
            >
              <Link href="/tools" onClick={close} className="outline-none">
                <Trigger
                  id="tools"
                  hovered={hovered}
                  active={toolsActive}
                >
                  <T>{"All Tools"}</T>
                  <Chevron open={hovered === "tools"} />
                </Trigger>
              </Link>

              <AnimatePresence>
                {hovered === "tools" && (
                  <motion.div
                    {...dropdownMotion}
                    className="absolute left-1/2 top-full z-[1000] pt-1"
                  >
                    <div className="w-[min(1120px,calc(100vw-3rem))] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_40px_90px_-30px_rgba(30,41,99,0.5)] backdrop-blur-xl">
                      <div className="grid grid-cols-3 gap-x-4 gap-y-6 p-6 xl:grid-cols-5">
                        {sebaLagbeToolsCategories.map((cat, idx) => {
                          const CatIcon = cat.icon;
                          return (
                            <div key={idx} className="flex flex-col gap-2.5">
                              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                <span
                                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.accent}`}
                                >
                                  <CatIcon size={17} />
                                </span>
                                <div className="flex flex-col leading-tight">
                                  <span className="text-[13px] font-extrabold text-slate-900">
                                    <T>{cat.title}</T>
                                  </span>
                                  <span className="text-[10.5px] font-semibold text-slate-400">
                                    <T>{cat.count}</T>
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col">
                                {cat.tools.map((tool, tIdx) => (
                                  <Link
                                    key={tIdx}
                                    href={tool.href}
                                    onClick={close}
                                    className="group/t flex items-center justify-between truncate rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                                  >
                                    <span className="truncate">
                                      <T>{tool.name}</T>
                                    </span>
                                    <ArrowRight
                                      size={12}
                                      className="shrink-0 -translate-x-1 text-indigo-500 opacity-0 transition duration-200 group-hover/t:translate-x-0 group-hover/t:opacity-100"
                                    />
                                  </Link>
                                ))}
                                {cat.moreText && (
                                  <Link
                                    href="/login?redirect=/sohoj-tools"
                                    onClick={close}
                                    className="px-2 py-1.5 text-[12px] font-bold text-indigo-600 hover:text-violet-700"
                                  >
                                    <T>{cat.moreText}</T>
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer band */}
                      <div className="relative flex items-center justify-between overflow-hidden bg-slate-950 px-6 py-3.5">
                        <span
                          aria-hidden
                          className="absolute -left-10 top-1/2 h-24 w-72 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600/50 to-violet-600/40 blur-2xl"
                        />
                        <p className="relative flex items-center gap-2 text-xs font-semibold text-slate-200">
                          <Sparkles size={14} className="text-violet-300" />
                          <T>{"30+ smart tools, one simple place."}</T>
                        </p>
                        <Link
                          href="/login?redirect=/sohoj-tools"
                          onClick={close}
                          className="relative inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-indigo-50"
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
              className="relative flex h-16 items-center"
              onMouseEnter={() => setHovered("important")}
            >
              <Link href="/dorkar-link" onClick={close} className="outline-none">
                <Trigger
                  id="important"
                  hovered={hovered}
                  active={importantActive}
                >
                  <T>{"Important Links"}</T>
                  <Chevron open={hovered === "important"} />
                </Trigger>
              </Link>

              <AnimatePresence>
                {hovered === "important" && (
                  <motion.div
                    {...dropdownMotion}
                    className="absolute left-1/2 top-full z-[1000] pt-1"
                  >
                    <div className="flex w-[22rem] flex-col gap-0.5 rounded-[22px] border border-slate-200/80 bg-white/95 p-2 shadow-[0_30px_70px_-24px_rgba(30,41,99,0.4)] backdrop-blur-xl">
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
                              className="group relative my-1 flex items-center justify-between overflow-hidden rounded-2xl bg-slate-950 p-3"
                            >
                              <span
                                aria-hidden
                                className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-blue-500/60 to-violet-500/50 blur-2xl"
                              />
                              <div className="relative flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-indigo-500/40">
                                  <Gift size={17} />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-bold text-white">
                                      <T>{item.title}</T>
                                    </span>
                                    {item.isNew && (
                                      <span className="rounded-md bg-gradient-to-r from-blue-500 to-violet-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                                        <T>{"NEW"}</T>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-400">
                                    <T>{item.subtitle}</T>
                                  </span>
                                </div>
                              </div>
                              <ArrowRight
                                size={15}
                                className="relative shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5"
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
                            onClick={close}
                            className="group flex items-center justify-between rounded-2xl px-3 py-2.5 transition hover:bg-slate-50"
                          >
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-slate-800 group-hover:text-slate-950">
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
              onMouseEnter={() => setHovered("pricing")}
              className="flex h-16 items-center outline-none"
            >
              <Trigger id="pricing" hovered={hovered} active={pricingActive}>
                <T>{"Package"}</T>
              </Trigger>
            </Link>

            <Link
              href="/reviews"
              onMouseEnter={() => setHovered("reviews")}
              className="flex h-16 items-center outline-none"
            >
              <Trigger id="reviews" hovered={hovered} active={reviewsActive}>
                <span>
                  <T>{"5"}</T>
                </span>
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>
                  <T>{"Review"}</T>
                </span>
              </Trigger>
            </Link>
          </nav>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageToggle
              layoutId="lang-pill-desktop"
              className="hidden sm:flex"
            />

            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full bg-slate-950 px-5 text-[13px] font-bold tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(30,27,75,0.7)] ring-1 ring-white/10 transition duration-300 hover:shadow-[0_14px_30px_-10px_rgba(79,70,229,0.75)] sm:px-6"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <span
                  aria-hidden
                  className="absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[420%]"
                />
                <LogIn size={16} strokeWidth={2.2} className="relative" />
                <span className="relative">
                  <T>{"Login"}</T>
                </span>
              </Link>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
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
