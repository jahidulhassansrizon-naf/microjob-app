"use client";
import { T, useI18n } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, ShieldCheck, CreditCard } from "lucide-react";

const paymentMethods = [
  { label: "VISA", tone: "text-indigo-300" },
  { label: "Mastercard", tone: "text-rose-300" },
  { label: "American Express", tone: "text-blue-300" },
  { label: "Discover", tone: "text-slate-200" },
  { label: "UnionPay", tone: "text-red-300" },
  { label: "Diners Club", tone: "text-sky-300" },
  { label: "JCB", tone: "text-cyan-300" },
  { label: "Q-Cash", tone: "text-rose-300" },
  { label: "NexusPay", tone: "text-amber-300" },
  { label: "bKash", tone: "text-pink-300" },
  { label: "Nagad", tone: "text-orange-300" },
  { label: "Rocket", tone: "text-purple-300" },
  { label: "upay", tone: "text-emerald-300" },
  { label: "tap", tone: "text-blue-300" },
  { label: "SureCash", tone: "text-teal-300" },
  { label: "OK Wallet", tone: "text-red-300" },
  { label: "mCash", tone: "text-green-300" },
  { label: "MyCash", tone: "text-sky-300" },
  { label: "CellFin", tone: "text-amber-300" },
  { label: "Citytouch", tone: "text-cyan-300" },
  { label: "BRAC Bank", tone: "text-emerald-300" },
  { label: "City Bank", tone: "text-indigo-300" },
  { label: "EBL", tone: "text-cyan-300" },
  { label: "Bank Asia", tone: "text-rose-300" },
  { label: "UCB", tone: "text-blue-300" },
  { label: "Prime Bank", tone: "text-emerald-300" },
  { label: "DBBL", tone: "text-sky-300" },
  { label: "Islami Bank", tone: "text-green-300" },
  { label: "Trust Bank", tone: "text-emerald-300" },
  { label: "Dhaka Bank", tone: "text-blue-300" },
  { label: "Southeast Bank", tone: "text-teal-300" },
  { label: "Mutual Trust Bank", tone: "text-sky-300" },
  { label: "AB Bank", tone: "text-red-300" },
  { label: "One Bank", tone: "text-blue-300" },
  { label: "Pubali Bank", tone: "text-emerald-300" },
  { label: "Standard Chartered", tone: "text-teal-300" },
  { label: "Internet Banking", tone: "text-sky-300" },
  { label: "QR Pay", tone: "text-violet-300" },
];

