// app/dashboard/_components/DashboardSidebar.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, User as UserIcon, LayoutDashboard, FileText, Languages, Wallet, Settings, MessageCircle, PlayCircle, LogOut, Sparkles, PenLine, Images, LayoutTemplate, Printer, Wrench, Users, type LucideIcon, } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { DT } from "./DashboardText";
interface UserData {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
}
interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserData | null;
    onLogout: () => void;
}
type Badge = "New" | "Free";
type Tone = "blue" | "indigo" | "emerald" | "rose" | "slate";
// আইকনের ছোট বক্সের রঙ — ইচ্ছা করেই কম সংখ্যক ও হালকা রাখা হয়েছে
const TONES: Record<Tone, string> = {
    blue: "bg-blue-50/70 text-blue-600/90 ring-blue-600/10",
    indigo: "bg-indigo-50/70 text-indigo-600/90 ring-indigo-600/10",
    emerald: "bg-emerald-50/70 text-emerald-600/90 ring-emerald-600/10",
    rose: "bg-rose-50/70 text-rose-500 ring-rose-500/10",
    slate: "bg-slate-100/80 text-slate-600 ring-slate-500/10",
};
function IconChip({ icon: Icon, tone }: {
    icon: LucideIcon;
    tone: Tone;
}) {
    return (<span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${TONES[tone]}`}>
      <Icon size={15} strokeWidth={1.9}/>
    </span>);
}
interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    tone: Tone;
    badge?: Badge;
}
interface NavSection {
    title?: string;
    items: NavItem[];
}
/* ------------------------------------------------------------------ */
/* Navigation config — add or remove menu items here, not in the JSX   */
/* ------------------------------------------------------------------ */
const NAV_SECTIONS: NavSection[] = [
    {
        items: [
            {
                label: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
                tone: "blue",
            },
            { label: "My Profile", href: "/profile", icon: UserIcon, tone: "slate" },
        ],
    },
    {
        title: "Features & Tools",
        items: [
            {
                label: "AI Editor",
                href: "/ai-editor",
                icon: Sparkles,
                tone: "indigo",
            },
            {
                label: "Manual Editor",
                href: "/manual-editor",
                icon: PenLine,
                tone: "indigo",
            },
            {
                label: "Bulk Photo Edit",
                href: "/bulk-photo-edit",
                icon: Images,
                tone: "emerald",
                badge: "New",
            },
            {
                label: "AI Template",
                href: "/ai-template",
                icon: LayoutTemplate,
                tone: "indigo",
            },
            {
                label: "Question Papers",
                href: "/questions-create/create",
                icon: FileText,
                tone: "rose",
                badge: "New",
            },
            {
                label: "Print Media",
                href: "/print-media",
                icon: Printer,
                tone: "blue",
            },
            {
                label: "SohozTools",
                href: "/sohoj-tools",
                icon: Wrench,
                tone: "emerald",
                badge: "Free",
            },
        ],
    },
    {
        title: "Accounts & Invoice",
        items: [
            { label: "Income & Expenses", href: "/income-expenses", icon: Wallet, tone: "emerald" },
            { label: "Customers & Invoices", href: "/customers-invoices", icon: Users, tone: "blue" },
        ],
    },
    {
        title: "Other",
        items: [
            { label: "Settings", href: "/settings", icon: Settings, tone: "slate" },
            {
                label: "WhatsApp সাপোর্ট",
                href: "/whatsapp-support",
                icon: MessageCircle,
                tone: "emerald",
            },
            { label: "Tutorial Video", href: "/tutorial-video", icon: PlayCircle, tone: "rose" },
        ],
    },
];
/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function getInitials(name?: string) {
    if (!name)
        return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function NavBadge({ type }: {
    type: Badge;
}) {
    const styles = type === "Free"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
        : "bg-blue-50 text-blue-700 ring-blue-600/20";
    return (<span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ring-1 ring-inset ${styles}`}>
      {type}
    </span>);
}
function NavLink({ item, active, onClick, }: {
    item: NavItem;
    active: boolean;
    onClick: () => void;
}) {
    return (<Link href={item.href} onClick={onClick} aria-current={active ? "page" : undefined} className={`relative flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13.5px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 ${active
            ? "bg-slate-100 text-slate-900"
            : "text-slate-800 hover:bg-slate-50 hover:text-slate-900"}`}>
      {active && (<span aria-hidden className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600"/>)}
      <IconChip icon={item.icon} tone={item.tone}/>
      <span className="flex-1 truncate">{<DT>{item.label}</DT>}</span>
      {item.badge && <NavBadge type={item.badge}/>}
    </Link>);
}
/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function DashboardSidebar({ isOpen, onClose, user, onLogout, }: DashboardSidebarProps) {
    const pathname = usePathname();
    const { locale, setLocale, t } = useI18n();
    // Esc চাপলে সাইডবার বন্ধ + খোলা থাকলে পেছনের পেজ স্ক্রল বন্ধ
    useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape")
                onClose();
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);
    const changeLanguage = (targetLang: "EN" | "BN") => {
        const next = targetLang === "BN" ? "bn" : "en";
        if (next === locale)
            return;
        setLocale(next);
    };
    const isActive = useMemo(() => (href: string) => {
        if (href === "#")
            return false;
        if (href === "/dashboard")
            return pathname === "/dashboard";
        return pathname === href || pathname.startsWith(href + "/");
    }, [pathname]);
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-[999] flex justify-start antialiased">
      {/* Backdrop */}
      <div className="fixed inset-0 cursor-pointer bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden/>

      {/* Drawer */}
      <aside role="dialog" aria-modal="true" aria-label={t("Main navigation")} className="relative z-10 flex h-full w-[300px] max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <Link href="/dashboard" onClick={onClose} translate="no" className="flex cursor-pointer items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-[13px] font-bold tracking-tight text-white">
              SK
            </span>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">
              Sohoz<span className="text-blue-600">kaj</span>
            </span>
          </Link>
          <button onClick={onClose} aria-label={t("Close menu")} className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40">
            <X size={18} strokeWidth={1.75}/>
          </button>
        </div>

        {/* Scrollable body */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <Link href="/subscription" onClick={onClose} className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold tracking-[0.01em] text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-2"><DT>{"Buy Subscription\n          "}</DT></Link>

          <div className="space-y-6">
            {NAV_SECTIONS.map((section, i) => (<div key={section.title ?? `section-${i}`}>
                {section.title && (<p className="mb-1.5 px-3 text-xs font-bold text-slate-500">
                    {<DT>{section.title}</DT>}
                  </p>)}
                <div className="space-y-0.5">
                  {section.items.map((item) => (<NavLink key={item.label} item={item} active={isActive(item.href)} onClick={onClose}/>))}

                  {/* Language switcher — sits at the end of "Other" */}
                  {section.title === "Other" && (<div className="flex items-center justify-between rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center gap-3 text-[13.5px] font-semibold text-slate-800">
                        <IconChip icon={Languages} tone="blue"/>
                        <span><DT>{"Language"}</DT></span>
                      </div>
                      <div role="group" aria-label={t("Language")} className="flex rounded-md bg-slate-100 p-0.5 text-[11px] font-bold" translate="no">
                        {(["EN", "BN"] as const).map((code) => (<button key={code} onClick={() => changeLanguage(code)} aria-pressed={(locale === "bn" ? "BN" : "EN") === code} className={`cursor-pointer rounded px-2 py-1 transition-colors ${(locale === "bn" ? "BN" : "EN") === code
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"}`}>
                            {code === "EN" ? "EN" : "বাংলা"}
                          </button>))}
                      </div>
                    </div>)}
                </div>
              </div>))}
          </div>
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/15" translate="no">
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                <DT>{user?.fullName || "Guest"}</DT>
              </p>
              <p className="truncate text-xs font-medium text-slate-600">
                {user?.phoneNumber || user?.email || ""}
              </p>
            </div>
            <button onClick={onLogout} aria-label={t("Log out")} title="Log out" className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">
              <LogOut size={17} strokeWidth={1.75}/>
            </button>
          </div>
        </div>
      </aside>
    </div>);
}
