// app/dashboard/_components/DashboardNavbar.tsx
"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { DT } from "./DashboardText";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { FolderOpen, SlidersHorizontal, PenTool, Layers, LayoutGrid, FileText, Printer, Wrench, ChevronDown, Search, PanelRightOpen, MoreHorizontal, LogOut, User as UserIcon, Settings, CreditCard, Command, LayoutDashboard, type LucideIcon, } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { logoutClientSession } from "@/lib/clientAuth";
import { getSlug, toolsData } from "@/app/_components/toolsData";
import { clearMyFilesDataCache, prefetchMyFilesData } from "@/app/my-files/myFilesData";
interface UserData {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    profileImageUrl?: string;
    profileImagePublicId?: string;
    updatedAt?: string;
}
/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */
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
    match: string;
    upcoming?: boolean;
    tag?: {
        text: string;
        className: string;
    };
    accessTag?: {
        text: string;
        className: string;
    };
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
        accessTag: {
            text: "Free",
            className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
        },
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
        accessTag: {
            text: "Free",
            className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
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
        label: "All Tools",
        icon: Wrench,
        tone: "orange",
        match: "/sohoj-tools",
    },
];
const NAV_GAP = 2;
const NAV_SIDE_GAP = 12;
const NAV_EDGE_PAD = 6;
// জুম-আউট / বড় স্ক্রিনে ন্যাভবার ঠিক একই দেখানোর জন্য (scaleWithZoom চালু থাকলে)
const NAV_BASE_WIDTH = 1920; // px — এর চেয়ে চওড়া ভিউপোর্টে ন্যাভবার আনুপাতিক বড় হবে
const NAV_MAX_SCALE = 5; // সর্বোচ্চ কতগুণ বড় হবে
const NAV_BASE_HEIGHT = 64; // px — h-16
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
/* ------------------------------------------------------------------ */
/* Small building blocks                                              */
/* ------------------------------------------------------------------ */
function IconTile({ icon: Icon, tone }: {
    icon: LucideIcon;
    tone: Tone;
}) {
    return (<span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md ring-1 ring-inset ${TONES[tone]}`}>
      <Icon size={13} strokeWidth={2.1}/>
    </span>);
}
function UpcomingFlag() {
    return (<span className="pointer-events-none absolute right-0 top-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-semibold leading-[14px] text-slate-600"><DT>{"Upcoming\n    "}</DT></span>);
}
const itemBase = "group flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";
const itemActive = "bg-blue-50 text-[#1D4ED8]";
const itemIdle = "text-slate-800 hover:bg-slate-100 hover:text-slate-950";
function NavLabel({ item, open }: {
    item: NavConfig;
    open?: boolean;
}) {
    return (<>
      <IconTile icon={item.icon} tone={item.tone}/>

      <span>{<DT>{item.label}</DT>}</span>

      {item.tag && (<span className={`rounded-full px-1.5 text-[10px] font-semibold leading-[15px] ${item.tag.className}`}>
          {item.tag.text}
        </span>)}

      {item.accessTag && (<span className={`rounded-full px-1.5 text-[9px] font-bold uppercase leading-[14px] ${item.accessTag.className}`}>
          <DT>{item.accessTag.text}</DT>
        </span>)}

      {item.menu && (<ChevronDown size={13} className={`-ml-0.5 transition-transform duration-200 ${open ? "rotate-180 text-[#1D4ED8]" : "text-slate-500"}`}/>)}
    </>);
}
function NavItem({ item, active }: {
    item: NavConfig;
    active: boolean;
}) {
    const router = useRouter();
    const prefetchDestination = () => {
        router.prefetch(item.href);
        if (item.href === "/my-files") prefetchMyFilesData();
    };
    return (<div className="relative flex h-full shrink-0 items-center">
      {item.upcoming && <UpcomingFlag />}

      <Link href={item.href} prefetch onMouseEnter={prefetchDestination} onFocus={prefetchDestination} onTouchStart={() => { if (item.href === "/my-files") prefetchMyFilesData(true); else prefetchDestination(); }} onMouseDown={() => { if (item.href === "/my-files") prefetchMyFilesData(true); }} onClick={() => { if (item.href === "/my-files") prefetchMyFilesData(true); }} className={`${itemBase} ${active ? itemActive : itemIdle}`}>
        <NavLabel item={item}/>
      </Link>
    </div>);
}
function NavDropdown({ item, open, setOpen, active, }: {
    item: NavConfig;
    open: boolean;
    setOpen: (v: boolean) => void;
    active: boolean;
}) {
    const router = useRouter();
    return (<div className="relative flex h-full shrink-0 items-center" onMouseEnter={() => {
            setOpen(true);
            router.prefetch(item.href);
        }} onMouseLeave={() => setOpen(false)}>
      {item.upcoming && <UpcomingFlag />}

      <Link href={item.href} prefetch onFocus={() => router.prefetch(item.href)} aria-haspopup="true" aria-expanded={open} className={`${itemBase} ${active || open ? itemActive : itemIdle}`}>
        <NavLabel item={item} open={open}/>
      </Link>

      {open && item.menu && (<div className="absolute left-0 top-full z-[100] w-52 rounded-xl border border-slate-200/80 bg-white p-1.5 text-[13px] font-medium shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] animate-in fade-in duration-150">
          {item.menu.map((entry, index) => (<Link key={index} href={item.href} className="block rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950">
              {entry}
            </Link>))}
        </div>)}
    </div>);
}
function MoreMenu({ items, open, setOpen, active, isActive, }: {
    items: NavConfig[];
    open: boolean;
    setOpen: (v: boolean) => void;
    active: boolean;
    isActive: (prefix: string) => boolean;
}) {
    const router = useRouter();
    return (<div className="relative flex h-full shrink-0 items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)} className={`${itemBase} cursor-pointer ${active || open ? itemActive : itemIdle}`}>
        <IconTile icon={MoreHorizontal} tone="slate"/>
        <span><DT>{"More"}</DT></span>

        <ChevronDown size={13} className={`-ml-0.5 transition-transform duration-200 ${open ? "rotate-180 text-[#1D4ED8]" : "text-slate-500"}`}/>
      </button>

      {open && (<div className="absolute right-0 top-full z-[100] w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200/80 bg-white p-1.5 text-[13px] font-medium shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] animate-in fade-in duration-150">
          {items.map((item) => (<Link key={item.id} href={item.href} prefetch onMouseEnter={() => { router.prefetch(item.href); if (item.href === "/my-files") prefetchMyFilesData(); }} onFocus={() => { router.prefetch(item.href); if (item.href === "/my-files") prefetchMyFilesData(); }} onTouchStart={() => { if (item.href === "/my-files") prefetchMyFilesData(true); }} onMouseDown={() => { if (item.href === "/my-files") prefetchMyFilesData(true); }} onClick={() => { if (item.href === "/my-files") prefetchMyFilesData(true); }} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${isActive(item.match)
                    ? "bg-blue-50 text-[#1D4ED8]"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}>
              <IconTile icon={item.icon} tone={item.tone}/>

              <span className="flex-1">{<DT>{item.label}</DT>}</span>

              {item.upcoming && (<span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-semibold leading-[14px] text-slate-500"><DT>{"Upcoming\n                "}</DT></span>)}

              {item.tag && (<span className={`rounded-full px-1.5 text-[10px] font-semibold leading-[15px] ${item.tag.className}`}>
                  {item.tag.text}
                </span>)}

              {item.accessTag && (<span className={`rounded-full px-1.5 text-[9px] font-bold uppercase leading-[14px] ${item.accessTag.className}`}>
                  <DT>{item.accessTag.text}</DT>
                </span>)}
            </Link>))}
        </div>)}
    </div>);
}
/* ------------------------------------------------------------------ */
/* Navbar                                                             */
/* ------------------------------------------------------------------ */
export default function DashboardNavbar({ scaleWithZoom = false, }: {
    scaleWithZoom?: boolean;
} = {}) {
    const pathname = usePathname();
    /* Zoom-out scale (শুধু ডেস্কটপ/মাউস ডিভাইসে, scaleWithZoom চালু থাকলে) */
    const [navScale, setNavScale] = useState<number>(1);
    useIsoLayoutEffect(() => {
        if (!scaleWithZoom) {
            setNavScale(1);
            return;
        }
        const mq = window.matchMedia("(pointer: fine)");
        const update = () => {
            if (!mq.matches) {
                setNavScale(1);
                return;
            }
            const w = document.documentElement.clientWidth;
            const next = Math.min(NAV_MAX_SCALE, Math.max(1, w / NAV_BASE_WIDTH));
            setNavScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
        };
        update();
        window.addEventListener("resize", update);
        mq.addEventListener("change", update);
        return () => {
            window.removeEventListener("resize", update);
            mq.removeEventListener("change", update);
        };
    }, [scaleWithZoom]);
    const isScaled = scaleWithZoom && navScale > 1.001;
    const [user, setUser] = useState<UserData | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const profileRef = useRef<HTMLDivElement>(null);
    /* Application language */
    const { locale, setLocale, t } = useI18n();
    /* Search */
    const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const searchResults = normalizedSearchQuery
        ? toolsData
            .filter((tool) => {
            const haystack = [
                tool.name,
                tool.category,
                tool.badge || "",
                tool.access || "free",
                tool.id,
            ]
                .join(" ")
                .toLowerCase();
            return haystack.includes(normalizedSearchQuery);
        })
            .slice(0, 8)
        : [];
    /* Nav dropdown states */
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [moreOpen, setMoreOpen] = useState<boolean>(false);
    /* Responsive nav */
    const headerRef = useRef<HTMLElement>(null);
    const leftRef = useRef<HTMLAnchorElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);
    const ghostRef = useRef<HTMLDivElement>(null);
    const [navWidth, setNavWidth] = useState<number>(0);
    const [navAligned, setNavAligned] = useState<boolean>(false);
    const [visibleCount, setVisibleCount] = useState<number>(NAV_ITEMS.length);
    const [navReady, setNavReady] = useState<boolean>(false);
    /* ------------------------------------------------------------------ */
    /* User data                                                          */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        let mounted = true;
        const applyUser = (nextUser: UserData | null) => {
            if (!mounted || !nextUser)
                return;
            setUser(nextUser);
            try {
                localStorage.setItem("user", JSON.stringify(nextUser));
            }
            catch (error) {
                console.error("Failed to cache user data in localStorage", error);
            }
        };
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser) as UserData;
                setUser(parsedUser);
            }
        }
        catch (error) {
            console.error("Failed to parse user data from localStorage", error);
        }
        const handleUserUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserData>;
            if (customEvent.detail) {
                applyUser(customEvent.detail);
            }
        };
        window.addEventListener("sohozkaj:user-updated", handleUserUpdated as EventListener);

        // Refresh cached profile data without blocking the dashboard render. Prefer
        // the same bearer token used by client API calls; the server verifies it.
        let tokenAtRequest = "";
        try {
            tokenAtRequest = localStorage.getItem("token") || "";
        } catch {
            // The HttpOnly cookie can still authenticate the request.
        }

        fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: tokenAtRequest ? { Authorization: `Bearer ${tokenAtRequest}` } : undefined,
        })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!mounted) return;

                if (response.ok && data?.user) {
                    applyUser(data.user as UserData);
                    return;
                }

                // Do not let a slow response for an old token clear a newer login.
                let currentToken = "";
                try {
                    currentToken = localStorage.getItem("token") || "";
                } catch {
                    // Continue with the best available cookie-based state.
                }
                if (currentToken !== tokenAtRequest) return;

                if ([401, 403, 404].includes(response.status)) {
                    clearMyFilesDataCache();
                    try {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                    } catch {
                        // Storage cleanup is best-effort.
                    }
                    // Clear the HttpOnly cookie on the server without delaying redirect.
                    void fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                        keepalive: true,
                    }).catch(() => undefined);
                    window.location.replace("/login");
                }
            })
            .catch((error) => {
                if (mounted) console.error("Failed to refresh navbar user data", error);
            });
        return () => {
            mounted = false;
            window.removeEventListener("sohozkaj:user-updated", handleUserUpdated as EventListener);
        };
    }, []);
    /* ------------------------------------------------------------------ */
    /* Responsive nav measurement                                         */
    /* ------------------------------------------------------------------ */
    useIsoLayoutEffect(() => {
        const header = headerRef.current;
        const left = leftRef.current;
        const right = rightRef.current;
        const nav = navRef.current;
        const ghost = ghostRef.current;
        if (!header || !left || !right || !nav || !ghost) {
            return;
        }
        let observer: ResizeObserver | undefined;
        let watched: HTMLElement | null = null;
        const readContentW = () => {
            const fromVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--content-w"));
            if (fromVar > 0)
                return fromVar;
            const target = document.querySelector<HTMLElement>("[data-nav-content]");
            if (!target)
                return 0;
            if (target !== watched) {
                if (watched) {
                    observer?.unobserve(watched);
                }
                observer?.observe(target);
                watched = target;
            }
            const tcs = getComputedStyle(target);
            return (target.getBoundingClientRect().width -
                (parseFloat(tcs.paddingLeft) || 0) -
                (parseFloat(tcs.paddingRight) || 0));
        };
        const measure = () => {
            if (getComputedStyle(nav).display === "none") {
                return;
            }
            const cs = getComputedStyle(header);
            const pad = Math.max(parseFloat(cs.paddingLeft) || 0, parseFloat(cs.paddingRight) || 0);
            const side = Math.max(left.offsetWidth, right.offsetWidth);
            const symmetricW = Math.floor((header.clientWidth - 2 * (pad + side + NAV_SIDE_GAP)) / 2) *
                2;
            const contentW = readContentW();
            const aligned = contentW > 0;
            const navW = aligned
                ? Math.min(Math.round((contentW + 2 * NAV_EDGE_PAD) / 2) * 2, symmetricW)
                : symmetricW;
            setNavAligned(aligned);
            setNavWidth(Math.max(navW, 0));
            const available = navW - 4;
            if (available <= 0)
                return;
            const widths = (Array.from(ghost.children) as HTMLElement[]).map((el) => el.offsetWidth);
            const moreW = widths[widths.length - 1];
            const itemWidths = widths.slice(0, NAV_ITEMS.length);
            const total = itemWidths.reduce((sum, w) => sum + w + NAV_GAP, 0);
            let count = NAV_ITEMS.length;
            if (total > available) {
                let used = moreW + NAV_GAP;
                count = 0;
                for (const w of itemWidths) {
                    if (used + w + NAV_GAP > available) {
                        break;
                    }
                    used += w + NAV_GAP;
                    count += 1;
                }
            }
            setVisibleCount(count);
            setNavReady(true);
        };
        observer = new ResizeObserver(measure);
        measure();
        observer.observe(header);
        observer.observe(left);
        observer.observe(right);
        observer.observe(ghost);
        document.fonts?.ready.then(measure);
        window.addEventListener("sohozkaj:content-width", measure);
        let tries = 0;
        const poll = window.setInterval(() => {
            tries += 1;
            measure();
            if (watched || tries >= 20) {
                window.clearInterval(poll);
            }
        }, 250);
        return () => {
            window.clearInterval(poll);
            observer?.disconnect();
            window.removeEventListener("sohozkaj:content-width", measure);
        };
    }, []);
    /* ------------------------------------------------------------------ */
    /* Application language                                               */
    /* ------------------------------------------------------------------ */
    const changeLanguage = (targetLang: "EN" | "BN") => {
        setLocale(targetLang === "BN" ? "bn" : "en");
    };
    /* ------------------------------------------------------------------ */
    /* Keyboard                                                           */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
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
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);
    /* ------------------------------------------------------------------ */
    /* Profile dropdown outside click                                     */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        if (!dropdownOpen)
            return;
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current &&
                !profileRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownOpen]);
    /* ------------------------------------------------------------------ */
    /* Actions                                                            */
    /* ------------------------------------------------------------------ */
    const handleLogout = () => {
        clearMyFilesDataCache();
        void logoutClientSession().finally(() => {
            setUser(null);
            window.location.replace("/login");
        });
    };
    const getInitials = (name?: string) => {
        if (!name)
            return "U";
        const parts = name.trim().split(" ");
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };
    const isActive = (prefix: string) => pathname === prefix || !!pathname?.startsWith(`${prefix}/`);
    const visibleItems = NAV_ITEMS.slice(0, visibleCount);
    const hiddenItems = NAV_ITEMS.slice(visibleCount);
    const menuSetter = (id: string) => (v: boolean) => setOpenMenu((cur) => (v ? id : cur === id ? null : cur));
    const iconButton = "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";
    const profileLinkClass = "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950";
    return (<>
      {/* স্কেল চালু থাকলে এই র‍্যাপার স্কেল-করা উচ্চতা ধরে রাখে ও sticky থাকে */}
      <div className={scaleWithZoom ? "sticky top-0 z-50" : "contents"} style={isScaled ? { height: NAV_BASE_HEIGHT * navScale } : undefined}>
        <header ref={headerRef} style={isScaled
            ? {
                width: `${100 / navScale}%`,
                transform: `scale(${navScale})`,
                transformOrigin: "top left",
            }
            : undefined} className="sticky top-0 z-50 flex h-16 w-full items-center justify-between gap-2 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
          {/* ------------------------------------------------------------ */}
          {/* Left: Logo                                                   */}
          {/* ------------------------------------------------------------ */}

          <Link
            ref={leftRef}
            href="/"
            className="flex min-w-0 shrink items-center gap-2.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#2563EB] text-[15px] font-extrabold text-white shadow-sm ring-1 ring-inset ring-white/20"><DT>{"SK\n            "}</DT></div>

            <div className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-[17px] font-extrabold tracking-tight text-[#0F172A] sm:text-[19px]"><DT>{"Sohoz"}</DT><span className="text-[#2563EB]"><DT>{"kaj"}</DT></span>
              </span>

              <span className="mt-1 hidden text-[10px] font-medium text-slate-500 sm:block"><DT>{"www.sohozkaj.com\n              "}</DT></span>
            </div>
          </Link>

          {/* ------------------------------------------------------------ */}
          {/* Center: Navigation                                           */}
          {/* ------------------------------------------------------------ */}

          <nav ref={navRef} aria-label={t("Main")} style={{
            width: navWidth,
            left: `calc(50% - ${navWidth / 2}px)`,
        }} className={`absolute top-0 hidden h-full items-center ${navAligned ? "justify-between" : "justify-center"} gap-0.5 text-[13px] font-medium transition-opacity duration-150 lg:flex 2xl:text-[13.5px] 2xl:font-semibold ${navReady ? "opacity-100" : "opacity-0"}`}>
            {/* Hidden measuring copy */}
            <div aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden">
              <div ref={ghostRef} className="flex w-max items-center gap-0.5">
                {NAV_ITEMS.map((item) => (<div key={item.id} className="flex shrink-0 items-center">
                    <div className={itemBase}>
                      <NavLabel item={item}/>
                    </div>
                  </div>))}

                <div className="flex shrink-0 items-center">
                  <div className={itemBase}>
                    <IconTile icon={MoreHorizontal} tone="slate"/>

                    <span><DT>{"More"}</DT></span>

                    <ChevronDown size={13} className="-ml-0.5"/>
                  </div>
                </div>
              </div>
            </div>

            {visibleItems.map((item) => item.menu ? (<NavDropdown key={item.id} item={item} open={openMenu === item.id} setOpen={menuSetter(item.id)} active={isActive(item.match)}/>) : (<NavItem key={item.id} item={item} active={isActive(item.match)}/>))}

            {hiddenItems.length > 0 && (<MoreMenu items={hiddenItems} open={moreOpen} setOpen={setMoreOpen} active={hiddenItems.some((item) => isActive(item.match))} isActive={isActive}/>)}
          </nav>

          {/* ------------------------------------------------------------ */}
          {/* Right                                                        */}
          {/* ------------------------------------------------------------ */}

          <div ref={rightRef} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Language switcher */}
            <div className="hidden shrink-0 items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold min-[1900px]:inline-flex">
              <button type="button" onClick={() => changeLanguage("EN")} className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${locale === "en"
            ? "bg-white text-[#1D4ED8] shadow-sm ring-1 ring-slate-200/70"
            : "text-slate-600 hover:text-slate-900"}`}><DT>{"EN\n              "}</DT></button>

              <button type="button" onClick={() => changeLanguage("BN")} className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${locale === "bn"
            ? "bg-white text-[#1D4ED8] shadow-sm ring-1 ring-slate-200/70"
            : "text-slate-600 hover:text-slate-900"}`}><DT>{"\u09AC\u09BE\u0982\n              "}</DT></button>
            </div>

            {/* Search */}
            <div className="relative shrink-0">
              <button type="button" onClick={() => setIsSearchOpen(true)} className={iconButton} aria-label={t("Search")} aria-expanded={isSearchOpen}>
                <Search size={16}/>
              </button>

            </div>

            {/* Profile */}
            <div className="relative z-50 shrink-0" ref={profileRef}>
              <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)} aria-haspopup="true" aria-expanded={dropdownOpen} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-1 text-left outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 sm:pr-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-bold uppercase text-white">
                  {user?.profileImageUrl ? (<img src={`${user.profileImageUrl}${user.updatedAt
                ? `${user.profileImageUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(user.updatedAt)}`
                : ""}`} alt={`${user?.fullName || t("User")} profile photo`} className="h-full w-full object-cover" onError={(event) => {
                event.currentTarget.style.display = "none";
            }}/>) : (getInitials(user?.fullName))}
                </div>

                <div className="hidden flex-col leading-tight min-[2200px]:flex">
                  <span className="max-w-[120px] truncate text-xs font-semibold text-[#0F172A]">
                    <DT>{user?.fullName || "User Account"}</DT>
                  </span>

                  <span className="max-w-[120px] truncate text-[11px] text-slate-500">
                    <DT>{user?.phoneNumber || user?.email || "User"}</DT>
                  </span>
                </div>

                <ChevronDown size={14} className={`hidden shrink-0 text-slate-500 transition-transform duration-200 sm:block ${dropdownOpen ? "rotate-180" : ""}`}/>
              </button>

              {/* -------------------------------------------------------- */}
              {/* Profile Dropdown                                         */}
              {/* -------------------------------------------------------- */}

              {dropdownOpen && (<div className="absolute right-0 z-[100] mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200/80 bg-white p-1.5 text-[13px] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] animate-in fade-in duration-150">
                  {/* User info */}
                  <div className="mb-1 border-b border-slate-100 px-3 pb-2.5 pt-2">
                    <p className="truncate font-semibold text-[#0F172A]">
                      <DT>{user?.fullName || "User Account"}</DT>
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      <DT>{user?.phoneNumber || user?.email || "User"}</DT>
                    </p>
                  </div>

                  {/* Language */}
                  <div className="mb-1 flex items-center justify-between gap-2 px-3 py-2 min-[1900px]:hidden">
                    <span className="font-medium text-slate-700"><DT>{"Language"}</DT></span>

                    <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                      <button type="button" onClick={() => changeLanguage("EN")} className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${locale === "en"
                ? "bg-white text-[#1D4ED8] shadow-sm ring-1 ring-slate-200/70"
                : "text-slate-600 hover:text-slate-900"}`}><DT>{"EN\n                      "}</DT></button>

                      <button type="button" onClick={() => changeLanguage("BN")} className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${locale === "bn"
                ? "bg-white text-[#1D4ED8] shadow-sm ring-1 ring-slate-200/70"
                : "text-slate-600 hover:text-slate-900"}`}><DT>{"\u09AC\u09BE\u0982\n                      "}</DT></button>
                    </div>
                  </div>

                  {/* Dashboard */}
                  <Link href="/dashboard" onClick={() => setDropdownOpen(false)} className={`${profileLinkClass} ${isActive("/dashboard") ? "bg-blue-50 text-[#1D4ED8]" : ""}`}>
                    <LayoutDashboard size={15} className={isActive("/dashboard")
                ? "text-[#2563EB]"
                : "text-slate-500"}/><DT>{"Dashboard\n                  "}</DT></Link>

                  {/* My Profile */}
                  <Link href="/profile" onClick={() => setDropdownOpen(false)} className={profileLinkClass}>
                    <UserIcon size={15} className="text-slate-500"/><DT>{"My Profile\n                  "}</DT></Link>

                  {/* Subscription */}
                  <Link href="/subscription" onClick={() => setDropdownOpen(false)} className={profileLinkClass}>
                    <CreditCard size={15} className="text-slate-500"/><DT>{"Subscription\n                  "}</DT></Link>

                  {/* Settings */}
                  <Link href="/settings" onClick={() => setDropdownOpen(false)} className={profileLinkClass}>
                    <Settings size={15} className="text-slate-500"/><DT>{"Settings\n                  "}</DT></Link>

                  {/* Divider */}
                  <div className="my-1 border-t border-slate-100"/>

                  {/* Logout */}
                  <button type="button" onClick={handleLogout} className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left font-semibold text-red-600 transition-colors hover:bg-red-50">
                    <LogOut size={15}/><DT>{"Logout\n                  "}</DT></button>
                </div>)}
            </div>

            {/* Menu drawer trigger */}
            <button type="button" onClick={() => setIsSidebarOpen(true)} className={iconButton} aria-label={t("Open Menu")} title={t("Menu")}>
              <PanelRightOpen size={18}/>
            </button>
          </div>
        </header>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Search Modal                                                   */}
      {/* -------------------------------------------------------------- */}

      {isSearchOpen && (<div className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-900/40 px-4 pt-[14vh] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)}/>

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Search size={18} className="shrink-0 text-[#2563EB]"/>

              <input type="text" autoFocus placeholder={t("Search tools and features...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full min-w-0 bg-transparent text-[15px] font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none"/>

              <button type="button" onClick={() => setIsSearchOpen(false)} className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"><DT>{"Esc\n              "}</DT></button>
            </div>

            {/* Body */}
            {normalizedSearchQuery ? (<div className="max-h-[min(420px,55vh)] overflow-y-auto p-2">
                {searchResults.length > 0 ? (<div className="space-y-1">
                    {searchResults.map((tool) => {
                        const ToolIcon = tool.icon;
                        return (<Link key={tool.id} href={`/sohoj-tools/${getSlug(tool.name)}`} onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery("");
                            }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tool.bgColor}`}>
                            <ToolIcon size={24}/>
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-[#0F172A]">
                              {<DT>{tool.name}</DT>}
                            </span>

                            <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                              {tool.category}
                              {tool.access === "paid" ? <DT>{" • Paid"}</DT> : <DT>{" • Free"}</DT>}
                              {tool.badge ? <DT>{` • ${tool.badge}`}</DT> : <DT>{""}</DT>}
                            </span>
                          </span>

                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500"><DT>{"Open\n                          "}</DT></span>
                        </Link>);
                    })}
                  </div>) : (<div className="flex flex-col items-center px-6 py-12 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Search size={20}/>
                    </span>

                    <p className="mt-4 text-sm font-black text-[#0F172A]"><DT>{"No matching tools found\n                    "}</DT></p>

                    <p className="mt-1 text-xs font-medium text-slate-500"><DT>{"Try another tool name, category, or keyword.\n                    "}</DT></p>
                  </div>)}
              </div>) : (<div className="flex flex-col items-center px-6 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                  <Search size={20}/>
                </span>

                <p className="mt-4 text-sm font-black text-[#0F172A]"><DT>{"Search tools and features\n                "}</DT></p>

                <p className="mt-1 text-xs font-medium text-slate-500"><DT>{"Start typing to find what you need.\n                "}</DT></p>
              </div>)}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold text-slate-400">
              <span><DT>{"Press Esc to close"}</DT></span>

              <span className="flex shrink-0 items-center gap-1 font-mono">
                <Command size={10}/><DT>{"K\n              "}</DT></span>
            </div>
          </div>
        </div>)}

      {/* -------------------------------------------------------------- */}
      {/* Sidebar Drawer                                                 */}
      {/* -------------------------------------------------------------- */}

      <DashboardSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={user} onLogout={handleLogout}/>
    </>);
}
