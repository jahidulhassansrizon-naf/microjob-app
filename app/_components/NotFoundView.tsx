"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, LayoutGrid, Image as ImageIcon, FolderOpen, Layers, Wand2 } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

const COPY = {
  bn: {
    code: "৪০৪",
    badge: "পেজ পাওয়া যায়নি",
    title: "দুঃখিত, এই পেজটি খুঁজে পাওয়া যায়নি",
    body: "আপনি যে লিংকে এসেছেন সেটি হয়তো সরানো হয়েছে, বদলে গেছে অথবা ঠিকমতো লেখা হয়নি। চিন্তা নেই, নিচের বাটন থেকে সহজেই ফিরে যেতে পারবেন।",
    home: "হোম পেজে যান",
    tools: "সব টুল দেখুন",
    back: "আগের পেজে ফিরুন",
    popular: "জনপ্রিয় পেজ",
    links: {
      ai: "এআই এডিটর",
      manual: "ম্যানুয়াল এডিটর",
      bulk: "বাল্ক ফটো এডিট",
      files: "আমার ফাইল",
    },
  },
  en: {
    code: "404",
    badge: "Page not found",
    title: "Sorry, we couldn’t find this page",
    body: "The link you followed may have been moved, changed or mistyped. No worries — use the buttons below to get back on track.",
    home: "Go to home page",
    tools: "Browse all tools",
    back: "Go back",
    popular: "Popular pages",
    links: {
      ai: "AI Editor",
      manual: "Manual Editor",
      bulk: "Bulk Photo Edit",
      files: "My Files",
    },
  },
} as const;

const STYLES = `
/* The 404 page is shown without the site navbar. */
.site-navbar-slot { display: none !important; }
.nf-page {
  --nf-size: clamp(210px, 30vmin, 290px);
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  overflow: hidden;
  color: #3B2F1E;
  background:
    radial-gradient(ellipse 60% 50% at 50% 38%, rgba(255, 252, 242, 0.9) 0%, rgba(255, 252, 242, 0) 70%),
    linear-gradient(180deg, #F2E8D2 0%, #EFE5CE 100%);
  font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
.nf-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 640px;
}

/* ---------- ring (same look as the site loader) ---------- */
.nf-stage {
  --lp: 0;
  position: relative;
  width: var(--nf-size);
  height: var(--nf-size);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: nf-fill 2.6s cubic-bezier(0.22, 0.8, 0.24, 1) 0.15s forwards, nf-float 6s ease-in-out 2.8s infinite;
}
.nf-halo {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(220, 38, 38, 0.28) 0%, rgba(248, 113, 113, 0.12) 45%, rgba(248, 113, 113, 0) 70%);
  filter: blur(14px);
  animation: nf-breathe 2.4s ease-in-out infinite;
}
.nf-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.nf-orbit {
  fill: none;
  stroke: rgba(59, 47, 30, 0.28);
  stroke-width: 1;
  stroke-dasharray: 2 9;
  stroke-linecap: round;
  transform-origin: 100px 100px;
  animation: nf-spin 18s linear infinite reverse;
}
.nf-track { fill: none; stroke: rgba(59, 47, 30, 0.10); stroke-width: 9; }
.nf-arc {
  fill: none;
  stroke: url(#nf-grad);
  stroke-width: 9;
  stroke-linecap: round;
  stroke-dasharray: 100 100;
  stroke-dashoffset: calc(100 - var(--lp));
  filter: drop-shadow(0 0 6px rgba(220, 38, 38, 0.45));
}
.nf-tip {
  position: absolute;
  inset: 0;
  transform: rotate(calc(var(--lp) * -3.6deg));
  pointer-events: none;
}
.nf-tip::after {
  content: "";
  position: absolute;
  top: calc(10% - 5px);
  left: calc(50% - 5px);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FFF6E0;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.55), 0 0 14px 4px rgba(248, 113, 113, 0.75);
  animation: nf-tip-pulse 1.8s ease-in-out 2.7s infinite;
}
.nf-center { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.4em; }
.nf-code {
  font-size: calc(var(--nf-size) * 0.27);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #3B2F1E;
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transform: scale(0.92);
  animation: nf-pop 0.7s ease 0.35s forwards;
}
.nf-brand {
  font-size: calc(var(--nf-size) * 0.052);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(59, 47, 30, 0.55);
}

/* ---------- text ---------- */
.nf-badge {
  margin-top: 30px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #F3C4C4;
  background: #FEF1F1;
  color: #B91C1C;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.nf-badge::before {
  content: "";
  width: 7px; height: 7px; border-radius: 50%;
  background: #DC2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
}
.nf-title {
  margin: 14px 0 0;
  font-size: clamp(24px, 4.2vw, 34px);
  line-height: 1.3;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #3B2F1E;
}
.nf-body {
  margin: 12px 0 0;
  max-width: 520px;
  font-size: 15.5px;
  line-height: 1.75;
  color: #6B5A40;
}
.nf-actions { margin-top: 28px; display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.nf-btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 46px; padding: 0 22px;
  border-radius: 14px;
  font-size: 15px; font-weight: 700;
  cursor: pointer; text-decoration: none;
  transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
}
.nf-btn:focus-visible { outline: 2px solid #DC2626; outline-offset: 3px; }
.nf-btn--primary {
  color: #fff; border: 0;
  background: linear-gradient(180deg, #E23B3B 0%, #C81E1E 100%);
  box-shadow: 0 8px 20px -8px rgba(200, 30, 30, 0.7);
}
.nf-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(200, 30, 30, 0.75); }
.nf-btn--ghost { color: #3B2F1E; background: #F8F1DE; border: 1px solid #E3D6B8; }
.nf-btn--ghost:hover { background: #F2E8D2; transform: translateY(-1px); }
.nf-btn--plain { color: #6B5A40; background: transparent; border: 1px solid transparent; }
.nf-btn--plain:hover { color: #3B2F1E; background: rgba(59, 47, 30, 0.06); }

.nf-popular { margin-top: 34px; width: 100%; }
.nf-popular-title {
  font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(59, 47, 30, 0.5);
}
.nf-chips { margin-top: 12px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.nf-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 15px; border-radius: 999px;
  background: #FBF5E6; border: 1px solid #E3D6B8;
  color: #3B2F1E; font-size: 14px; font-weight: 600; text-decoration: none;
  transition: border-color 140ms ease, background-color 140ms ease, transform 140ms ease;
}
.nf-chip:hover { border-color: #DC2626; background: #FFF; transform: translateY(-1px); }
.nf-chip svg { color: #DC2626; }

/* entrance for the text block */
.nf-rise { opacity: 0; transform: translateY(10px); animation: nf-rise 0.7s ease forwards; }
.nf-d1 { animation-delay: 0.9s; } .nf-d2 { animation-delay: 1.05s; } .nf-d3 { animation-delay: 1.2s; }
.nf-d4 { animation-delay: 1.35s; } .nf-d5 { animation-delay: 1.5s; }

@keyframes nf-fill { from { --lp: 0; } to { --lp: 72; } }
@keyframes nf-spin { to { transform: rotate(360deg); } }
@keyframes nf-breathe { 0%, 100% { opacity: 0.55; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1.06); } }
@keyframes nf-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes nf-tip-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.55), 0 0 14px 4px rgba(248, 113, 113, 0.75); }
  50% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.35), 0 0 22px 8px rgba(248, 113, 113, 0.9); }
}
@keyframes nf-pop { to { opacity: 1; transform: scale(1); } }
@keyframes nf-rise { to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .nf-stage { animation: none; --lp: 72; }
  .nf-halo, .nf-orbit, .nf-tip::after { animation: none; }
  .nf-code, .nf-rise { animation: none; opacity: 1; transform: none; }
}
@media (max-width: 480px) {
  .nf-page { padding-top: 32px; }
  .nf-btn { width: 100%; justify-content: center; }
  .nf-actions { width: 100%; }
}
`;

