// app/dashboard/_components/DashboardNavbar.tsx
"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { DT } from "./DashboardText";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Search,
  PanelRightOpen,
  LogOut,
  User as UserIcon,
  Settings,
  CreditCard,
  Command,
  LayoutDashboard,
} from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { NAV_ITEM_COUNT } from "@/app/_components/PrePaintScript";
import { saveNavLayout } from "@/app/_components/uiCache";
import { logoutClientSession } from "@/lib/clientAuth";
import { getSlug, toolsData } from "@/app/_components/toolsData";
import {
  clearMyFilesDataCache,
  prefetchMyFilesData,
} from "@/app/my-files/myFilesData";
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
  blue: "bg-blue-600 text-white",
  violet: "bg-violet-600 text-white",
  pink: "bg-pink-500 text-white",
  emerald: "bg-emerald-600 text-white",
  indigo: "bg-indigo-600 text-white",
  red: "bg-red-500 text-white",
  amber: "bg-amber-500 text-white",
  cyan: "bg-cyan-600 text-white",
  orange: "bg-orange-500 text-white",
  slate: "bg-slate-500 text-white",
} as const;
type Tone = keyof typeof TONES;
interface NavConfig {
  id: string;
  href: string;
  label: string;
  icon: NavIcon;
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
  /** Round gold PRO badge (same look as the round FREE badge on tool cards). */
  proBadge?: boolean;
  menu?: string[];
}
/* ------------------------------------------------------------------ */
/* Navbar icons: refined duotone line icons (24px grid, thin round    */
/* strokes + a soft tinted fill). No colored boxes, no gradients -    */
/* the restrained style premium products use.                         */
/* ------------------------------------------------------------------ */
type NavIcon = (props: { size?: number; className?: string }) => ReactElement;

const GLYPH = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;
/** Soft tinted fill used for the "second tone" of each icon. */
const DUO = { fill: "currentColor", fillOpacity: 0.18 } as const;
const DUO_STRONG = { fill: "currentColor", fillOpacity: 0.38 } as const;

/* My Files - folder */
const MyFilesIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path
      {...DUO}
      d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5z"
    />
    <path d="M3 11h18" />
  </svg>
);

/* AI Editor - photo with a sparkle */
const AIEditorIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path
      {...DUO}
      d="M20 12v5.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4H12"
    />
    <path d="m4 16 4.5-4.5 3.5 3.5 2-2 4.5 4.5" />
    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
    <path
      fill="currentColor"
      d="M18 2.6l.95 2.15 2.15.95-2.15.95L18 8.8l-.95-2.15-2.15-.95 2.15-.95z"
    />
  </svg>
);

/* Manual Editor - adjustment sliders */
const ManualEditorIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path d="M4 7h8.6M17.4 7H20M4 17h2.6M11.4 17H20" />
    <circle {...DUO_STRONG} cx="15" cy="7" r="2.4" />
    <circle {...DUO_STRONG} cx="9" cy="17" r="2.4" />
  </svg>
);

/* Bulk Photo Edit - stack of photos */
const BulkPhotoIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path d="M7 4.5h11.5A2.5 2.5 0 0 1 21 7v11.5" />
    <rect {...DUO} x="3" y="7.5" width="15" height="13" rx="2.5" />
    <circle cx="7.8" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <path d="m3.5 18 4.2-4 3 2.8 2.3-2.3 4.5 3.5" />
  </svg>
);

/* AI Template - ready-made layout */
const AITemplateIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <rect {...DUO} x="3" y="3" width="18" height="18" rx="3" />
    <path
      {...DUO_STRONG}
      stroke="none"
      d="M3 9V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3z"
    />
    <path d="M3 9h18M9.5 21V9" />
  </svg>
);

/* Question Papers - paper with a question mark */
const QuestionPaperIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path
      {...DUO}
      d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z"
    />
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M10 12.2a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3" />
    <path d="M12 17.8h.01" />
  </svg>
);