export default function Footer() {
  const { t } = useI18n();
  const [showContestComingSoon, setShowContestComingSoon] = useState(false);
  const serviceLinks = [
    { title: "AI Photo Edit", href: "/login?redirect=/ai-editor" },
    { title: "Manual Photo Edit", href: "/login?redirect=/manual-editor" },
    { title: "Bulk Photo Edit", href: "/login?redirect=/bulk-photo-edit" },
    { title: "AI Photo", href: "/login?redirect=/ai-template" },
    { title: "Document Templates", href: "/login" },
    { title: "Print Media", href: "/login?redirect=/print-media" },
    {
      title: "Create Questions",
      href: "/login?redirect=/questions-create/create",
    },
    { title: "Job Circular", href: "/login?redirect=/jobs" },
    { title: "Studio Seba Tools", href: "/login?redirect=/sohoj-tools" },
  ];

  const pagesLinks: Array<{ title: string; href?: string; target?: string; comingSoon?: boolean }> = [
    { title: "What is Studio Seba?", href: "/help" },
    { title: "About Us", href: "/about" },
    { title: "Our Team", href: "/our-team" },
    { title: "Contact", href: "/contact" },
    { title: "Document Templates", href: "/dorkari-document" },
    { title: "AI Photo", href: "/ai-photo" },
    { title: "Package", href: "/pricing" },
    { title: "Contest", comingSoon: true },
  ];

  const supportLinks = [
    { title: "Terms of Service", href: "/terms" },
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Copyright Policy", href: "/copyright" },
  ];

  const socials = [
    {
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61593666395329",
      path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@happycodingn",
      path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.56-1.28 2.56.02.82.42 1.61 1.08 2.1 1.05.82 2.57.85 3.65.08.73-.5 1.17-1.33 1.25-2.22.08-2.37.03-4.75.03-7.12 0-3.37-.02-6.75.02-10.12z",
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCt9GohPOuqrNFYdkcM1fqWQ",
      path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    },
  ];

  const linkHoverStyle =
    "inline-block cursor-pointer text-slate-400 transition-colors duration-200 hover:text-white";

  const columnTitle =
    "mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500";

  return (
    <footer className="relative overflow-hidden bg-slate-950 font-sans text-slate-300">
      {/* Top gradient hairline */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent" />

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[48rem] max-w-none -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600/15 via-indigo-500/15 to-violet-600/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1400px] px-4 pb-8 pt-16 sm:px-6 md:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-12 pb-14 md:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          {/* Column 1: Logo & Contact Info */}
          <div className="space-y-6 pr-4 lg:col-span-2">
            {/* Logo */}
            <Link href="/" className="flex w-fit items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-[13px] font-black tracking-tight text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                SS
              </div>
              <div className="leading-none">
                <span className="text-[19px] font-extrabold tracking-tight text-white">
                  Studio{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                    Seba
                  </span>
                </span>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <T>{"STUDIO SEBA\r\n                "}</T>
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              <T>
                {
                  "Studio Seba Platform \u2014 document creation, design, print media, and AI\r\n              tools \u2014 all in one place.\r\n            "
                }
              </T>
            </p>

            <div className="space-y-3 pt-2 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-blue-400">
                  <Mail size={15} />
                </span>
                <span>
                  <T>{"jahidulhassansrizon@gmail.com"}</T>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-blue-400">
                  <Phone size={15} />
                </span>
                <span>
                  <T>{"017836666743"}</T>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-blue-400">
                  <MapPin size={15} />
                </span>
                <span>
                  <T>{"Bou Bazar Rd, Tongi 1230"}</T>
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h3 className={columnTitle}>
              <T>{"Services\r\n            "}</T>
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              {serviceLinks.map((service, index) => (
                <li key={index}>
                  <Link href={service.href} className={linkHoverStyle}>
                    {<T>{service.title}</T>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Pages */}
          <div>
            <h3 className={columnTitle}>
              <T>{"Pages\r\n            "}</T>
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              {pagesLinks.map((page, index) => (
                <li key={index}>
                  {page.comingSoon ? (
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setShowContestComingSoon(true)}
                        aria-expanded={showContestComingSoon}
                        className={linkHoverStyle}
                      >
                        <T>{page.title}</T>
                      </button>
                      {showContestComingSoon && (
                        <p role="status" className="text-xs font-semibold text-indigo-300">
                          <T>{"Coming Soon"}</T>
                        </p>
                      )}
                    </div>
                  ) : page.href ? (
                    <Link
                      href={page.href}
                      className={linkHoverStyle}
                      target={page.target}
                      rel={
                        page.target === "_blank"
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      <T>{page.title}</T>
                    </Link>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className={linkHoverStyle}
                    >
                      <T>{page.title}</T>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h3 className={columnTitle}>
              <T>{"Support\r\n            "}</T>
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              {supportLinks.map((support, index) => (
                <li key={index}>
                  {support.href ? (
                    <Link href={support.href} className={linkHoverStyle}>
                      <T>{support.title}</T>
                    </Link>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className={linkHoverStyle}
                    >
                      <T>{support.title}</T>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>
            <T>{"\u00A9 2026 Studio Seba. All rights reserved."}</T>
          </p>

          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Custom payment strip — no third-party banner image or external asset URL */}
        <section
          aria-label={t("Accepted payment methods")}
          className="relative w-full overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/80 p-4 text-slate-100 shadow-[0_18px_60px_rgba(0,0,0,0.28)] ring-1 ring-white/5 sm:p-5"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-indigo-300 shadow-inner shadow-black/20">
                <CreditCard size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight text-white">
                  <T>{"Accepted payment methods"}</T>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  <T>{"Cards, mobile wallets and bank payments"}</T>
                </p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <ShieldCheck size={14} aria-hidden="true" />
              <T>{"Secure payment"}</T>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method.label}
                className={`inline-flex min-h-7 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/75 px-2.5 py-1.5 text-[10px] font-bold leading-none shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-colors hover:border-slate-500 sm:text-[11px] ${method.tone}`}
              >
                {method.label}
              </span>
            ))}
          </div>
        </section>
      </div>
    </footer>
  );
}
