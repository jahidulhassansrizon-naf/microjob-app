"use client";
import { DT } from "./_components/DashboardText";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Heart, X } from "lucide-react";
import DashboardNavbar from "./_components/DashboardNavbar";
import UserAdminChat from "./_components/UserAdminChat";
import { getClientSession } from "@/lib/clientAuth";
import { toolsData, ToolTile } from "@/app/_components/toolsData";
import { prefetchMyFilesData } from "@/app/my-files/myFilesData";
import { saveHomeLayout } from "@/app/_components/uiCache";
// হোমে প্রথম কয়টা টুল দেখাবে (সব দেখাতে চাইলে toolsData.length দাও)
const HOME_TOOLS_COUNT = 16;
// রঙিন আইকন বক্স কত ছোট হবে (প্রতিটা ঘরের কত %); নামের লেখা আলাদা, পুরো ঘরের চওড়া পায়
// ১০০ = আগের মতো বড়, ৭৫ = হালকা ছোট, ৬৫ = আরও ছোট
const TOOL_TILE_SIZE_PERCENT = 65;
// মোবাইল/ট্যাবলেটে (টাচ ডিভাইস) আইকন বক্স ঘরের কত % নেবে
const TOOL_TILE_SIZE_PERCENT_TOUCH = 88;
// "Popular Tools" হেডিং, সাবটাইটেল ও "View all" বাটনের ফন্ট (Inter থাকলে Inter, না থাকলে Segoe UI/সিস্টেম ফন্ট)
const HEADING_FONT = {
  fontFamily:
    '"Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;
const PAGE_FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
  font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, sans-serif;
  font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
.page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
.scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
.scroll::-webkit-scrollbar { width: 12px; }
.scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
.scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
.scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }
`;
// useLayoutEffect on the client (runs before the browser paints), useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
// The desktop "fit" layout (scale / width of banner + tools) is measured in JS, but the last
// measurement is cached and restored by app/_components/PrePaintScript.tsx before first paint
// (html[data-fit], --hv-w/--hv-h/--hv-s/--hv-top). So the server HTML is already laid out like the
// final page and nothing is hidden or re-flowed after hydration. Desktop-vs-touch differences are
// expressed with the `fit:` Tailwind variant (see globals.css) instead of a JS flag.
/* ------------------------------------------------------------------ */
/* Popular tools                                                       */
/* ------------------------------------------------------------------ */
function PopularToolsSection() {
  const homeTools = toolsData.slice(0, HOME_TOOLS_COUNT);
  return (
    <section className="py-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* ছোট নীল আকসেন্ট বার */}
          <span
            aria-hidden="true"
            className="h-9 w-1 shrink-0 rounded-full bg-[#DC2626]"
          />
          <div>
            <h2
              style={HEADING_FONT}
              className={`font-semibold leading-tight tracking-[-0.01em] text-[#3B2F1E] text-xl sm:text-2xl fit:text-2xl`}
            >
              <DT>{"Popular Tools\n            "}</DT>
            </h2>
            <p
              style={HEADING_FONT}
              className="mt-0.5 text-[15px] font-normal leading-snug text-[#7A6A50]"
            >
              <DT>{"Free tools to speed up your daily work.\n            "}</DT>
            </p>
          </div>
        </div>

        <Link
          href="/sohoj-tools"
          style={HEADING_FONT}
          className="group inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] py-1 pl-3 pr-1 text-[14.5px] font-medium text-[#5A4A32] shadow-sm outline-none transition-all hover:border-[#DC2626] hover:text-[#DC2626] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#FBB6B6]"
        >
          <span>
            <DT>{"View all\n            "}</DT>
            <span className="hidden sm:inline fit:inline">
              {<DT> </DT>}
              {toolsData.length}
              <DT>{"tools\n            "}</DT>
            </span>
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#DC2626] text-white transition-transform duration-200 group-hover:translate-x-0.5">
            <ArrowRight size={12} />
          </span>
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 fit:grid-cols-8 fit:gap-x-5 fit:gap-y-6">
        {homeTools.map((tool) => (
          <ToolTile
            key={tool.id}
            tool={tool}
            // touch size here; on desktop `html[data-fit] [data-tile-box]` (globals.css) uses
            // --tile-box-fit, which HomeScreen sets from TOOL_TILE_SIZE_PERCENT
            boxPercent={TOOL_TILE_SIZE_PERCENT_TOUCH}
          />
        ))}
      </div>
    </section>
  );
}
/* ------------------------------------------------------------------ */
/* Welcome banner                                                      */
/* ------------------------------------------------------------------ */
// ফুটারের নিচের ক্রেডিট লাইনে যে নাম দেখাবে
const CREATOR_NAME = "Jahidul Hassan";
const INSPIRED_BY_NAME = "Robiul Karim Robi";
// চাইলে নিচে Facebook/LinkedIn/ওয়েবসাইটের লিংক বসাও — ফাঁকা থাকলে শুধু নাম দেখাবে
const CREATOR_URL = "";
const INSPIRED_BY_URL = "";
// my-nafia:start
const CONTACT_NAME = "Jahidul Hasan Sreezon";
const CONTACT_FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61593666395329";
const CONTACT_PHOTO_URL =
  "https://scontent.fdac165-1.fna.fbcdn.net/v/t39.30808-6/830162073_122117058801455546_9222997689185944451_n.jpg?stp=dst-jpg_tt6&cstp=mx1024x1536&ctp=s1024x1536&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFXk2DRYIMaT2rWUpeNS_QDO3oAE2SwZaw7egATZLBlrFuLbZxjfp2t1mEf0QSZ0qIfZc4Yht_g_s0X90DPJ-dn&_nc_ohc=-V2O-FBUvXkQ7kNvwFq-ymM&_nc_oc=Adrs-QyftXhcttufrbgUp1ssVGqD1Kj86lQjWqzAvomAPDOODDxnhC7jmAZkUrMCjq8&_nc_zt=23&_nc_ht=scontent.fdac165-1.fna&_nc_gid=lSseAorXaTEwTuBsJIOvmA&_nc_ss=7b2a8&oh=00_AQPZr1ODCauMKkRVxy-PjTXIultKpZpSJhoNAvBr-5DiBA&oe=6AD05FAF";
