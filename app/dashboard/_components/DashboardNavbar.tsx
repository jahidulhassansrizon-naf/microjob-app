// app/dashboard/_components/DashboardNavbar.tsx
"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { DT } from "./DashboardText";
import {
  useEffect,
  useLayoutEffect,
  useId,
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
  blue: "bg-[#DC2626] text-white",
  violet: "bg-[#DC2626] text-white",
  pink: "bg-[#DC2626] text-white",
  emerald: "bg-emerald-600 text-white",
  indigo: "bg-[#DC2626] text-white",
  red: "bg-red-500 text-white",
  amber: "bg-amber-500 text-white",
  cyan: "bg-[#DC2626] text-white",
  orange: "bg-[#D42020] text-white",
  slate: "bg-[#7A6A50] text-white",
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
const MyFilesMono: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path
      {...DUO}
      d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5z"
    />
    <path d="M3 11h18" />
  </svg>
);

/* AI Editor - photo with a sparkle */
const AIEditorMono: NavIcon = ({ size = 22, className }) => (
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
const ManualEditorMono: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path d="M4 7h8.6M17.4 7H20M4 17h2.6M11.4 17H20" />
    <circle {...DUO_STRONG} cx="15" cy="7" r="2.4" />
    <circle {...DUO_STRONG} cx="9" cy="17" r="2.4" />
  </svg>
);

/* Bulk Photo Edit - stack of photos */
const BulkPhotoMono: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <path d="M7 4.5h11.5A2.5 2.5 0 0 1 21 7v11.5" />
    <rect {...DUO} x="3" y="7.5" width="15" height="13" rx="2.5" />
    <circle cx="7.8" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <path d="m3.5 18 4.2-4 3 2.8 2.3-2.3 4.5 3.5" />
  </svg>
);