/* Print Media - printer */
const PrintMediaIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path d="M7 9V3.5h10V9" />
    <path
      {...DUO}
      d="M7 17H5.5A2.5 2.5 0 0 1 3 14.5v-3A2.5 2.5 0 0 1 5.5 9h13a2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 1-2.5 2.5H17"
    />
    <rect x="7" y="14" width="10" height="6.5" rx="1" fill="#fff" />
  </svg>
);

/* All Tools - toolbox */
const AllToolsIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <rect {...DUO} x="3" y="7.5" width="18" height="12.5" rx="2.5" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
    <path d="M3 13h18M10.5 13v2h3v-2" />
  </svg>
);

/* More - three dots */
const MoreIcon: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth={3} />
  </svg>
);

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
    icon: MyFilesIcon,
    tone: "blue",
    match: "/my-files",
  },
  {
    id: "ai-editor",
    href: "/ai-editor",
    label: "AI Editor",
    icon: AIEditorIcon,
    tone: "violet",
    match: "/ai-editor",
    proBadge: true,
  },
  {
    id: "manual-editor",
    href: "/manual-editor",
    label: "Manual Editor",
    icon: ManualEditorIcon,
    tone: "pink",
    match: "/manual-editor",
    accessTag: {
      text: "Free",
      className:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15",
    },
  },
  {
    id: "bulk-photo-edit",
    href: "/bulk-photo-edit",
    label: "Bulk Photo Edit",
    icon: BulkPhotoIcon,
    tone: "emerald",
    match: "/bulk-photo-edit",
    proBadge: true,
  },
  {
    id: "ai-template",
    href: "/ai-template",
    label: "AI Template",
    icon: AITemplateIcon,
    tone: "indigo",
    match: "/ai-template",
    menu: aiTemplateItems,
    proBadge: true,
  },
  {
    id: "question-papers",
    href: "/questions-create/create",
    label: "Question Papers",
    icon: QuestionPaperIcon,
    tone: "red",
    match: "/questions-create",
    tag: {
      text: "New",
      className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15",
    },
    accessTag: {
      text: "Free",
      className:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15",
    },
  },
  {
    id: "print-media",
    href: "/print-media",
    label: "Print Media",
    icon: PrintMediaIcon,
    tone: "cyan",
    match: "/print-media",
    upcoming: true,
    menu: printMediaItems,
  },
  {
    id: "sohoj-tools",
    href: "/sohoj-tools",
    label: "All Tools",
    icon: AllToolsIcon,
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
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
// Navbar zoom scale and the visible-item layout are restored before first paint by
// app/_components/PrePaintScript.tsx (html[data-nav-scaled], --nav-s, --nav-w, --ni-N ...), so the
// server HTML already has its final look and nothing is hidden/flipped after hydration.
if (
  process.env.NODE_ENV !== "production" &&
  NAV_ITEMS.length !== NAV_ITEM_COUNT
) {
  console.warn(
    `[DashboardNavbar] NAV_ITEM_COUNT (${NAV_ITEM_COUNT}) in PrePaintScript.tsx must equal NAV_ITEMS.length (${NAV_ITEMS.length}).`,
  );
}
/* ------------------------------------------------------------------ */
/* Small building blocks                                              */
/* ------------------------------------------------------------------ */
const ICON_TONES: Record<Tone, string> = {
  blue: "text-blue-500",
  violet: "text-violet-500",
  pink: "text-pink-500",
  emerald: "text-emerald-500",
  indigo: "text-indigo-500",
  red: "text-red-500",
  amber: "text-amber-500",
  cyan: "text-cyan-500",
  orange: "text-orange-500",
  slate: "text-slate-500",
};
function IconTile({ icon: Icon, tone }: { icon: NavIcon; tone: Tone }) {
  return (
    <span
      data-tone={tone}
      className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105 ${ICON_TONES[tone]}`}
    >
      <Icon size={22} />
    </span>
  );
}
function UpcomingFlag() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 -rotate-[12deg] select-none items-center justify-center rounded-full border-[2.5px] border-red-600 bg-white/95 text-red-600"
    >
      <span className="absolute inset-[3px] rounded-full border border-red-600/80" />
      <span className="relative flex flex-col items-center leading-none">
        <span className="text-[9px] font-black uppercase tracking-[0.04em]">
          Coming
        </span>
        <span className="my-[2px] h-px w-6 bg-red-600/80" />
        <span className="text-[14px] font-black uppercase tracking-[0.04em]">
          Soon
        </span>
      </span>
    </span>
  );
}

/** Round gold PRO badge - same design as the round FREE badge on tool cards, in gold. */
function ProBadge() {
  return (
    <span
      role="img"
      aria-label="Pro"
      title="Pro"
      className="relative inline-flex h-[24px] w-[24px] shrink-0 -rotate-[8deg] select-none items-center justify-center rounded-full shadow-[0_1px_3px_rgba(120,70,0,0.45)]"
      style={{
        background:
          "radial-gradient(circle at 35% 25%, #E9B93F 0%, #B8800F 60%, #8A5A00 100%)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-[1.5px] rounded-full border-[1.5px] border-dotted border-[#FFE9A0]"
      />
      <span
        className="relative z-[1] text-[8px] font-black uppercase leading-none tracking-[0.02em] text-white"
        style={{ textShadow: "0 1px 1px rgba(80,45,0,0.55)" }}
      >
        Pro
      </span>
    </span>
  );
}
const itemBase =
  "group relative flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";
const itemActive =
  "bg-gradient-to-b from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] text-white shadow-[inset_0_0_0_1px_rgba(233,185,63,0.55),inset_0_1px_0_rgba(255,255,255,0.28),0_8px_16px_-6px_rgba(29,78,216,0.55)] [&_[data-tone]]:text-white [&_.nav-chev]:text-blue-100 after:pointer-events-none after:absolute after:bottom-[2px] after:left-1/2 after:h-[2.5px] after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-gradient-to-r after:from-[#F6D878] after:via-[#E9B93F] after:to-[#B8800F] after:content-['']";
const itemIdle =
  "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.35)]";
function NavLabel({ item, open }: { item: NavConfig; open?: boolean }) {
  return (
    <>
      <IconTile icon={item.icon} tone={item.tone} />

      <span>{<DT>{item.label}</DT>}</span>

      {item.proBadge && <ProBadge />}

      {item.tag && (
        <span
          className={`rounded px-1.5 text-[10px] font-semibold leading-[15px] ${item.tag.className}`}
        >
          {item.tag.text}
        </span>
      )}

      {item.accessTag && (
        <span
          className={`rounded px-1.5 text-[9px] font-semibold uppercase leading-[14px] ${item.accessTag.className}`}
        >
          <DT>{item.accessTag.text}</DT>
        </span>
      )}

      {item.menu && (
        <ChevronDown
          size={13}
          className={`nav-chev -ml-0.5 transition-transform duration-200 ${open ? "rotate-180 text-amber-300" : "text-slate-500"}`}
        />
      )}
    </>
  );
}
function NavItem({ item, active }: { item: NavConfig; active: boolean }) {
  const router = useRouter();
  const prefetchDestination = () => {
    router.prefetch(item.href);
    if (item.href === "/my-files") prefetchMyFilesData();
  };
  return (
    <div className="relative flex h-full shrink-0 items-center">
      {item.upcoming && <UpcomingFlag />}

      <Link
        href={item.href}
        prefetch
        onMouseEnter={prefetchDestination}
        onFocus={prefetchDestination}
        onTouchStart={() => {
          if (item.href === "/my-files") prefetchMyFilesData(true);
          else prefetchDestination();
        }}
        onMouseDown={() => {
          if (item.href === "/my-files") prefetchMyFilesData(true);
        }}
        onClick={() => {
          if (item.href === "/my-files") prefetchMyFilesData(true);
        }}
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
  const router = useRouter();
  return (
    <div
      className="relative flex h-full shrink-0 items-center"
      onMouseEnter={() => {
        setOpen(true);
        router.prefetch(item.href);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      {item.upcoming && <UpcomingFlag />}

      <Link
        href={item.href}
        prefetch
        onFocus={() => router.prefetch(item.href)}
        aria-haspopup="true"
        aria-expanded={open}
        className={`${itemBase} ${active || open ? itemActive : itemIdle}`}
      >
        <NavLabel item={item} open={open} />
      </Link>

      {open && item.menu && (
        <div className="absolute left-0 top-full z-[100] w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-[13px] font-medium shadow-[0_10px_30px_-10px_rgba(15,23,42,0.18)] animate-in fade-in duration-150">
          {item.menu.map((entry, index) => (
            <Link
              key={index}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              {entry}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
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
  const router = useRouter();
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
        className={`${itemBase} cursor-pointer ${active || open ? itemActive : itemIdle}`}
      >
        <IconTile icon={MoreIcon} tone="slate" />
        <span>
          <DT>{"More"}</DT>
        </span>

        <ChevronDown
          size={13}
          className={`nav-chev -ml-0.5 transition-transform duration-200 ${open ? "rotate-180 text-amber-300" : "text-slate-500"}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[100] w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-1.5 text-[13px] font-medium shadow-[0_10px_30px_-10px_rgba(15,23,42,0.18)] animate-in fade-in duration-150">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              onMouseEnter={() => {
                router.prefetch(item.href);
                if (item.href === "/my-files") prefetchMyFilesData();
              }}
              onFocus={() => {
                router.prefetch(item.href);
                if (item.href === "/my-files") prefetchMyFilesData();
              }}
              onTouchStart={() => {
                if (item.href === "/my-files") prefetchMyFilesData(true);
              }}
              onMouseDown={() => {
                if (item.href === "/my-files") prefetchMyFilesData(true);
              }}
              onClick={() => {
                if (item.href === "/my-files") prefetchMyFilesData(true);
              }}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                isActive(item.match)
                  ? "bg-blue-50 text-[#1D4ED8]"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <IconTile icon={item.icon} tone={item.tone} />

              <span className="flex-1">{<DT>{item.label}</DT>}</span>

              {item.proBadge && <ProBadge />}

              {item.upcoming && (
                <span className="rounded border-2 border-red-600 bg-white px-1.5 text-[10px] font-black uppercase leading-[14px] tracking-wider text-red-600">
                  <DT>{"Coming Soon"}</DT>
                </span>
              )}

              {item.tag && (
                <span
                  className={`rounded px-1.5 text-[10px] font-semibold leading-[15px] ${item.tag.className}`}
                >
                  {item.tag.text}
                </span>
              )}

              {item.accessTag && (
                <span
                  className={`rounded px-1.5 text-[9px] font-semibold uppercase leading-[14px] ${item.accessTag.className}`}
                >
                  <DT>{item.accessTag.text}</DT>
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
/* Navbar                                                             */
/* ------------------------------------------------------------------ */
export default function DashboardNavbar({
  scaleWithZoom = false,
}: {
  scaleWithZoom?: boolean;
} = {}) {
  const pathname = usePathname();
  /* Zoom-out scale (শুধু ডেস্কটপ/মাউস ডিভাইসে, scaleWithZoom চালু থাকলে).
     The scale itself is applied by CSS (globals.css .nav-zoom-*) from html[data-nav-scaled] and
     --nav-s, which the head script already set before first paint; here we only keep it in sync
     when the window is resized / zoomed. */
  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    if (!scaleWithZoom) {
      root.removeAttribute("data-nav-scaled");
      root.style.removeProperty("--nav-s");
      return;
    }
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => {
      const next = mq.matches
        ? Math.min(
            NAV_MAX_SCALE,
            Math.max(1, root.clientWidth / NAV_BASE_WIDTH),
          )
        : 1;
      if (next > 1.001) {
        root.setAttribute("data-nav-scaled", "1");
        root.style.setProperty("--nav-s", String(next));
      } else {
        root.removeAttribute("data-nav-scaled");
        root.style.removeProperty("--nav-s");
      }
    };
    update();
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, [scaleWithZoom]);
  const [user, setUser] = useState<UserData | null>(null);
  // FIX: user was null on the first render and filled in from localStorage in a post-paint
  // useEffect, so the avatar showed "U" and then flipped to the real initials/photo. Read the
  // cache before paint and keep the user-specific bits invisible until that has happened.
  const [userHydrated, setUserHydrated] = useState<boolean>(false);
  useIsoLayoutEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser) as UserData);
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
    }
    setUserHydrated(true);
  }, []);
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
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [navWidth, setNavWidth] = useState<number>(0);
  const [navAligned, setNavAligned] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(NAV_ITEMS.length);
  const [navReady, setNavReady] = useState<boolean>(false);
  // once React renders the nav from its own state, the cached CSS-variable layout can go
  useEffect(() => {
    if (navReady) document.documentElement.removeAttribute("data-nav-pre");
  }, [navReady]);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  /* ------------------------------------------------------------------ */
  /* User data                                                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;
    const applyUser = (nextUser: UserData | null) => {
      if (!mounted || !nextUser) return;
      setUser(nextUser);
      try {
        localStorage.setItem("user", JSON.stringify(nextUser));
      } catch (error) {
        console.error("Failed to cache user data in localStorage", error);
      }
    };
    const handleUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<UserData>;
      if (customEvent.detail) {
        applyUser(customEvent.detail);
      }
    };
    window.addEventListener(
      "sohozkaj:user-updated",
      handleUserUpdated as EventListener,
    );

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
      headers: tokenAtRequest
        ? { Authorization: `Bearer ${tokenAtRequest}` }
        : undefined,
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
      window.removeEventListener(
        "sohozkaj:user-updated",
        handleUserUpdated as EventListener,
      );
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
      const fromVar = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--content-w",
        ),
      );
      if (fromVar > 0) return fromVar;
      const target = document.querySelector<HTMLElement>("[data-nav-content]");
      if (!target) return 0;
      if (target !== watched) {
        if (watched) {
          observer?.unobserve(watched);
        }
        observer?.observe(target);
        watched = target;
      }
      const tcs = getComputedStyle(target);
      return (
        target.getBoundingClientRect().width -
        (parseFloat(tcs.paddingLeft) || 0) -
        (parseFloat(tcs.paddingRight) || 0)
      );
    };
    // FIX: the visible items are chosen from measured text widths. Measuring before the web
    // font is loaded and again after it loaded made items hop into/out of the "More" menu
    // while the nav was already visible. Only reveal the nav once fonts are settled (with a
    // short safety timeout so it never stays hidden).
    let fontsSettled = !document.fonts || document.fonts.status === "loaded";
    const measure = () => {
      if (getComputedStyle(nav).display === "none") {
        return;
      }
      const cs = getComputedStyle(header);
      const pad = Math.max(
        parseFloat(cs.paddingLeft) || 0,
        parseFloat(cs.paddingRight) || 0,
      );
      const side = Math.max(left.offsetWidth, right.offsetWidth);
      const symmetricW =
        Math.floor((header.clientWidth - 2 * (pad + side + NAV_SIDE_GAP)) / 2) *
        2;
      const contentW = readContentW();
      const aligned = contentW > 0;
      const navW = aligned
        ? Math.min(
            Math.round((contentW + 2 * NAV_EDGE_PAD) / 2) * 2,
            symmetricW,
          )
        : symmetricW;
      setNavAligned(aligned);
      setNavWidth(Math.max(navW, 0));
      const available = navW - 4;
      if (available <= 0) return;
      const widths = (Array.from(ghost.children) as HTMLElement[]).map(
        (el) => el.offsetWidth,
      );
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
      if (fontsSettled) {
        setNavReady(true);
        // remember the settled layout so the next reload can paint it immediately
        saveNavLayout(pathnameRef.current, {
          vc: count,
          w: Math.max(navW, 0),
          al: aligned,
        });
      }
    };
    observer = new ResizeObserver(measure);
    measure();
    observer.observe(header);
    observer.observe(left);
    observer.observe(right);
    observer.observe(ghost);
    document.fonts?.ready.then(() => {
      fontsSettled = true;
      measure();
    });
    const failSafe = window.setTimeout(() => {
      fontsSettled = true;
      measure();
      setNavReady(true);
    }, 250);
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
      window.clearTimeout(failSafe);
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
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const isActive = (prefix: string) =>
    pathname === prefix || !!pathname?.startsWith(`${prefix}/`);
  const hiddenItems = NAV_ITEMS.slice(visibleCount);
  const menuSetter = (id: string) => (v: boolean) =>
    setOpenMenu((cur) => (v ? id : cur === id ? null : cur));
  const iconButton =
    "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 outline-none transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";
  const profileLinkClass =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900";
  return (
    <>
      {/* স্কেল চালু থাকলে এই র‍্যাপার স্কেল-করা উচ্চতা ধরে রাখে ও sticky থাকে */}
      <div
        className={
          scaleWithZoom ? "nav-zoom-wrap sticky top-0 z-50" : "contents"
        }
      >
        <header
          ref={headerRef}
          className={`${scaleWithZoom ? "nav-zoom-header " : ""}sticky top-0 z-50 flex h-16 w-full items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 shadow-sm backdrop-blur-md sm:gap-3 sm:px-6`}
        >
          {/* ------------------------------------------------------------ */}
          {/* Left: Logo                                                   */}
          {/* ------------------------------------------------------------ */}

          <div
            ref={leftRef}
            className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
          >
            <Link href="/" className="flex min-w-0 shrink items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#2563EB] text-[14px] font-bold tracking-tight text-white">
                SH
              </div>

              <div className="flex min-w-0 flex-col leading-none">
                <span className="truncate text-[17px] font-bold tracking-tight text-slate-900 sm:text-[19px]">
                  <DT>{"Sohoj"}</DT>
                  <span className="text-[#2563EB]">
                    <DT>{" Hub"}</DT>
                  </span>
                </span>
              </div>
            </Link>

            <Link
              href="/dashboard"
              aria-label={t("Dashboard")}
              title={t("Dashboard")}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 ${isActive("/dashboard") ? "border-blue-200 bg-blue-50 text-[#1D4ED8]" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8]"}`}
            >
              <LayoutDashboard size={18} strokeWidth={2.1} />
            </Link>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Center: Navigation                                           */}
          {/* ------------------------------------------------------------ */}

          <nav
            ref={navRef}
            aria-label={t("Main")}
            style={{
              // until the first settled measurement, use the layout cached by the head script
              width: navReady ? navWidth : "var(--nav-w, 0px)",
              left: navReady
                ? `calc(50% - ${navWidth / 2}px)`
                : "calc(50% - var(--nav-w, 0px) / 2)",
              justifyContent: navReady
                ? navAligned
                  ? "space-between"
                  : "center"
                : "var(--nav-j, center)",
            }}
            className={`absolute top-0 hidden h-full items-center gap-0.5 text-[13px] font-medium lg:flex 2xl:text-[13.5px] 2xl:font-semibold ${navReady ? "opacity-100 transition-opacity duration-150" : "opacity-0 [html[data-nav-pre]_&]:opacity-100"}`}
          >
            {/* Hidden measuring copy */}
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
                    <IconTile icon={MoreIcon} tone="slate" />

                    <span>
                      <DT>{"More"}</DT>
                    </span>

                    <ChevronDown size={13} className="-ml-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Every item is always rendered; the ones that don't fit are display:none. Before the
                first settled measurement the choice comes from the cached --ni-N variables. */}
            {NAV_ITEMS.map((item, index) => (
              <div
                key={item.id}
                className="contents"
                style={{
                  display: navReady
                    ? index < visibleCount
                      ? "contents"
                      : "none"
                    : `var(--ni-${index}, contents)`,
                }}
              >
                {item.menu ? (
                  <NavDropdown
                    item={item}
                    open={openMenu === item.id}
                    setOpen={menuSetter(item.id)}
                    active={isActive(item.match)}
                  />
                ) : (
                  <NavItem item={item} active={isActive(item.match)} />
                )}
              </div>
            ))}

            <div
              className="contents"
              style={{
                display: navReady
                  ? hiddenItems.length > 0
                    ? "contents"
                    : "none"
                  : "var(--nav-more, none)",
              }}
            >
              <MoreMenu
                items={hiddenItems}
                open={moreOpen}
                setOpen={setMoreOpen}
                active={hiddenItems.some((item) => isActive(item.match))}
                isActive={isActive}
              />
            </div>
          </nav>

          {/* ------------------------------------------------------------ */}
          {/* Right                                                        */}
          {/* ------------------------------------------------------------ */}

          <div
            ref={rightRef}
            className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          >
            {/* Language switcher */}
            <div className="hidden shrink-0 items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold min-[1900px]:inline-flex">
              <button
                type="button"
                onClick={() => changeLanguage("EN")}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                  locale === "en"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <DT>{"EN\n              "}</DT>
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("BN")}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                  locale === "bn"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <DT>{"\u09AC\u09BE\u0982\n              "}</DT>
              </button>
            </div>

            {/* Search */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className={iconButton}
                aria-label={t("Search")}
                aria-expanded={isSearchOpen}
              >
                <Search size={16} />
              </button>
            </div>

            {/* Profile */}
            <div className="relative z-50 shrink-0" ref={profileRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-1 pr-1 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 sm:pr-2"
              >
                <div className="user-avatar-bg flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-bold uppercase text-white">
                  {user?.profileImageUrl ? (
                    <img
                      src={`${user.profileImageUrl}${
                        user.updatedAt
                          ? `${user.profileImageUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(user.updatedAt)}`
                          : ""
                      }`}
                      alt={`${user?.fullName || t("User")} profile photo`}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="user-pre" data-k={userHydrated ? 1 : 0}>
                      {userHydrated ? getInitials(user?.fullName) : null}
                    </span>
                  )}
                </div>

                <div className="hidden flex-col leading-tight min-[2200px]:flex">
                  <span
                    className="user-name-pre max-w-[120px] truncate text-xs font-semibold text-[#0F172A]"
                    data-k={userHydrated ? 1 : 0}
                  >
                    {userHydrated ? (
                      <DT>{user?.fullName || "User Account"}</DT>
                    ) : null}
                  </span>

                  <span
                    className="user-sub-pre max-w-[120px] truncate text-[11px] text-slate-500"
                    data-k={userHydrated ? 1 : 0}
                  >
                    {userHydrated ? (
                      <DT>{user?.phoneNumber || user?.email || "User"}</DT>
                    ) : null}
                  </span>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden shrink-0 text-slate-500 transition-transform duration-200 sm:block ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* -------------------------------------------------------- */}
              {/* Profile Dropdown                                         */}
              {/* -------------------------------------------------------- */}

              {dropdownOpen && (
                <div className="absolute right-0 z-[100] mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-1.5 text-[13px] shadow-[0_10px_30px_-10px_rgba(15,23,42,0.18)] animate-in fade-in duration-150">
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
                    <span className="font-medium text-slate-700">
                      <DT>{"Language"}</DT>
                    </span>

                    <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => changeLanguage("EN")}
                        className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                          locale === "en"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <DT>{"EN\n                      "}</DT>
                      </button>

                      <button
                        type="button"
                        onClick={() => changeLanguage("BN")}
                        className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                          locale === "bn"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <DT>{"\u09AC\u09BE\u0982\n                      "}</DT>
                      </button>
                    </div>
                  </div>

                  {/* Dashboard */}
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className={`${profileLinkClass} ${isActive("/dashboard") ? "bg-blue-50 text-[#1D4ED8]" : ""}`}
                  >
                    <LayoutDashboard
                      size={15}
                      className={
                        isActive("/dashboard")
                          ? "text-[#2563EB]"
                          : "text-slate-500"
                      }
                    />
                    <DT>{"Dashboard\n                  "}</DT>
                  </Link>

                  {/* My Profile */}
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className={profileLinkClass}
                  >
                    <UserIcon size={15} className="text-slate-500" />
                    <DT>{"My Profile\n                  "}</DT>
                  </Link>

                  {/* Subscription */}
                  <Link
                    href="/subscription"
                    onClick={() => setDropdownOpen(false)}
                    className={profileLinkClass}
                  >
                    <CreditCard size={15} className="text-slate-500" />
                    <DT>{"Subscription\n                  "}</DT>
                  </Link>

                  {/* Settings */}
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className={profileLinkClass}
                  >
                    <Settings size={15} className="text-slate-500" />
                    <DT>{"Settings\n                  "}</DT>
                  </Link>

                  {/* Divider */}
                  <div className="my-1 border-t border-slate-100" />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    <DT>{"Logout\n                  "}</DT>
                  </button>
                </div>
              )}
            </div>

            {/* Menu drawer trigger */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={iconButton}
              aria-label={t("Open Menu")}
              title={t("Menu")}
            >
              <PanelRightOpen size={18} />
            </button>
          </div>
        </header>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Search Modal                                                   */}
      {/* -------------------------------------------------------------- */}

      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-900/40 px-4 pt-[14vh] backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsSearchOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Search size={18} className="shrink-0 text-[#2563EB]" />

              <input
                type="text"
                autoFocus
                placeholder={t("Search tools and features...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 bg-transparent text-[15px] font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <DT>{"Esc\n              "}</DT>
              </button>
            </div>

            {/* Body */}
            {normalizedSearchQuery ? (
              <div className="max-h-[min(420px,55vh)] overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <Link
                          key={tool.id}
                          href={`/sohoj-tools/${getSlug(tool.name)}`}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tool.bgColor}`}
                          >
                            <ToolIcon size={24} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-[#0F172A]">
                              {<DT>{tool.name}</DT>}
                            </span>

                            <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                              {tool.category}
                              {tool.access === "paid" ? (
                                <DT>{" • Paid"}</DT>
                              ) : (
                                <DT>{" • Free"}</DT>
                              )}
                              {tool.badge ? (
                                <DT>{` • ${tool.badge}`}</DT>
                              ) : (
                                <DT>{""}</DT>
                              )}
                            </span>
                          </span>

                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                            <DT>{"Open\n                          "}</DT>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center px-6 py-12 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Search size={20} />
                    </span>

                    <p className="mt-4 text-sm font-black text-[#0F172A]">
                      <DT>{"No matching tools found\n                    "}</DT>
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      <DT>
                        {
                          "Try another tool name, category, or keyword.\n                    "
                        }
                      </DT>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                  <Search size={20} />
                </span>

                <p className="mt-4 text-sm font-black text-[#0F172A]">
                  <DT>{"Search tools and features\n                "}</DT>
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  <DT>
                    {"Start typing to find what you need.\n                "}
                  </DT>
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold text-slate-400">
              <span>
                <DT>{"Press Esc to close"}</DT>
              </span>

              <span className="flex shrink-0 items-center gap-1 font-mono">
                <Command size={10} />
                <DT>{"K\n              "}</DT>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------- */}
      {/* Sidebar Drawer                                                 */}
      {/* -------------------------------------------------------------- */}

      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
