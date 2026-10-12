"use client";
import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
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
    { title: "SohozTools", href: "/login?redirect=/sohoj-tools" },
  ];

  const pagesLinks = [
    { title: "What is SohozKaj?", href: "/help" },
    { title: "About Us", href: "/about" },
    { title: "Our Team", href: "/our-team" },
    {
      title: "Important Articles",
      href: "https://blog.sohozkaj.com/",
      target: "_blank",
    },
    { title: "Contact", href: "/contact" },
    { title: "Document Templates", href: "/dorkari-document" },
    { title: "AI Photo", href: "/ai-photo" },
    { title: "Package", href: "/pricing" },
    {
      title: "Contest",
      href: "https://contest.sohozkaj.com/",
      target: "_blank",
    },
  ];

  const supportLinks = [
    { title: "Terms of Service", href: "/terms" },
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Copyright Policy", href: "/copyright" },
    { title: "Refund Policy", href: "/refund" },
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
                SH
              </div>
              <div className="leading-none">
                <span className="text-[19px] font-extrabold tracking-tight text-white">
                  Sohoj{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                    Hub
                  </span>
                </span>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <T>{"WWW.SOHOZKAJ.COM\r\n                "}</T>
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              <T>
                {
                  "SohozKaj Platform \u2014 document creation, design, print media, and AI\r\n              tools \u2014 all in one place.\r\n            "
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
                  {page.href ? (
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
                      {page.title}
                    </Link>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className={linkHoverStyle}
                    >
                      {page.title}
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
                      {support.title}
                    </Link>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className={linkHoverStyle}
                    >
                      {support.title}
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
            <T>{"\u00A9 2026 SohozKaj. All rights reserved."}</T>
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

        {/* Payment Gateway Strip */}
        <div className="flex w-full items-center justify-center overflow-hidden rounded-xl bg-white py-1.5 ring-1 ring-white/10">
          <img
            src="https://files.sohozkaj.com/SSLCommerz-Pay-With-logo.webp"
            alt="Payment Options (SSLCommerz)"
            className="h-auto w-full object-contain"
          />
        </div>
      </div>
    </footer>
  );
}