/* AI Template - ready-made layout */
const AITemplateMono: NavIcon = ({ size = 22, className }) => (
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
const QuestionPaperMono: NavIcon = ({ size = 22, className }) => (
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
const PrintMediaMono: NavIcon = ({ size = 22, className }) => (
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
const AllToolsMono: NavIcon = ({ size = 22, className }) => (
  <svg {...GLYPH} width={size} height={size} className={className}>
    <rect {...DUO} x="3" y="7.5" width="18" height="12.5" rx="2.5" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
    <path d="M3 13h18M10.5 13v2h3v-2" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Realistic full-colour navbar icons: pure SVG, 48px grid, layered    */
/* gradients, bevels, gloss and soft shadows. Every instance gets its  */
/* own gradient ids via useId so they never collide. On the active     */
/* (blue) nav item the mono duotone version above is shown instead.    */
/* ------------------------------------------------------------------ */
const SVG_BASE = { viewBox: "0 0 48 48", fill: "none", "aria-hidden": true } as const;
function useGid() {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}
type Stop = [number, string, number?];
function Lin({ id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1 }: { id: string; stops: Stop[]; x1?: number; y1?: number; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
      ))}
    </linearGradient>
  );
}
function Rad({ id, stops, cx = 0.5, cy = 0.5, r = 0.5 }: { id: string; stops: Stop[]; cx?: number; cy?: number; r?: number }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
      ))}
    </radialGradient>
  );
}
/** Soft contact shadow under every icon. */
function Floor({ u }: { u: string }) {
  return (
    <>
      <defs>
        <Rad id={`${u}fl`} stops={[[0, "#0F172A", 0.38], [1, "#0F172A", 0]]} />
      </defs>
      <ellipse cx="24" cy="44" rx="18.5" ry="3" fill={`url(#${u}fl)`} />
    </>
  );
}
const star = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}l${r * 0.26} ${r * 0.74} ${r * 0.74} ${r * 0.26}-${r * 0.74} ${r * 0.26}-${r * 0.26} ${r * 0.74}-${r * 0.26}-${r * 0.74}-${r * 0.74}-${r * 0.26} ${r * 0.74}-${r * 0.26}z`;

/* My Files - manila folder with papers */
const MyFilesColor: NavIcon = ({ size = 22, className }) => {
  const u = useGid();
  return (
    <svg {...SVG_BASE} width={size} height={size} className={className}>
      <defs>
        <Lin id={`${u}b`} stops={[[0, "#F2A93B"], [1, "#B35E08"]]} />
        <Lin id={`${u}f`} stops={[[0, "#FFE593"], [0.55, "#F8B02A"], [1, "#E08A0B"]]} />
        <Lin id={`${u}p`} stops={[[0, "#FFFFFF"], [1, "#E6EDF7"]]} />
      </defs>
      <Floor u={u} />
      <path d="M4 12.5A4.5 4.5 0 0 1 8.5 8h10.2a3.4 3.4 0 0 1 2.6 1.2L24 12.5h15.5A4.5 4.5 0 0 1 44 17v21a4.5 4.5 0 0 1-4.5 4.5h-31A4.5 4.5 0 0 1 4 38z" fill={`url(#${u}b)`} />
      <g transform="rotate(-4 24 24)">
        <rect x="9" y="11" width="29" height="22" rx="2" fill="#C9DAF3" />
      </g>
      <g transform="rotate(2.5 24 24)">
        <rect x="10" y="12.5" width="29" height="22" rx="2" fill={`url(#${u}p)`} stroke="#CBD6E6" strokeWidth=".8" />
        <path d="M14 18h14M14 22.5h20M14 27h11" stroke="#9FB1C9" strokeWidth="1.7" strokeLinecap="round" />
      </g>
      <path d="M4 22A4.5 4.5 0 0 1 8.5 17.5h31A4.5 4.5 0 0 1 44 22v16a4.5 4.5 0 0 1-4.5 4.5h-31A4.5 4.5 0 0 1 4 38z" fill={`url(#${u}f)`} />
      <path d="M4 22A4.5 4.5 0 0 1 8.5 17.5h31A4.5 4.5 0 0 1 44 22v5.5C32 31 16 31 4 27.5z" fill="#fff" fillOpacity=".16" />
      <path d="M6 21.8a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3" stroke="#fff" strokeOpacity=".75" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 38.5a3.5 3.5 0 0 0 3.5 3h31a3.5 3.5 0 0 0 3.5-3" stroke="#B35E08" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

/* AI Editor - glossy photo frame with landscape and magic sparkles */
const AIEditorColor: NavIcon = ({ size = 22, className }) => {
  const u = useGid();
  return (
    <svg {...SVG_BASE} width={size} height={size} className={className}>
      <defs>
        <Lin id={`${u}fr`} stops={[[0, "#BBA4FF"], [0.5, "#7048E8"], [1, "#4527B0"]]} />
        <Lin id={`${u}sk`} stops={[[0, "#6EC1FF"], [1, "#EAF7FF"]]} />
        <Rad id={`${u}sn`} stops={[[0, "#FFF7B8"], [0.45, "#FFD54A", 0.9], [1, "#FFD54A", 0]]} />
        <Lin id={`${u}gr`} stops={[[0, "#52D9A0"], [1, "#139B6B"]]} />
        <Lin id={`${u}st`} stops={[[0, "#FFF0A8"], [1, "#F59E0B"]]} />
        <clipPath id={`${u}cp`}>
          <rect x="9" y="10" width="26" height="26" rx="3.6" />
        </clipPath>
      </defs>
      <Floor u={u} />
      <rect x="5" y="6" width="34" height="34" rx="7.5" fill={`url(#${u}fr)`} />
      <rect x="5.6" y="6.6" width="32.8" height="32.8" rx="6.9" stroke="#fff" strokeOpacity=".45" strokeWidth="1" />
      <g clipPath={`url(#${u}cp)`}>
        <rect x="9" y="10" width="26" height="26" fill={`url(#${u}sk)`} />
        <circle cx="16" cy="18" r="9" fill={`url(#${u}sn)`} />
        <circle cx="16" cy="18" r="3.3" fill="#FFD23F" />
        <path d="M9 33l9.5-12 5.5 6.5 5-5 6 8.5V36H9z" fill="#8C75F2" />
        <path d="M18.5 21l3.2 3.8-1.7-.9-1.5 1.7-1.5-1.7-1.7.9z" fill="#fff" fillOpacity=".92" />
        <path d="M9 36l6.5-8 6 6.5 6-7.5L35 36z" fill="#5B3CC9" />
        <path d="M9 36v-3.4c8.5-3.6 17-1 26 .8V36z" fill={`url(#${u}gr)`} />
        <path d="M9 10h26v8.5C26 22 16 17.5 9 22z" fill="#fff" fillOpacity=".2" />
      </g>
      <path d={star(37, 10, 8.5)} fill={`url(#${u}st)`} stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={star(42.2, 24, 4.2)} fill="#FFE27A" stroke="#fff" strokeWidth=".8" strokeLinejoin="round" />
    </svg>
  );
};

/* Manual Editor - glossy control panel with 3D slider knobs */
const ManualEditorColor: NavIcon = ({ size = 22, className }) => {
  const u = useGid();
  const rows: [number, number][] = [[12, 28], [22, 19], [32, 31]];
  return (
    <svg {...SVG_BASE} width={size} height={size} className={className}>
      <defs>
        <Lin id={`${u}pn`} stops={[[0, "#FFA3CF"], [0.5, "#E6408F"], [1, "#B01C69"]]} />
        <Rad id={`${u}kn`} cx={0.38} cy={0.32} r={0.75} stops={[[0, "#FFFFFF"], [0.6, "#EEF1F7"], [1, "#BFC7D6"]]} />
        <Lin id={`${u}gv`} stops={[[0, "#7E0F4A"], [1, "#B7266F"]]} />
        <Lin id={`${u}fi`} stops={[[0, "#FFFFFF"], [1, "#FFD3E8"]]} />
        <filter id={`${u}bl`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation=".9" />
        </filter>
      </defs>
      <Floor u={u} />
      <rect x="5" y="5" width="38" height="38" rx="9.5" fill={`url(#${u}pn)`} />
      <rect x="5.6" y="5.6" width="36.8" height="36.8" rx="8.9" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
      <path d="M5 15a9.5 9.5 0 0 1 9.5-10h19A9.5 9.5 0 0 1 43 15v5C32 25 16 25 5 20z" fill="#fff" fillOpacity=".16" />
      {rows.map(([y, kx]) => (
        <g key={y}>
          <rect x="10.5" y={y - 2.5} width="27" height="5" rx="2.5" fill={`url(#${u}gv)`} />
          <rect x="10.5" y={y - 2.5} width={kx - 10.5} height="5" rx="2.5" fill={`url(#${u}fi)`} />
          <circle cx={kx + 0.7} cy={y + 1.8} r="5.2" fill="#3A0522" fillOpacity=".45" filter={`url(#${u}bl)`} />
          <circle cx={kx} cy={y} r="5.2" fill={`url(#${u}kn)`} stroke="#fff" strokeOpacity=".8" strokeWidth=".8" />
          <circle cx={kx} cy={y} r="2.1" fill={`url(#${u}pn)`} />
          <circle cx={kx - 0.6} cy={y - 0.7} r=".7" fill="#fff" fillOpacity=".7" />
        </g>
      ))}
    </svg>
  );
};

/* Bulk Photo Edit - fanned stack of instant photos */
const BulkPhotoColor: NavIcon = ({ size = 22, className }) => {
  const u = useGid();
  return (
    <svg {...SVG_BASE} width={size} height={size} className={className}>
      <defs>
        <Lin id={`${u}a`} stops={[[0, "#8EE3FF"], [1, "#1E9BE0"]]} />
        <Lin id={`${u}c`} stops={[[0, "#FFC49B"], [1, "#FF6B5E"]]} />
        <Lin id={`${u}sk`} stops={[[0, "#5FBCFF"], [1, "#E8F6FF"]]} />
        <Lin id={`${u}gr`} stops={[[0, "#4FD99B"], [1, "#0F9A66"]]} />
        <Lin id={`${u}pp`} stops={[[0, "#FFFFFF"], [1, "#EEF2F8"]]} />
        <Rad id={`${u}sn`} stops={[[0, "#FFF4A8"], [1, "#FFD23F", 0]]} />
        <filter id={`${u}bl`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>
      <Floor u={u} />
      <g transform="rotate(-13 24 27)">
        <rect x="8.8" y="10.5" width="24" height="29" rx="2.3" fill="#0F172A" fillOpacity=".3" filter={`url(#${u}bl)`} />
        <rect x="8" y="9" width="24" height="29" rx="2.3" fill={`url(#${u}pp)`} stroke="#D3DBE7" strokeWidth=".8" />
        <rect x="10.5" y="11.5" width="19" height="18" rx="1.2" fill={`url(#${u}a)`} />
      </g>
      <g transform="rotate(11 24 27)">
        <rect x="16.8" y="10.5" width="24" height="29" rx="2.3" fill="#0F172A" fillOpacity=".3" filter={`url(#${u}bl)`} />
        <rect x="16" y="9" width="24" height="29" rx="2.3" fill={`url(#${u}pp)`} stroke="#D3DBE7" strokeWidth=".8" />
        <rect x="18.5" y="11.5" width="19" height="18" rx="1.2" fill={`url(#${u}c)`} />
      </g>
      <rect x="12.8" y="9.5" width="24" height="31" rx="2.5" fill="#0F172A" fillOpacity=".32" filter={`url(#${u}bl)`} />
      <rect x="12" y="8" width="24" height="31" rx="2.5" fill={`url(#${u}pp)`} stroke="#D3DBE7" strokeWidth=".8" />
      <rect x="14.5" y="10.5" width="19" height="19" rx="1.2" fill={`url(#${u}sk)`} />
      <circle cx="20" cy="15.5" r="5" fill={`url(#${u}sn)`} />
      <circle cx="20" cy="15.5" r="2.1" fill="#FFD23F" />
      <path d="M14.5 29.5v-4l5-5.5 4 4 3-3 6.5 7.5v1z" fill="#7B66E8" />
      <path d="M14.5 29.5v-2.2c6-2.6 12-1.4 19 .4v1.8z" fill={`url(#${u}gr)`} />
      <path d="M14.5 10.5h19v6C27 19 20 15.5 14.5 18z" fill="#fff" fillOpacity=".22" />
      <path d="M16 34h10" stroke="#C3CCDA" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/* AI Template - design window with hero image, text blocks and sparkle */
const AITemplateColor: NavIcon = ({ size = 22, className }) => {
  const u = useGid();
  return (
    <svg {...SVG_BASE} width={size} height={size} className={className}>
      <defs>
        <Lin id={`${u}tb`} stops={[[0, "#93A3FF"], [1, "#4B43E0"]]} />
        <Lin id={`${u}hr`} x2={1} stops={[[0, "#8B7CFA"], [0.55, "#D46AE8"], [1, "#FF8FA3"]]} />
        <Lin id={`${u}bt`} stops={[[0, "#7C8BFF"], [1, "#3F37C9"]]} />
        <Lin id={`${u}wd`} stops={[[0, "#FFFFFF"], [1, "#EDF1F9"]]} />
        <Lin id={`${u}st`} stops={[[0, "#FFF0A8"], [1, "#F59E0B"]]} />
      </defs>
      <Floor u={u} />
      <rect x="4.5" y="6" width="37" height="35.5" rx="5.5" fill={`url(#${u}wd)`} stroke="#B9C4F5" strokeWidth="1" />
      <path d="M4.5 11.5A5.5 5.5 0 0 1 10 6h26a5.5 5.5 0 0 1 5.5 5.5V15h-37z" fill={`url(#${u}tb)`} />
      <path d="M10 6.6h26" stroke="#fff" strokeOpacity=".5" strokeWidth="1" strokeLinecap="round" />
      <circle cx="9.6" cy="10.8" r="1.3" fill="#FF6B6B" />
      <circle cx="14" cy="10.8" r="1.3" fill="#FFD23F" />
      <circle cx="18.4" cy="10.8" r="1.3" fill="#4ADE80" />
      <rect x="8.5" y="18.5" width="29" height="11.5" rx="2.5" fill={`url(#${u}hr)`} />
      <circle cx="16" cy="23" r="2.2" fill="#fff" fillOpacity=".9" />
      <path d="M8.5 30v-1.5l8-5.5 5.5 4 5-3.5 10.5 6.5V30z" fill="#fff" fillOpacity=".35" />
      <rect x="8.5" y="33" width="15" height="2.8" rx="1.4" fill="#C2CBE0" />
      <rect x="8.5" y="37.3" width="10" height="2.8" rx="1.4" fill="#DCE2EF" />
      <rect x="26" y="33" width="11.5" height="7.2" rx="3.6" fill={`url(#${u}bt)`} />
      <path d="M28.5 34h6.5" stroke="#fff" strokeOpacity=".55" strokeWidth="1" strokeLinecap="round" />
      <path d={star(40.5, 35.5, 7.5)} fill={`url(#${u}st)`} stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
};

/* Question Papers - exam sheet with MCQ rows and a glossy red question badge */
const QuestionPaperColor: NavIcon = ({ size = 22, className }) => {
  const u = useGid();
  return (
    <svg {...SVG_BASE} width={size} height={size} className={className}>
      <defs>
        <Lin id={`${u}pp`} stops={[[0, "#FFFFFF"], [1, "#E9EEF6"]]} />
        <Lin id={`${u}fd`} x1={0} y1={0} x2={1} y2={1} stops={[[0, "#E7ECF4"], [1, "#AEB9CC"]]} />
        <Rad id={`${u}bd`} cx={0.35} cy={0.3} r={0.8} stops={[[0, "#FF9A9A"], [0.55, "#E5242F"], [1, "#9E0C18"]]} />
        <filter id={`${u}bl`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>
      <Floor u={u} />
      <path d="M12 5h18.5l9 9v25a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z" fill={`url(#${u}pp)`} stroke="#CBD5E3" strokeWidth="1" strokeLinejoin="round" />
      <path d="M30.5 5v6a3 3 0 0 0 3 3h6z" fill={`url(#${u}fd)`} />
      <rect x="12.5" y="11" width="13" height="3.2" rx="1.6" fill="#E5434F" />
      <circle cx="15" cy="21.5" r="2.5" fill="#22C55E" />
      <path d="M13.8 21.5l.9.9 1.7-1.8" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 21.5h12" stroke="#BCC7D8" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="28" r="2.2" stroke="#9FB0C9" strokeWidth="1.2" />
      <path d="M20 28h9" stroke="#BCC7D8" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="34.5" r="2.2" stroke="#9FB0C9" strokeWidth="1.2" />
      <path d="M20 34.5h6" stroke="#BCC7D8" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="35.8" cy="36.5" r="9" fill="#2A0508" fillOpacity=".4" filter={`url(#${u}bl)`} />
      <circle cx="35" cy="35" r="9" fill={`url(#${u}bd)`} stroke="#fff" strokeWidth="1.8" />
      <ellipse cx="32.4" cy="30.2" rx="4.8" ry="2.6" transform="rotate(-25 32.4 30.2)" fill="#fff" fillOpacity=".4" />
      <path d="M32.1 32.6a2.9 2.9 0 1 1 4.7 2.3c-1.2.9-1.8 1.4-1.8 2.8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35" cy="41" r="1.4" fill="#fff" />
    </svg>
  );
};

/* Print Media - desktop printer with colour print coming out */
const PrintMediaColor: NavIcon = ({ size = 22, className }) => {
  const u = useGid();
  return (
    <svg {...SVG_BASE} width={size} height={size} className={className}>
      <defs>
        <Lin id={`${u}bd`} stops={[[0, "#F7F9FC"], [0.55, "#CBD5E2"], [1, "#8C9DB3"]]} />
        <Lin id={`${u}tp`} stops={[[0, "#FFFFFF"], [1, "#E1E8F1"]]} />
        <Lin id={`${u}pp`} stops={[[0, "#FFFFFF"], [1, "#EEF2F8"]]} />
        <Lin id={`${u}ac`} x2={1} stops={[[0, "#2FB7F5"], [1, "#1470C9"]]} />
        <Rad id={`${u}gl`} stops={[[0, "#7CFFC2"], [1, "#22C55E", 0]]} />
      </defs>
      <Floor u={u} />
      <path d="M14.5 4h19a1.8 1.8 0 0 1 1.8 1.8V17H12.7V5.8A1.8 1.8 0 0 1 14.5 4z" fill={`url(#${u}pp)`} stroke="#C6D0DE" strokeWidth=".9" />
      <path d="M17 8.5h14M17 12h9" stroke="#C3CCDA" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="4" y="15" width="40" height="21" rx="6.5" fill={`url(#${u}bd)`} />
      <path d="M4 21.5A6.5 6.5 0 0 1 10.5 15h27a6.5 6.5 0 0 1 6.5 6.5V24H4z" fill={`url(#${u}tp)`} />
      <path d="M9 15.9h30" stroke="#fff" strokeOpacity=".85" strokeWidth="1" strokeLinecap="round" />
      <rect x="8.5" y="26" width="14" height="5.5" rx="1.6" fill="#10263F" />
      <path d="M10.5 28.7h6" stroke="#4FD1F5" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="29" cy="28.8" r="2" fill={`url(#${u}ac)`} />
      <circle cx="37" cy="28.8" r="3.6" fill={`url(#${u}gl)`} />
      <circle cx="37" cy="28.8" r="1.7" fill="#3BE08C" />
      <rect x="9" y="33" width="30" height="3" rx="1.5" fill="#1F3248" />
      <rect x="12" y="34" width="24" height="9.5" rx="1.3" fill={`url(#${u}pp)`} stroke="#C6D0DE" strokeWidth=".9" />
      <rect x="14.2" y="36.2" width="5.2" height="3.4" rx=".8" fill="#22C5F0" />
      <rect x="21.4" y="36.2" width="5.2" height="3.4" rx=".8" fill="#EC4899" />
      <rect x="28.6" y="36.2" width="5.2" height="3.4" rx=".8" fill="#FBBF24" />
      <path d="M14.2 41.6h12" stroke="#C3CCDA" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
};

/* All Tools - metal toolbox */
const AllToolsColor: NavIcon = ({ size = 22, className }) => {
  const u = useGid();
  return (
    <svg {...SVG_BASE} width={size} height={size} className={className}>
      <defs>
        <Lin id={`${u}bd`} stops={[[0, "#FF7E5B"], [0.5, "#E23F20"], [1, "#A9230E"]]} />
        <Lin id={`${u}ld`} stops={[[0, "#FFA282"], [1, "#EE5532"]]} />
        <Lin id={`${u}mt`} stops={[[0, "#FAFBFD"], [0.5, "#B3BECD"], [1, "#6F7B8C"]]} />
        <Lin id={`${u}hd`} x2={1} y2={0} stops={[[0, "#8793A5"], [0.45, "#F2F5F9"], [1, "#7C889A"]]} />
      </defs>
      <Floor u={u} />
      <path d="M16.5 15V10.5a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4V15" stroke="#4D5868" strokeWidth="4.4" strokeLinecap="round" />
      <path d="M16.5 15V10.5a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4V15" stroke={`url(#${u}hd)`} strokeWidth="3" strokeLinecap="round" />
      <rect x="4" y="14" width="40" height="28" rx="5.5" fill={`url(#${u}bd)`} />
      <path d="M4 19.5A5.5 5.5 0 0 1 9.5 14h29a5.5 5.5 0 0 1 5.5 5.5V27H4z" fill={`url(#${u}ld)`} />
      <path d="M8 15.4h32" stroke="#fff" strokeOpacity=".6" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 27h40" stroke="#8A1C0A" strokeOpacity=".7" strokeWidth="1.3" />
      <path d="M4 28.1h40" stroke="#fff" strokeOpacity=".28" strokeWidth="1" />
      <rect x="18.5" y="22.5" width="11" height="10" rx="2.2" fill={`url(#${u}mt)`} stroke="#59657A" strokeWidth=".9" />
      <rect x="22.2" y="26" width="3.6" height="4" rx="1.1" fill="#3E4858" />
      <circle cx="9.2" cy="20" r="1.4" fill="#FFD0C0" stroke="#A12512" strokeWidth=".7" />
      <circle cx="38.8" cy="20" r="1.4" fill="#FFD0C0" stroke="#A12512" strokeWidth=".7" />
      <circle cx="9.2" cy="36.5" r="1.4" fill="#FFB49E" stroke="#8E1D0A" strokeWidth=".7" />
      <circle cx="38.8" cy="36.5" r="1.4" fill="#FFB49E" stroke="#8E1D0A" strokeWidth=".7" />
    </svg>
  );
};

/** Pairs a colour icon with its mono duotone twin; CSS on the active nav item swaps them. */
const dual =
  (Color: NavIcon, Mono: NavIcon): NavIcon =>
  ({ size = 22, className }) => (
    <span className="inline-flex leading-none">
      <span className="nv-color inline-flex">
        <Color size={size} className={className} />
      </span>
      <span className="nv-mono hidden">
        <Mono size={size} className={className} />
      </span>
    </span>
  );
const MyFilesIcon = dual(MyFilesColor, MyFilesMono);
const AIEditorIcon = dual(AIEditorColor, AIEditorMono);
const ManualEditorIcon = dual(ManualEditorColor, ManualEditorMono);
const BulkPhotoIcon = dual(BulkPhotoColor, BulkPhotoMono);
const AITemplateIcon = dual(AITemplateColor, AITemplateMono);
const QuestionPaperIcon = dual(QuestionPaperColor, QuestionPaperMono);
const PrintMediaIcon = dual(PrintMediaColor, PrintMediaMono);
const AllToolsIcon = dual(AllToolsColor, AllToolsMono);

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
      className: "bg-[#F6D9A8] text-[#B91C1C] ring-1 ring-inset ring-[#DC2626]/15",
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
    label: "Seba Tools",
    icon: AllToolsIcon,
    tone: "orange",
    match: "/sohoj-tools",
  },
];
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
  blue: "text-[#DC2626]",
  violet: "text-[#DC2626]",
  pink: "text-[#DC2626]",
  emerald: "text-emerald-500",
  indigo: "text-[#DC2626]",
  red: "text-red-500",
  amber: "text-amber-500",
  cyan: "text-[#DC2626]",
  orange: "text-[#D42020]",
  slate: "text-[#7A6A50]",
};
function IconTile({ icon: Icon, tone }: { icon: NavIcon; tone: Tone }) {
  return (
    <span
      data-tone={tone}
      className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center transition-transform duration-200 group-hover:-translate-y-px group-hover:scale-110 [&_svg]:drop-shadow-[0_2px_3px_rgba(59,47,30,0.45)] ${ICON_TONES[tone]}`}
    >
      <Icon size={25} />
    </span>
  );
}
function UpcomingFlag() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 -rotate-[12deg] select-none items-center justify-center rounded-full border-[2.5px] border-red-600 bg-[#FBF6E8]/95 text-red-600"
    >
      <span className="absolute inset-[3px] rounded-full border border-red-600/80" />
      <span className="relative flex flex-col items-center leading-none">
        <span className="text-[11px] font-black uppercase tracking-[0.04em]">
          Coming
        </span>
        <span className="my-[2px] h-px w-6 bg-red-600/80" />
        <span className="text-[16px] font-black uppercase tracking-[0.04em]">
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
        className="relative z-[1] text-[11px] font-black uppercase leading-none tracking-[0.02em] text-white"
        style={{ textShadow: "0 1px 1px rgba(80,45,0,0.55)" }}
      >
        Pro
      </span>
    </span>
  );
}
const itemBase =
  "group relative flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40";
const itemActive =
  "bg-[#E8DABB] text-[#3B2F1E] shadow-[inset_0_0_0_1px_rgba(216,201,166,0.9)]";
const itemIdle =
  "text-[#3B2F1E] hover:bg-[#EFE3C8] hover:text-[#3B2F1E] hover:shadow-[inset_0_0_0_1px_rgba(216,201,166,0.9)]";
function NavLabel({ item, open }: { item: NavConfig; open?: boolean }) {
  return (
    <>
      <IconTile icon={item.icon} tone={item.tone} />

      <span>{<DT>{item.label}</DT>}</span>

      {item.proBadge && <ProBadge />}

      {item.tag && (
        <span
          className={`rounded px-1.5 text-[12px] font-semibold leading-[15px] ${item.tag.className}`}
        >
          {item.tag.text}
        </span>
      )}

      {item.accessTag && (
        <span
          className={`rounded px-1.5 text-[11px] font-semibold uppercase leading-[14px] ${item.accessTag.className}`}
        >
          <DT>{item.accessTag.text}</DT>
        </span>
      )}

      {item.menu && (
        <ChevronDown
          size={13}
          className={`nav-chev -ml-0.5 transition-transform duration-200 ${open ? "rotate-180 text-[#DC2626]" : "text-[#7A6A50]"}`}
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
        <div className="absolute left-0 top-full z-[100] w-52 rounded-xl border-2 border-[#DC2626] bg-[#F0DDB5] p-1.5 text-[15px] font-medium shadow-xl animate-in fade-in duration-150">
          <span aria-hidden="true" className="pointer-events-none absolute -top-[7px] left-6 h-3 w-3 rotate-45 border-l-2 border-t-2 border-[#DC2626] bg-[#F0DDB5]" />
          {item.menu.map((entry, index) => (
            <Link
              key={index}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-[#5A4A32] transition-colors hover:bg-[#EFE3C8] hover:text-[#3B2F1E]"
            >
              {entry}
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
  /* Responsive nav */
  const headerRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [navScale, setNavScale] = useState<number>(1);
  const [navWidth, setNavWidth] = useState<number>(0);
  const [navAligned, setNavAligned] = useState<boolean>(false);
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
    const inner = innerRef.current;
    if (!header || !left || !right || !nav || !inner) {
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
    // Only reveal the nav once fonts are settled (with a short safety timeout so it never
    // stays hidden). All nav items are always shown - there is no "More" menu.
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
      // All items must always be visible: if their natural width is larger than the space
      // available, the whole row is scaled down just enough to fit.
      const available = navW - 4;
      if (available > 0) {
        const kids = Array.from(inner.children) as HTMLElement[];
        const natural =
          kids.reduce((sum, el) => sum + el.offsetWidth, 0) +
          2 * Math.max(kids.length - 1, 0);
        setNavScale(natural > available ? Math.max(available / natural, 0.1) : 1);
      }
      if (fontsSettled) {
        setNavReady(true);
        // remember the settled layout so the next reload can paint it immediately
        saveNavLayout(pathnameRef.current, {
          vc: NAV_ITEMS.length,
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
    Array.from(inner.children).forEach((child) => observer?.observe(child));
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
  /* Default language: Bangla on the first visit of a browser session.
     After that the user's own EN/BN choice is respected. */
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("sohoj_nav_bn_default") === "1") return;
      window.sessionStorage.setItem("sohoj_nav_bn_default", "1");
    } catch {
      /* storage unavailable: still apply the default once */
    }
    if (locale !== "bn") setLocale("bn");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
  const menuSetter = (id: string) => (v: boolean) =>
    setOpenMenu((cur) => (v ? id : cur === id ? null : cur));
  const iconButton =
    "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#D8C9A6] bg-[#FBF6E8] text-[#5A4A32] outline-none transition-colors hover:border-[#DC2626]/50 hover:bg-[#EFE3C8] hover:text-[#3B2F1E] focus-visible:ring-2 focus-visible:ring-[#DC2626]/40";
  const profileLinkClass =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-[#5A4A32] transition-colors hover:bg-[#EFE3C8] hover:text-[#3B2F1E]";
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
          className={`navbar-font ${scaleWithZoom ? "nav-zoom-header " : ""}sticky top-0 z-50 flex h-16 w-full items-center justify-between gap-2 border-b border-[#D8C9A6] bg-gradient-to-b from-[#F2E8D2] to-[#EBDFC6] px-3 shadow-[0_8px_20px_-14px_rgba(59,47,30,0.30)] backdrop-blur-md sm:gap-3 sm:px-6`}
        >
          {/* ------------------------------------------------------------ */}
          {/* Left: Logo                                                   */}
          {/* ------------------------------------------------------------ */}

          <div
            ref={leftRef}
            className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
          >
            <Link href="/" className="flex min-w-0 shrink items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#EF4444] to-[#B91C1C] text-[16px] font-bold tracking-tight text-white ring-1 ring-[#F87171]/60 shadow-[0_6px_14px_-6px_rgba(220,38,38,0.6)]">
                SS
              </div>

              <div className="flex min-w-0 flex-col leading-none">
                <span className="truncate text-[19px] font-bold tracking-tight text-[#3B2F1E] sm:text-[21px]">
                  <DT>{"Studio"}</DT>
                  <span className="text-[#DC2626]">
                    <DT>{" Seba"}</DT>
                  </span>
                </span>
              </div>
            </Link>

            <Link
              href="/dashboard"
              aria-label={t("Dashboard")}
              title={t("Dashboard")}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${isActive("/dashboard") ? "border-[#D8C9A6] bg-[#E8DABB] text-[#3B2F1E]" : "border-[#D8C9A6] bg-[#FBF6E8] text-[#5A4A32] hover:border-[#DC2626]/50 hover:bg-[#EFE3C8] hover:text-[#3B2F1E]"}`}
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
              justifyContent: "center",
            }}
            className={`absolute top-0 hidden h-full items-center gap-0.5 text-[15px] font-medium lg:flex 2xl:text-[15.5px] 2xl:font-semibold ${navReady ? "opacity-100 transition-opacity duration-150" : "opacity-0"}`}
          >
            {/* Every item is always shown - there is no "More" menu. If space is short the
                whole row is scaled down to fit. */}
            <div
              ref={innerRef}
              className="flex h-full min-w-full items-center gap-0.5"
              style={{
                justifyContent: navAligned ? "space-between" : "center",
                transform: navScale < 1 ? `scale(${navScale})` : undefined,
                transformOrigin: "center center",
              }}
            >
              {NAV_ITEMS.map((item) =>
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
            <div className="hidden shrink-0 items-center rounded-lg bg-[#F3E9D2] p-0.5 ring-1 ring-[#D8C9A6] text-sm font-semibold min-[1900px]:inline-flex">
              <button
                type="button"
                onClick={() => changeLanguage("EN")}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                  locale === "en"
                    ? "bg-[#DC2626] text-white shadow-sm"
                    : "text-[#5A4A32] hover:text-[#3B2F1E]"
                }`}
              >
                <DT>{"EN\n              "}</DT>
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("BN")}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                  locale === "bn"
                    ? "bg-[#DC2626] text-white shadow-sm"
                    : "text-[#5A4A32] hover:text-[#3B2F1E]"
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
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#D8C9A6] bg-[#FBF6E8] py-1 pl-1 pr-1 text-left outline-none transition-colors hover:border-[#DC2626]/50 hover:bg-[#EFE3C8] focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 sm:pr-2"
              >
                <div className="user-avatar-bg flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3B2F1E] text-sm font-bold uppercase text-white ring-1 ring-[#DC2626]/50">
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
                    className="user-name-pre max-w-[120px] truncate text-sm font-semibold text-[#3B2F1E]"
                    data-k={userHydrated ? 1 : 0}
                  >
                    {userHydrated ? (
                      <DT>{user?.fullName || "User Account"}</DT>
                    ) : null}
                  </span>

                  <span
                    className="user-sub-pre max-w-[120px] truncate text-[13px] text-[#6B5A40]"
                    data-k={userHydrated ? 1 : 0}
                  >
                    {userHydrated ? (
                      <DT>{user?.phoneNumber || user?.email || "User"}</DT>
                    ) : null}
                  </span>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden shrink-0 text-[#7A6A50] transition-transform duration-200 sm:block ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* -------------------------------------------------------- */}
              {/* Profile Dropdown                                         */}
              {/* -------------------------------------------------------- */}

              {dropdownOpen && (
                <div className="absolute right-0 z-[100] mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border-2 border-[#DC2626] bg-[#F0DDB5] p-1.5 text-[15px] shadow-xl animate-in fade-in duration-150">
          <span aria-hidden="true" className="pointer-events-none absolute -top-[7px] right-6 h-3 w-3 rotate-45 border-l-2 border-t-2 border-[#DC2626] bg-[#F0DDB5]" />
                  {/* User info */}
                  <div className="mb-1 border-b border-[#E3D6B8] px-3 pb-2.5 pt-2">
                    <p className="truncate font-semibold text-[#3B2F1E]">
                      <DT>{user?.fullName || "User Account"}</DT>
                    </p>

                    <p className="mt-0.5 truncate text-sm text-[#7A6A50]">
                      <DT>{user?.phoneNumber || user?.email || "User"}</DT>
                    </p>
                  </div>

                  {/* Language */}
                  <div className="mb-1 flex items-center justify-between gap-2 px-3 py-2 min-[1900px]:hidden">
                    <span className="font-medium text-[#5A4A32]">
                      <DT>{"Language"}</DT>
                    </span>

                    <div className="inline-flex items-center rounded-lg bg-[#F3E9D2] p-0.5 text-sm font-semibold">
                      <button
                        type="button"
                        onClick={() => changeLanguage("EN")}
                        className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                          locale === "en"
                            ? "bg-[#FBF6E8] text-[#3B2F1E] shadow-sm"
                            : "text-[#5A4A32] hover:text-[#3B2F1E]"
                        }`}
                      >
                        <DT>{"EN\n                      "}</DT>
                      </button>

                      <button
                        type="button"
                        onClick={() => changeLanguage("BN")}
                        className={`cursor-pointer rounded-md px-2.5 py-1 transition-all duration-150 ${
                          locale === "bn"
                            ? "bg-[#FBF6E8] text-[#3B2F1E] shadow-sm"
                            : "text-[#5A4A32] hover:text-[#3B2F1E]"
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
                    className={`${profileLinkClass} ${isActive("/dashboard") ? "bg-[#F6D9A8] text-[#B91C1C]" : ""}`}
                  >
                    <LayoutDashboard
                      size={15}
                      className={
                        isActive("/dashboard")
                          ? "text-[#DC2626]"
                          : "text-[#7A6A50]"
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
                    <UserIcon size={15} className="text-[#7A6A50]" />
                    <DT>{"My Profile\n                  "}</DT>
                  </Link>

                  {/* Subscription */}
                  <Link
                    href="/subscription"
                    onClick={() => setDropdownOpen(false)}
                    className={profileLinkClass}
                  >
                    <CreditCard size={15} className="text-[#7A6A50]" />
                    <DT>{"Subscription\n                  "}</DT>
                  </Link>

                  {/* Settings */}
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className={profileLinkClass}
                  >
                    <Settings size={15} className="text-[#7A6A50]" />
                    <DT>{"Settings\n                  "}</DT>
                  </Link>

                  {/* Divider */}
                  <div className="my-1 border-t border-[#E3D6B8]" />

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
        <div className="navbar-font fixed inset-0 z-[200] flex items-start justify-center bg-[#3B2F1E]/40 px-4 pt-[14vh] backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsSearchOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-xl">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-[#E3D6B8] px-5 py-4">
              <Search size={18} className="shrink-0 text-[#DC2626]" />

              <input
                type="text"
                autoFocus
                placeholder={t("Search tools and features...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 bg-transparent text-[17px] font-medium text-[#3B2F1E] placeholder-[#B0A080] focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="cursor-pointer rounded-md border border-[#E3D6B8] bg-[#F6EEDB] px-2 py-1 text-[13px] font-bold text-[#7A6A50] transition-colors hover:bg-[#EFE3C8] hover:text-[#5A4A32]"
              >
                <DT>{"Esc\n              "}</DT>
              </button>
            </div>

            {/* Body */}
            {normalizedSearchQuery ? (
              <div className="scroll max-h-[min(420px,55vh)] overflow-y-auto p-2">
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
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tool.bgColor}`}
                          >
                            <ToolIcon size={24} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-bold text-[#3B2F1E]">
                              {<DT>{tool.name}</DT>}
                            </span>

                            <span className="mt-0.5 block truncate text-[13px] font-medium text-[#7A6A50]">
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

                          <span className="shrink-0 rounded-md bg-[#F3E9D2] px-2 py-1 text-[12px] font-bold text-[#7A6A50]">
                            <DT>{"Open\n                          "}</DT>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center px-6 py-12 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3E9D2] text-[#7A6A50]">
                      <Search size={20} />
                    </span>

                    <p className="mt-4 text-base font-black text-[#3B2F1E]">
                      <DT>{"No matching tools found\n                    "}</DT>
                    </p>

                    <p className="mt-1 text-sm font-medium text-[#7A6A50]">
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
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEE9E9] text-[#DC2626] ring-1 ring-inset ring-[#FBB6B6]">
                  <Search size={20} />
                </span>

                <p className="mt-4 text-base font-black text-[#3B2F1E]">
                  <DT>{"Search tools and features\n                "}</DT>
                </p>

                <p className="mt-1 text-sm font-medium text-[#7A6A50]">
                  <DT>
                    {"Start typing to find what you need.\n                "}
                  </DT>
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[#E3D6B8] bg-[#F6EEDB] px-5 py-3 text-[13px] font-semibold text-[#7A6A50]">
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