// my-nafia:end
function getGreeting(date: Date = new Date()) {
  const hour = date.getHours();
  return hour >= 5 && hour < 12
    ? "Good morning"
    : hour >= 12 && hour < 17
      ? "Good afternoon"
      : hour >= 17 && hour < 21
        ? "Good evening"
        : "Good night";
}
// ---- Bilingual helper (EN / বাংলা) ---------------------------------------------------------
// Picks the banner copy by the site's current language. Reads the I18n provider first and falls
// back to <html lang>. Banner text lives in BANNER_COPY below, so it is always fully Bangla.
function useIsBn() {
  const i18n = useI18n() as unknown as Record<string, unknown> | undefined;
  const fromProvider = [i18n?.lang, i18n?.locale, i18n?.language].find(
    (v): v is string => typeof v === "string",
  );
  const [htmlLang, setHtmlLang] = useState<string | null>(null);
  useEffect(() => {
    if (fromProvider) return;
    const read = () => setHtmlLang(document.documentElement.lang || null);
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
    return () => mo.disconnect();
  }, [fromProvider]);
  return (fromProvider ?? htmlLang ?? "").toLowerCase().startsWith("bn");
}
type Bi = { en: string; bn: string };
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBnDigits = (n: number) =>
  String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
// বাংলা লেখা সুন্দর দেখানোর ফন্ট (Hind Siliguri না লোড হলে Noto Sans Bengali / সিস্টেম ফন্ট)
const BANNER_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap";
const BANNER_FONT = {
  fontFamily:
    '"Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;
// ব্যানারের সব লেখা এখান থেকে বদলানো যাবে
const BANNER_COPY = {
  eyebrow: {
    en: "Your computer shop, now online",
    bn: "আপনার কম্পিউটার দোকান, এখন অনলাইনে",
  } as Bi,
  welcome: { en: "Welcome back,", bn: "আবার স্বাগতম," } as Bi,
  lead: {
    en: "NID, PDF, images and videos — every computer-shop service on one page. Our AI tools finish the job in minutes, and you don't need any editing skills.",
    bn: "এনআইডি, পিডিএফ, ছবি ও ভিডিও — কম্পিউটার দোকানের সব কাজ এক পাতায়। এডিটিং না জানলেও আমাদের এআই টুলে মিনিটেই কাজ শেষ।",
  } as Bi,
  explore: { en: "Explore all tools", bn: "সব টুল দেখুন" } as Bi,
  myFiles: { en: "My Files", bn: "আমার ফাইল" } as Bi,
  freeTools: { en: "free tools", bn: "টি ফ্রি টুল" } as Bi,
  noInstall: { en: "No installation", bn: "ইনস্টল ছাড়াই" } as Bi,
  minutes: { en: "Done in minutes", bn: "মিনিটেই কাজ শেষ" } as Bi,
  cardLabel: { en: "AI Editor", bn: "এআই এডিটর" } as Bi,
  cardTitle: {
    en: "Get it done in minutes, no editing needed",
    bn: "এডিটিং ছাড়াই, মিনিটে কাজ শেষ",
  } as Bi,
  alsoLabel: { en: "Also at our shop", bn: "দোকানের আরও সেবা" } as Bi,
  also: {
    en: "Photo & print · Document scan · NID joining & copy · Photocopy · Voter registration",
    bn: "ছবি তোলা ও প্রিন্ট · ডকুমেন্ট স্ক্যান · এনআইডি জয়েন ও কপি · ফটোকপি · ভোটার নিবন্ধন",
  } as Bi,
};
// এআই এডিটর কার্ডের আইকন — হাতে আঁকা ফ্ল্যাট SVG, Popular Tools-এর আইকনের মতো একই ধাঁচ
type AiKind = "passport" | "background" | "upscale" | "govt";
function AiJobIcon({ kind, color }: { kind: AiKind; color: string }) {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
      {kind === "passport" && (
        <>
          <rect x="11" y="8" width="18" height="24" rx="3" fill="#fff" />
          <circle cx="20" cy="17" r="3.6" fill={color} />
          <path
            d="M13.6 29c.6-4 3.3-6.2 6.4-6.2s5.8 2.2 6.4 6.2z"
            fill={color}
          />
          <circle
            cx="30"
            cy="10"
            r="5"
            fill="#fff"
            stroke={color}
            strokeWidth="1.6"
          />
          <path
            d="M27.6 10l1.8 1.8 3.2-3.4"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "background" && (
        <>
          <rect
            x="8"
            y="8"
            width="24"
            height="24"
            rx="4"
            fill="#fff"
            fillOpacity=".25"
          />
          <rect
            x="16"
            y="8"
            width="8"
            height="8"
            fill="#fff"
            fillOpacity=".3"
          />
          <rect
            x="8"
            y="16"
            width="8"
            height="8"
            fill="#fff"
            fillOpacity=".3"
          />
          <rect
            x="24"
            y="16"
            width="8"
            height="8"
            fill="#fff"
            fillOpacity=".3"
          />
          <rect
            x="16"
            y="24"
            width="8"
            height="8"
            fill="#fff"
            fillOpacity=".3"
          />
          <circle
            cx="20"
            cy="17"
            r="4.2"
            fill="#fff"
            stroke={color}
            strokeWidth="1.5"
          />
          <path
            d="M12.5 32c.7-5.2 3.9-7.8 7.5-7.8s6.8 2.6 7.5 7.8z"
            fill="#fff"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "upscale" && (
        <>
          <rect x="9" y="14" width="22" height="18" rx="3" fill="#fff" />
          <circle cx="24.5" cy="19.5" r="2.2" fill={color} />
          <path d="M11.5 29l5.2-6.4 4 4.6 2.8-2.8 4.6 4.6z" fill={color} />
          <path
            d="M26.5 9.5h5v5M31.5 9.5l-5.6 5.6"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "govt" && (
        <>
          <rect x="8" y="8" width="17" height="19" rx="2.5" fill="#fff" />
          <circle cx="16.5" cy="15" r="3" fill={color} />
          <path
            d="M10.8 25c.5-3.6 2.7-5.2 5.7-5.2s5.2 1.6 5.7 5.2z"
            fill={color}
          />
          <path
            d="M8 32c2.5-4 4 2 6.5-1.5s3.5 1.5 5.5-.5 3-1.5 5.5.5"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M28 10l3.2 3.2-6 6-3.6.4.4-3.6z" fill="#fff" />
        </>
      )}
    </svg>
  );
}
// এআই এডিটর পেজ থেকে যা যা করা যায়
const AI_JOBS: { kind: AiKind; color: string; title: Bi; sub: Bi }[] = [
  {
    kind: "passport",
    color: "#3B63D4",
    title: { en: "Passport-size photo", bn: "পাসপোর্ট সাইজ ছবি" },
    sub: {
      en: "Print-ready in a single step",
      bn: "এক ধাপেই প্রিন্টের উপযোগী",
    },
  },
  {
    kind: "background",
    color: "#2F9E44",
    title: { en: "Background remove", bn: "ব্যাকগ্রাউন্ড রিমুভ" },
    sub: {
      en: "Clean white or blue background",
      bn: "পরিষ্কার সাদা বা নীল ব্যাকগ্রাউন্ড",
    },
  },
  {
    kind: "upscale",
    color: "#7C66D8",
    title: { en: "Image upscale", bn: "ছবি আপস্কেল" },
    sub: {
      en: "Make small, blurry photos clearer",
      bn: "ছোট ও ঝাপসা ছবি আরও পরিষ্কার",
    },
  },
  {
    kind: "govt",
    color: "#8B2FC9",
    title: { en: "Govt job photo & signature", bn: "সরকারি চাকরির ছবি ও সই" },
    sub: {
      en: "Exact size and KB for applications",
      bn: "আবেদনের মাপ ও কেবি অনুযায়ী",
    },
  },
];
function WelcomeBanner({ userName }: { userName: string | null }) {
  // The greeting depends on the visitor's clock, so the head script sets html[data-greet] before
  // first paint and CSS shows the matching variant (no hydration mismatch, no flip, no flash).
  // userName === null means "not known yet" (cache/session not read): the cached first name is
  // painted by CSS (--user-first) until React renders the real one in the same place.
  const nameKnown = userName !== null;
  const firstName = (userName ?? "User").trim().split(" ")[0] || "there";
  const bn = useIsBn();
  const L = (b: Bi) => (bn ? b.bn : b.en);
  const toolCount = bn
    ? toBnDigits(toolsData.length)
    : String(toolsData.length);
  return (
    <section
      style={BANNER_FONT}
      className="relative mb-6 overflow-hidden rounded-xl border border-[#5A4A32] bg-[#3B2F1E] px-5 py-6 text-white shadow-[0_10px_30px_-12px_rgba(59,47,30,0.30)] sm:px-10 sm:py-8 fit:px-10 fit:py-7"
    >
      <link rel="stylesheet" href={BANNER_FONT_URL} />
      <div className="flex flex-col gap-7 md:flex-row md:items-stretch md:justify-between md:gap-10 fit:flex-row fit:items-stretch fit:justify-between fit:gap-10">
        {/* ---------- বাম পাশ ---------- */}
        <div className="flex max-w-[33rem] flex-col justify-center">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-[2px] w-8 bg-[#F2B93B]" />
            <span
              className={`text-[15px] font-medium text-[#F2B93B] ${bn ? "" : "uppercase tracking-[0.08em] text-[14px]"}`}
            >
              {L(BANNER_COPY.eyebrow)}
            </span>
          </div>

          <p className="mt-4 min-h-5 text-base text-[#D8C9A6]">
            <span className="greet-variant greet-morning">
              <DT>{"Good morning"}</DT>
            </span>
            <span className="greet-variant greet-afternoon">
              <DT>{"Good afternoon"}</DT>
            </span>
            <span className="greet-variant greet-evening">
              <DT>{"Good evening"}</DT>
            </span>
            <span className="greet-variant greet-night">
              <DT>{"Good night"}</DT>
            </span>
          </p>
          <h2
            className={`mt-1 text-[28px] font-bold sm:text-[38px] fit:text-[38px] ${bn ? "leading-[1.4]" : "leading-[1.15] tracking-[-0.015em]"}`}
          >
            {L(BANNER_COPY.welcome)}{" "}
            <span
              className="first-name-pre text-[#F2B93B]"
              data-k={nameKnown ? 1 : 0}
            >
              {nameKnown ? firstName : null}
            </span>
          </h2>

          <p
            className={`mt-3 text-[17px] text-[#E9DDC3] ${bn ? "leading-[1.85]" : "leading-7"}`}
          >
            {L(BANNER_COPY.lead)}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/sohoj-tools"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#DC2626] px-5 py-2.5 text-base font-semibold text-white outline-none transition-all duration-150 hover:bg-[#B91C1C] active:scale-[0.98] active:bg-[#991B1B] focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3B2F1E]"
            >
              {L(BANNER_COPY.explore)}
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/my-files"
              prefetch
              onMouseEnter={() => prefetchMyFilesData()}
              onFocus={() => prefetchMyFilesData()}
              onTouchStart={() => prefetchMyFilesData(true)}
              onMouseDown={() => prefetchMyFilesData(true)}
              onClick={() => prefetchMyFilesData(true)}
              className="inline-flex cursor-pointer items-center rounded-md border border-[#FBF6E8]/35 px-5 py-2.5 text-base font-medium text-white outline-none transition-colors hover:bg-[#FBF6E8]/10 focus-visible:ring-2 focus-visible:ring-[#FBF6E8]/50"
            >
              {L(BANNER_COPY.myFiles)}
            </Link>
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-[#D8C9A6]">
            <span>
              {toolCount}
              {bn ? "" : " "}
              {L(BANNER_COPY.freeTools)}
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-[#FBF6E8]/25" />
            <span>{L(BANNER_COPY.noInstall)}</span>
            <span aria-hidden="true" className="h-3 w-px bg-[#FBF6E8]/25" />
            <span>{L(BANNER_COPY.minutes)}</span>
          </p>
        </div>

        {/* ---------- মাঝখান: সরাসরি অ্যাডমিনের সঙ্গে যোগাযোগ ---------- */}
        <UserAdminChat />

        {/* ---------- ডান পাশ: এআই এডিটর কার্ড ---------- */}
        <div
          aria-hidden="true"
          className="w-full shrink-0 overflow-hidden rounded-lg bg-[#FBF6E8] text-[#3B2F1E] shadow-[0_8px_24px_-10px_rgba(59,47,30,0.45)] md:w-[460px] fit:w-[480px]"
        >
          <div className="px-5 pb-1 pt-4">
            <p className="text-[14px] font-semibold text-[#DC2626]">
              {L(BANNER_COPY.cardLabel)}
            </p>
            <p
              className={`mt-0.5 text-[19px] font-bold text-[#3B2F1E] ${bn ? "leading-[1.5]" : "leading-snug"}`}
            >
              {L(BANNER_COPY.cardTitle)}
            </p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 fit:grid-cols-2">
            {AI_JOBS.map((job, i) => (
              <li
                key={i}
                className={`flex items-start gap-3 border-t border-[#E3D6B8] px-5 py-3 ${i % 2 === 0 ? "sm:border-r fit:border-r" : ""}`}
              >
                <span className="relative mt-0.5 shrink-0">
                  <span
                    className="block h-11 w-11 overflow-hidden rounded-xl shadow-sm"
                    style={{ backgroundColor: job.color }}
                  >
                    <AiJobIcon kind={job.kind} color={job.color} />
                  </span>
                  <span className="absolute -left-1.5 -top-1.5 rounded bg-[#F2B93B] px-1 py-[2px] text-[11px] font-bold leading-none text-[#3B2F1E] shadow-sm">
                    {bn ? "এআই" : "AI"}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[15.5px] font-semibold leading-snug text-[#3B2F1E]">
                    {L(job.title)}
                  </span>
                  <span
                    className={`mt-0.5 block text-[14px] text-[#7A6A50] ${bn ? "leading-[1.6]" : "leading-snug"}`}
                  >
                    {L(job.sub)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#E3D6B8] bg-[#F6EEDB] px-5 py-3">
            <p className="text-[13.5px] font-semibold text-[#7A6A50]">
              {L(BANNER_COPY.alsoLabel)}
            </p>
            <p
              className={`mt-0.5 text-[14.5px] text-[#5A4A32] ${bn ? "leading-[1.7]" : "leading-5"}`}
            >
              {L(BANNER_COPY.also)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
/* ------------------------------------------------------------------ */
/* Home screen: Popular tools + banner, always one screen              */
/* ------------------------------------------------------------------ */
// ব্রাউজার জুম যাই হোক, টুলস + ব্যানার একসাথে পুরো স্ক্রিন জুড়ে আঁটবে; ফুটার একটু স্ক্রল করলে আসবে
const FIT_MIN_WIDTH = 1232; // px — লেআউটের সবচেয়ে ছোট চওড়া (আগের মাপ)
const FIT_MAX_WIDTH = 1800; // px — বড় স্ক্রিনে লেআউট এত চওড়া পর্যন্ত বাড়বে (কমালে লেখা বড় হবে কিন্তু দুই পাশে ফাঁকা বাড়বে; বাড়ালে উল্টো)
const FIT_MAX_SCALE = 6; // জুম-আউটে/বড় স্ক্রিনে সর্বোচ্চ কতটা বড় হবে (বাড়ালে জুম-আউটেও পুরো স্ক্রিন জুড়ে থাকবে)
const FIT_MIN_SCALE = 0.2; // অনেক জুমে সর্বনিম্ন কতটা ছোট হবে
const FIT_PAD_Y = 24; // উপরে-নিচের ফাঁকা (px)
const FIT_PAD_X = 24; // দুই পাশের ফাঁকা (px)
function HomeScreen({ userName }: { userName: string | null }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Desktop "fit": measure the real layout and write it to CSS variables on <html>. The variables
  // were already set from the cache before first paint (PrePaintScript), so this normally only
  // confirms them; if the screen / zoom / font really changed, it corrects them before paint.
  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;
    const mq = window.matchMedia("(pointer: fine)");
    let teardown: (() => void) | null = null;
    const start = () => {
      teardown?.();
      teardown = null;
      root.setAttribute("data-fit", mq.matches ? "1" : "0");
      if (!mq.matches) {
        content.style.width = "";
        return;
      }
      let raf = 0;
      let raf2 = 0;
      const update = () => {
        // নেভবারের নিচ থেকে শুরু — উচ্চতা হাতে ধরে না দিয়ে মেপে নিচ্ছি
        const top = Math.max(
          section.getBoundingClientRect().top + window.scrollY,
          0,
        );
        const availW = root.clientWidth - FIT_PAD_X * 2;
        const availH = window.innerHeight - top - FIT_PAD_Y * 2;
        if (availW <= 0 || availH <= 0) return;
        // দুই চওড়ায় কন্টেন্টের উচ্চতা মেপে বের করছি স্ক্রিনের মাপে ঠিক কত চওড়া লেআউট আঁটবে
        const measure = (w: number) => {
          content.style.width = `${w}px`;
          return content.offsetHeight;
        };
        const h1 = measure(FIT_MIN_WIDTH);
        const h2 = measure(FIT_MAX_WIDTH);
        if (!h1 || !h2) return;
        const slope = (h2 - h1) / (FIT_MAX_WIDTH - FIT_MIN_WIDTH);
        const base = h1 - slope * FIT_MIN_WIDTH;
        const denom = availH - slope * availW;
        const ideal =
          denom > 0 && base > 0 ? (base * availW) / denom : FIT_MAX_WIDTH;
        let width = Math.round(
          Math.min(FIT_MAX_WIDTH, Math.max(FIT_MIN_WIDTH, ideal)),
        );
        let height = measure(width);
        if (!height) {
          content.style.width = "";
          return;
        }
        const raw = Math.min(availW / width, availH / height);
        const scale = Math.min(FIT_MAX_SCALE, Math.max(FIT_MIN_SCALE, raw));
        // পুরো পেজ জুড়ে রাখতে: স্কেল ঠিক রেখে লেআউটকে স্ক্রিনের পুরো চওড়ায় ছড়িয়ে দিচ্ছি।
        // চওড়া বাড়লে উচ্চতা কমে বা একই থাকে, তাই স্ক্রিনে এখনও আঁটবে।
        const fillWidth = Math.round(availW / scale);
        if (fillWidth > width) {
          width = fillWidth;
          height = measure(width);
        }
        // leave the CSS (var(--hv-w)) in charge of the width again
        content.style.width = "";
        if (!height) return;
        const st = root.style;
        const same =
          st.getPropertyValue("--hv-w") === `${width}px` &&
          st.getPropertyValue("--hv-h") === `${height}px` &&
          st.getPropertyValue("--hv-top") === `${top}px` &&
          Math.abs(parseFloat(st.getPropertyValue("--hv-s")) - scale) < 0.0005;
        if (!same) {
          st.setProperty("--hv-w", `${width}px`);
          st.setProperty("--hv-h", `${height}px`);
          st.setProperty("--hv-s", String(scale));
          st.setProperty("--hv-top", `${top}px`);
        }
        saveHomeLayout({ w: width, h: height, s: scale, top });
      };
      // measure now (still before paint), then once more a frame later when the navbar has
      // applied its own zoom scale so `top` is final. We do NOT wait for web fonts: the
      // ResizeObserver below re-fits if a font changes the text size later.
      update();
      raf = requestAnimationFrame(update);
      // জুম করলে viewport-এর মাপ বদলায়, তাই resize শুনছি
      const onResize = () => {
        update();
        cancelAnimationFrame(raf2);
        raf2 = requestAnimationFrame(update);
      };
      window.addEventListener("resize", onResize);
      const ro = new ResizeObserver(update);
      ro.observe(content);
      teardown = () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(raf2);
        window.removeEventListener("resize", onResize);
        ro.disconnect();
      };
    };
    start();
    mq.addEventListener("change", start);
    return () => {
      mq.removeEventListener("change", start);
      teardown?.();
    };
  }, []);
  return (
    <section
      ref={sectionRef}
      className="home-fit-section mx-auto max-w-[1800px] px-4 pb-8 pt-4 sm:px-6 sm:pt-6 fit:mx-0 fit:flex fit:max-w-none fit:items-center fit:justify-center fit:p-6"
      style={
        {
          "--tile-box-fit": `${TOOL_TILE_SIZE_PERCENT}%`,
        } as CSSProperties
      }
    >
      <div className="home-fit-outer">
        <div ref={contentRef} className="home-fit-inner">
          <WelcomeBanner userName={userName} />
          <PopularToolsSection />
        </div>
      </div>
    </section>
  );
}
/* ------------------------------------------------------------------ */
/* Footer credit                                                       */
/* ------------------------------------------------------------------ */
function PersonName({
  name,
  href,
  className,
}: {
  name: string;
  href?: string;
  className: string;
}) {
  if (!href) return <span className={className}>{name}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} underline-offset-4 hover:underline`}
    >
      {name}
    </a>
  );
}
// my-nafia:start
function CreditLine() {
  return (
    <footer
      className="border-t border-[#E3D6B8] bg-[#F2E8D2]"
      style={{
        fontFamily:
          '"Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-5 text-base text-[#7A6A50] sm:px-6 md:flex-row md:justify-between">
        <p>
          <span className="font-semibold text-[#3B2F1E]">
            <DT>{"srizon"}</DT>
          </span>
          <span className="ml-2 text-[#7A6A50]">
            <DT>{"\u00A9 "}</DT>
            {new Date().getFullYear()}
          </span>
        </p>

        <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-5">
          <div className="flex flex-col items-center sm:items-start">
            <p>
              <DT>{"Crafted with"}</DT>
              {<DT> </DT>}
              <Heart
                size={13}
                className="-mt-0.5 inline fill-red-500 text-red-500 transition-transform duration-200 hover:scale-125"
                aria-label="love"
              />
              {<DT> </DT>}
              <DT>{"by"}</DT>
              {<DT> </DT>}
              <PersonName
                name={CREATOR_NAME}
                href={CREATOR_URL}
                className="font-semibold text-[#DC2626]"
              />
            </p>
            <a
              href="tel:01783666743"
              className="text-sm text-[#7A6A50] hover:text-[#5A4A32] hover:underline"
            >
              <DT>{"01783666743\n            "}</DT>
            </a>
          </div>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-[#D8C9A6] sm:block"
          />
          <p>
            <DT>{"Inspired by"}</DT>
            {<DT> </DT>}
            <PersonName
              name={INSPIRED_BY_NAME}
              href={INSPIRED_BY_URL}
              className="font-semibold text-[#3B2F1E]"
            />
          </p>
        </div>
      </div>
    </footer>
  );
}
// my-nafia:end
// my-nafia:start
function ContactCard() {
  const [photoFailed, setPhotoFailed] = useState(false);
  return (
    <section className="border-t border-[#E3D6B8] bg-[#F2E8D2]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:gap-5 sm:px-6 sm:text-left">
        {photoFailed ? (
          <div
            role="img"
            aria-label={CONTACT_NAME}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#E3D6B8] bg-[#FEE9E9] text-xl font-semibold text-[#DC2626] shadow-sm"
          >
            JS
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={CONTACT_PHOTO_URL}
            alt={CONTACT_NAME}
            referrerPolicy="no-referrer"
            onError={() => setPhotoFailed(true)}
            className="h-16 w-16 shrink-0 rounded-full border border-[#E3D6B8] object-cover shadow-sm"
          />
        )}
        <div>
          <p className="text-sm text-[#7A6A50]">
            <DT>{"Contact"}</DT>
          </p>
          <PersonName
            name={CONTACT_NAME}
            href={CONTACT_FACEBOOK_URL}
            className="text-lg font-semibold text-[#DC2626]"
          />
          {CONTACT_FACEBOOK_URL && (
            <p className="text-sm text-[#7A6A50]">
              <DT>{"Facebook"}</DT>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
// my-nafia:end
/* ------------------------------------------------------------------ */
/* Login success progress bar                                          */
/* ------------------------------------------------------------------ */
// ১.৬ সেকেন্ডে ধীরে ধীরে ভরে ওঠে (modal বন্ধ হওয়ার সময়ের সাথে মিলিয়ে)
function LoginProgress() {
  const [go, setGo] = useState<boolean>(false);
  useEffect(() => {
    const id = setTimeout(() => setGo(true), 30);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-[#F3E9D2]">
      <div
        className="h-full rounded-full bg-[#DC2626] transition-[width] ease-out"
        style={{ width: go ? "100%" : "0%", transitionDuration: "1500ms" }}
      />
    </div>
  );
}
/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function DashboardClient({
  initialLoginSuccess = false,
}: {
  initialLoginSuccess?: boolean;
  // true while the root layout's LoginSuccessOverlay is covering this page
  loginOverlayActive?: boolean;
}) {
  const router = useRouter();
  // Render the dashboard immediately. Authentication is verified in the background so
  // a valid session never sees a full-screen "Checking authentication..." blocker.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [showLoginSuccess, setShowLoginSuccess] =
    useState<boolean>(initialLoginSuccess);
  // null = not known yet (see WelcomeBanner). The cached name is read before the first paint so
  // the common case never shows a placeholder at all.
  const [userName, setUserName] = useState<string | null>(null);
  // my-nafia:start
  const [shownA, setShownA] = useState<boolean>(false);
  const [shownB, setShownB] = useState<boolean>(false);
  // my-nafia:end
  // my-nafia:start
  useEffect(() => {
    const GAP = 2000;
    const SEQ = [10, 5, 5, 10];
    let step = 0;
    let count = 0;
    let tmr: ReturnType<typeof setTimeout> | null = null;
    const onDoc = () => {
      count += 1;
      if (tmr) clearTimeout(tmr);
      if (count >= SEQ[step]) {
        count = 0;
        if (step === 0) setShownA(true);
        else if (step === 1) setShownB(true);
        else if (step === 2) setShownB(false);
        else setShownA(false);
        step = (step + 1) % SEQ.length;
        return;
      }
      tmr = setTimeout(() => {
        count = 0;
      }, GAP);
    };
    document.addEventListener("click", onDoc);
    return () => {
      document.removeEventListener("click", onDoc);
      if (tmr) clearTimeout(tmr);
    };
  }, []);
  // my-nafia:end
  // The success flag is also passed from the server page so the overlay is
  // present in the very first HTML response. That prevents a server-rendered
  // dashboard frame from being painted before the popup exists.
  useEffect(() => {
    if (!initialLoginSuccess) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("loginSuccess") === "1") {
      url.searchParams.delete("loginSuccess");
      window.history.replaceState(window.history.state, "", url.toString());
    }
    const timer = window.setTimeout(() => {
      setShowLoginSuccess(false);
      router.replace("/dashboard");
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [initialLoginSuccess, router]);
  useIsoLayoutEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?.fullName) setUserName(userObj.fullName);
    } catch {
      // Cached user data is optional.
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    void getClientSession().then((session) => {
      if (!mounted) return;
      if (!session.authenticated) {
        router.replace("/login?callbackUrl=%2Fdashboard");
        return;
      }
      if (session.user?.fullName) {
        setUserName(session.user.fullName);
      } else {
        // no name from the session: keep the cached one, otherwise use the old default
        setUserName((current) => current ?? "User");
      }
      setIsAuthenticated(true);
    });
    return () => {
      mounted = false;
    };
  }, [router]);
  if (!isAuthenticated) {
    return (
      <div className="page-font flex min-h-screen items-center justify-center bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] font-sans text-[#3B2F1E]">
        <style>{PAGE_FONT_CSS}</style>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#DC2626] border-t-transparent"></div>
          <p className="text-sm font-semibold text-[#5A4A32]">
            <DT>{"Checking authentication...\n          "}</DT>
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="page-font relative flex min-h-svh flex-col justify-between bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] font-sans antialiased text-[#3B2F1E]">
      <style>{PAGE_FONT_CSS}</style>
      <div>
        <DashboardNavbar scaleWithZoom />

        {/* ব্যানার উপরে + টুলস নিচে, একসাথে প্রথম স্ক্রিনে; ফুটার একটু স্ক্রল করলে */}
        <HomeScreen userName={userName} />
      </div>

      <div>
        {/* my-nafia:start */}
        {shownA && <CreditLine />}
        {shownB && <ContactCard />}
        {/* my-nafia:end */}
      </div>

      {showLoginSuccess && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#3B2F1E]/50 px-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-success-title"
            className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-7 text-center shadow-xl animate-in zoom-in-95 duration-300"
          >
            {/* লাল রঙের ক্লোজ বাটন */}
            <button
              type="button"
              onClick={() => {
                setShowLoginSuccess(false);
                router.replace("/dashboard");
              }}
              className="absolute right-3 top-3 z-10 cursor-pointer rounded-md p-1.5 text-[#7A6A50] transition-colors hover:bg-[#F3E9D2] hover:text-[#5A4A32]"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2
                size={26}
                strokeWidth={2}
                className="animate-in zoom-in-50 duration-500"
              />
            </div>

            <h3
              id="login-success-title"
              className="text-xl font-semibold text-[#3B2F1E]"
            >
              <DT>{"Login Successful!\n            "}</DT>
            </h3>
            <p className="mt-1 text-base text-[#7A6A50]">
              <DT>{"Welcome back,"}</DT>
              {<DT> </DT>}
              <span className="font-medium text-[#3B2F1E]">
                {userName ?? "User"}
              </span>
              <DT>{"!\n            "}</DT>
            </p>

            <LoginProgress />
          </div>
        </div>
      )}
    </div>
  );
}
