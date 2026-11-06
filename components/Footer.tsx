"use client";

import SiteBrandLogo from "@/app/_components/SiteBrandLogo";
import { T } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";
import { getContactList } from "@/app/_components/contactSettings";

// Shown until the admin saves their own values in Admin → Site Settings → Footer.
const DEFAULT_OFFICE = { address: "সাভার, ঢাকা", phone: "+8809697629108" };

function OfficeContact({
  addresses,
  phones,
  emails,
}: {
  addresses: string[];
  phones: string[];
  emails: string[];
}) {
  const rows: { icon: LucideIcon; value: string; href?: string }[] = [
    ...addresses.map((value) => ({ icon: MapPin, value })),
    ...phones.map((value) => ({ icon: Phone, value, href: `tel:${value.replace(/[^\d+]/g, "")}` })),
    ...emails.map((value) => ({ icon: Mail, value, href: `mailto:${value}` })),
  ];
  if (rows.length === 0) return null;

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-2.5">
        <span aria-hidden className="h-4 w-1 rounded-full bg-gradient-to-b from-blue-400 to-fuchsia-400" />
        <span className="text-sm font-semibold text-white">
          <T>{"Office"}</T>
        </span>
      </div>
      <ul className="space-y-2.5 px-4 py-3.5">
        {rows.map(({ icon: RowIcon, value, href }, i) => (
          <li key={`${value}-${i}`} className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-200">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/25 to-fuchsia-500/20 text-indigo-200 ring-1 ring-white/10">
              <RowIcon size={13} />
            </span>
            {href ? (
              <a href={href} className="min-w-0 break-all pt-0.5 transition-colors hover:text-white">
                {value}
              </a>
            ) : (
              <span className="min-w-0 break-words pt-0.5">{value}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SecureBadge() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/25">
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" aria-hidden>
        <defs>
          <linearGradient id="secureShieldFill" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
        {/* shield body */}
        <path
          d="M16 3 5.5 7v8.2c0 6.1 4.2 11.2 10.5 13.8 6.3-2.6 10.5-7.7 10.5-13.8V7L16 3Z"
          fill="url(#secureShieldFill)"
        />
        {/* soft light on the left half for depth */}
        <path d="M16 3 5.5 7v8.2c0 6.1 4.2 11.2 10.5 13.8V3Z" fill="#fff" fillOpacity="0.14" />
        {/* check mark */}
        <path
          d="m11 15.8 3.4 3.4 6.6-7.2"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Footer() {
  const [showContestComingSoon, setShowContestComingSoon] = useState(false);
  const { settings } = useSiteSettings();
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
    { title: "Seba Lagbe Tools", href: "/login?redirect=/sohoj-tools" },
  ];

  const pagesLinks: Array<{ title: string; href?: string; target?: string; comingSoon?: boolean }> = [
    { title: "What is Seba Lagbe?", href: "/help" },
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
      label: "Instagram",
      href: "",
      path: "M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm0 2h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3zm5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.5-3a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCt9GohPOuqrNFYdkcM1fqWQ",
      path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    },
  ];

  // Link style: a small gradient dash slides in on hover
  const linkClass =
    "group inline-flex cursor-pointer items-center text-[13px] text-slate-400 transition-all duration-300 hover:text-white";

  const Dash = () => (
    <span
      aria-hidden
      className="mr-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-blue-400 to-fuchsia-400 transition-all duration-300 group-hover:mr-2.5 group-hover:w-3.5"
    />
  );

  const columnTitle = "mb-5 flex items-center gap-2.5 text-sm font-extrabold tracking-tight text-white";

  const TitleBar = () => (
    <span
      aria-hidden
      className="h-4 w-1 rounded-full bg-gradient-to-b from-blue-400 to-fuchsia-400"
    />
  );

  // Office details come from Admin → Site Settings → Footer (shared contact lists).
  const clean = (list: string[]) => list.map((v) => String(v ?? "").trim()).filter(Boolean);
  const addresses = clean(getContactList(settings.contact, "locations"));
  const phones = clean(getContactList(settings.contact, "phones"));
  const emails = clean(getContactList(settings.contact, "emails"));
  const office = {
    addresses: addresses.length || phones.length || emails.length ? addresses : [DEFAULT_OFFICE.address],
    phones: addresses.length || phones.length || emails.length ? phones : [DEFAULT_OFFICE.phone],
    emails,
  };

  return (
    <footer className="navbar-font relative isolate overflow-hidden bg-slate-950 text-slate-300">
      {/* top gradient hairline + aurora glows */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[8%] h-80 w-[34rem] rounded-full bg-gradient-to-r from-blue-600/25 to-indigo-600/20 blur-3xl" />
        <div className="absolute -top-32 right-[4%] h-72 w-[30rem] rounded-full bg-gradient-to-l from-fuchsia-600/20 to-violet-600/20 blur-3xl" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_55%_at_50%_0%,#000_20%,transparent_100%)]" />
      </div>
      {/* giant brand watermark */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 select-none overflow-hidden text-center">
        <span className="block translate-y-[28%] whitespace-nowrap bg-gradient-to-b from-white/[0.08] to-transparent bg-clip-text text-[19vw] font-black leading-none tracking-[-0.06em] text-transparent">
          {settings.branding.siteName}
        </span>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 pb-6 pt-16 sm:px-6 md:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 pb-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          {/* Column 1: Logo & Contact Info */}
          <div className="space-y-4 pr-4 lg:col-span-2">
            <Link href="/" className="flex w-fit items-center">
              <SiteBrandLogo width={120} height={38} className="h-[38px] w-auto" />
            </Link>

            <p className="max-w-sm text-[13px] leading-relaxed text-slate-300/80">
              <T>{settings.footer.description.replaceAll("Seba Lagbe", settings.branding.siteName)}</T>
            </p>

            {/* Office address / phone / email (editable from Admin → Site Settings → Footer) */}
            <OfficeContact addresses={office.addresses} phones={office.phones} emails={office.emails} />
          </div>

          {/* Column 2: Services */}
          <div>
            <h3 className={columnTitle}>
              <TitleBar />
              <T>{"Services\r\n            "}</T>
            </h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((service, index) => (
                <li key={index}>
                  <Link href={service.href} className={linkClass}>
                    <Dash />
                    <T>{service.title}</T>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Pages */}
          <div>
            <h3 className={columnTitle}>
              <TitleBar />
              <T>{"Pages\r\n            "}</T>
            </h3>
            <ul className="space-y-2.5">
              {pagesLinks.map((page, index) => (
                <li key={index}>
                  {page.comingSoon ? (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setShowContestComingSoon(true)}
                        aria-expanded={showContestComingSoon}
                        className={linkClass}
                      >
                        <Dash />
                        <T>{page.title}</T>
                      </button>
                      {showContestComingSoon && (
                        <p
                          role="status"
                          className="w-fit rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-200"
                        >
                          <T>{"Coming Soon"}</T>
                        </p>
                      )}
                    </div>
                  ) : page.href ? (
                    <Link
                      href={page.href}
                      className={linkClass}
                      target={page.target}
                      rel={page.target === "_blank" ? "noopener noreferrer" : undefined}
                    >
                      <Dash />
                      <T>{page.title}</T>
                    </Link>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className={linkClass}
                    >
                      <Dash />
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
              <TitleBar />
              <T>{"Support\r\n            "}</T>
            </h3>
            <ul className="space-y-2.5">
              {supportLinks.map((support, index) => (
                <li key={index}>
                  {support.href ? (
                    <Link href={support.href} className={linkClass}>
                      <Dash />
                      <T>{support.title}</T>
                    </Link>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className={linkClass}
                    >
                      <Dash />
                      <T>{support.title}</T>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment methods: compact, badge + title left, image right */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <SecureBadge />
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight text-white">
                  <T>{"Secure Payment"}</T>
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                  <T>{"Pay safely with your preferred method"}</T>
                </p>
              </div>
            </div>

            <div className="w-full max-w-[340px] overflow-hidden rounded-lg bg-white p-1.5 ring-1 ring-white/20 shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
              <img
                src={settings.branding.footerLogoUrl || "/footerLogo/logoFooter.jpg"}
                alt={settings.branding.siteName || "Website"}
                width={1600}
                height={300}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>
            <>© {new Date().getFullYear()} {settings.branding.siteName}. {settings.footer.copyrightText}</>
          </p>

          <div className="flex items-center gap-2.5">
            {socials.map((item) => ({
              ...item,
              href: item.label === "Facebook" ? settings.socials.facebook
                : item.label === "TikTok" ? settings.socials.tiktok
                : item.label === "YouTube" ? settings.socials.youtube
                : item.label === "Instagram" ? settings.socials.instagram
                : item.href,
            })).filter((item) => Boolean(item.href)).map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-to-br hover:from-blue-500 hover:to-fuchsia-500 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