export default function NotFoundView() {
  const { locale } = useI18n();
  const router = useRouter();
  const copy = locale === "bn" ? COPY.bn : COPY.en;

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  const popular = [
    { href: "/ai-editor", label: copy.links.ai, Icon: Wand2 },
    { href: "/manual-editor", label: copy.links.manual, Icon: ImageIcon },
    { href: "/bulk-photo-edit", label: copy.links.bulk, Icon: Layers },
    { href: "/my-files", label: copy.links.files, Icon: FolderOpen },
  ];

  return (
    <main className="nf-page">
      <style>{STYLES}</style>

      <div className="nf-inner">
        <div className="nf-stage" role="img" aria-label={COPY.en.code}>
          <div className="nf-halo" />
          <svg className="nf-svg" viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <linearGradient id="nf-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#B91C1C" />
                <stop offset="55%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#F87171" />
              </linearGradient>
            </defs>
            <circle className="nf-orbit" cx="100" cy="100" r="96" />
            <circle className="nf-track" cx="100" cy="100" r="80" />
            <circle
              className="nf-arc"
              cx="100"
              cy="100"
              r="80"
              pathLength={100}
              transform="translate(200 0) scale(-1 1) rotate(-90 100 100)"
            />
          </svg>
          <div className="nf-tip" />
          <div className="nf-center" aria-hidden="true">
            <span className="nf-code">{copy.code}</span>
            <span className="nf-brand">SebaLagbe.com</span>
          </div>
        </div>

        <span className="nf-badge nf-rise nf-d1">{copy.badge}</span>
        <h1 className="nf-title nf-rise nf-d2">{copy.title}</h1>
        <p className="nf-body nf-rise nf-d3">{copy.body}</p>

        <div className="nf-actions nf-rise nf-d4">
          <Link href="/" className="nf-btn nf-btn--primary">
            <Home size={17} aria-hidden="true" />
            {copy.home}
          </Link>
          <Link href="/dashboard" className="nf-btn nf-btn--ghost">
            <LayoutGrid size={17} aria-hidden="true" />
            {copy.tools}
          </Link>
          <button type="button" onClick={goBack} className="nf-btn nf-btn--plain">
            <ArrowLeft size={17} aria-hidden="true" />
            {copy.back}
          </button>
        </div>

        <nav className="nf-popular nf-rise nf-d5" aria-label={copy.popular}>
          <div className="nf-popular-title">{copy.popular}</div>
          <div className="nf-chips">
            {popular.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className="nf-chip">
                <Icon size={15} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
