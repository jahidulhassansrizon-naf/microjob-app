"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { T } from "@/components/i18n/I18nProvider";

/** Shared easing + tokens for the Seba Lagbe premium look. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const GRAD_TEXT =
  "bg-gradient-to-r from-blue-700 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent";

/** Gradient tiles for icons — pick by index so neighbouring cards differ. */
export const TILE_TONES = [
  "from-blue-600 to-indigo-600 shadow-indigo-500/30",
  "from-indigo-600 to-violet-600 shadow-violet-500/30",
  "from-violet-600 to-fuchsia-600 shadow-fuchsia-500/30",
  "from-sky-500 to-blue-600 shadow-sky-500/30",
  "from-emerald-500 to-teal-600 shadow-emerald-500/30",
  "from-amber-500 to-orange-500 shadow-amber-500/30",
];

export function IconTile({
  children,
  tone = 0,
  size = "md",
}: {
  children: ReactNode;
  tone?: number;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-14 w-14 rounded-2xl" : size === "sm" ? "h-10 w-10 rounded-xl" : "h-12 w-12 rounded-[14px]";
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br text-white shadow-lg ring-1 ring-white/25 ${dim} ${
        TILE_TONES[tone % TILE_TONES.length]
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/35 to-transparent"
      />
      <span className="relative">{children}</span>
    </span>
  );
}

/** Soft aurora + fine grid, placed behind a section. */
export function Aurora({
  variant = "top",
}: {
  variant?: "top" | "bottom" | "side";
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {variant === "side" ? (
        <>
          <div className="absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-blue-300/35 to-indigo-300/25 blur-3xl" />
          <div className="absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tl from-fuchsia-200/45 to-violet-300/30 blur-3xl" />
        </>
      ) : (
        <>
          <div
            className={`absolute left-[6%] h-[26rem] w-[40rem] rounded-full bg-gradient-to-r from-blue-300/35 to-indigo-300/25 blur-3xl ${
              variant === "top" ? "-top-48" : "-bottom-48"
            }`}
          />
          <div
            className={`absolute right-[-6%] h-[24rem] w-[34rem] rounded-full bg-gradient-to-l from-fuchsia-200/45 to-violet-300/35 blur-3xl ${
              variant === "top" ? "-top-40" : "-bottom-40"
            }`}
          />
        </>
      )}
      <div
        className={`absolute inset-0 [background-image:linear-gradient(to_right,rgba(30,41,99,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,99,0.05)_1px,transparent_1px)] [background-size:56px_56px] ${
          variant === "bottom"
            ? "[mask-image:radial-gradient(ellipse_80%_60%_at_50%_100%,#000_25%,transparent_100%)]"
            : "[mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_25%,transparent_100%)]"
        }`}
      />
    </div>
  );
}

/** Pill-shaped eyebrow with a gradient chip. */
export function Eyebrow({
  children,
  icon,
  dark = false,
}: {
  children: ReactNode;
  icon?: ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[11.5px] font-bold backdrop-blur ${
        dark
          ? "border border-white/15 bg-white/10 text-white"
          : "border border-indigo-200/70 bg-white/80 text-indigo-700 shadow-sm"
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white">
        {icon ?? <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      {children}
    </span>
  );
}

export function SectionHead({
  eyebrow,
  icon,
  title,
  sub,
  align = "center",
}: {
  eyebrow: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  align?: "center" | "left";
}) {
  const center = align === "center";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`flex flex-col gap-5 ${
        center ? "mx-auto max-w-3xl items-center text-center" : "items-start text-left"
      }`}
    >
      <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
      <h2 className="text-[34px] font-black leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-[52px]">
        {title}
      </h2>
      {sub && (
        <p className="max-w-xl text-[15px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
          {sub}
        </p>
      )}
    </motion.div>
  );
}

/** Card with a cursor-following indigo spotlight. */
export function SpotCard({
  children,
  className = "",
  innerClassName = "p-7",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  dark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group relative flex flex-col overflow-hidden rounded-[26px] transition-[box-shadow,transform] duration-300 ${
        dark
          ? "bg-slate-950 text-white ring-1 ring-white/10"
          : "bg-white shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_34px_-24px_rgba(30,41,99,0.35)] ring-1 ring-slate-200/80 hover:shadow-[0_28px_56px_-28px_rgba(67,56,202,0.45)]"
      } ${className}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          dark
            ? "[background:radial-gradient(380px_circle_at_var(--mx,50%)_var(--my,50%),rgba(129,140,248,0.22),transparent_62%)]"
            : "[background:radial-gradient(380px_circle_at_var(--mx,50%)_var(--my,50%),rgba(99,102,241,0.11),transparent_62%)]"
        }`}
      />
      <div className={`relative z-10 flex flex-1 flex-col ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}

/** "Video coming soon" marker used across sections. */
export function SoonChip({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`inline-flex w-fit cursor-default select-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
        dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"
      }`}
    >
      <Play size={10} />
      <T>{"Video coming soon"}</T>
    </span>
  );
}

/** Primary gradient button with a shine sweep. */
export const BTN_PRIMARY =
  "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 text-sm font-bold text-white shadow-[0_18px_34px_-14px_rgba(79,70,229,0.75)] ring-1 ring-white/20 transition duration-300 hover:-translate-y-0.5";

export function Shine() {
  return (
    <span
      aria-hidden
      className="absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[420%]"
    />
  );
}
