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
import { getClientSession } from "@/lib/clientAuth";
import {
  toolsData,
  ToolTile,
  type ToolItem,
} from "@/app/_components/toolsData";
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
    'Inter, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans Bengali", system-ui, sans-serif',
} as const;
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
            className="h-9 w-1 shrink-0 rounded-full bg-[#2563EB]"
          />
          <div>
            <h2
              style={HEADING_FONT}
              className={`font-semibold leading-tight tracking-[-0.01em] text-slate-900 text-lg sm:text-xl fit:text-xl`}
            >
              <DT>{"Popular Tools\n            "}</DT>
            </h2>
            <p
              style={HEADING_FONT}
              className="mt-0.5 text-[13px] font-normal leading-snug text-slate-500"
            >
              <DT>{"Free tools to speed up your daily work.\n            "}</DT>
            </p>
          </div>
        </div>

        <Link
          href="/sohoj-tools"
          style={HEADING_FONT}
          className="group inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-3 pr-1 text-[12.5px] font-medium text-slate-700 shadow-sm outline-none transition-all hover:border-[#2563EB] hover:text-[#2563EB] hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          <span>
            <DT>{"View all\n            "}</DT>
            <span className="hidden sm:inline fit:inline">
              {<DT> </DT>}
              {toolsData.length}
              <DT>{"tools\n            "}</DT>
            </span>
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2563EB] text-white transition-transform duration-200 group-hover:translate-x-0.5">
            <ArrowRight size={12} />
          </span>
        </Link>
      </div>

      <div
        className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 fit:grid-cols-8 fit:gap-x-5 fit:gap-y-6"
      >
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
function WelcomeBanner({ userName }: { userName: string | null }) {
  // The greeting depends on the visitor's clock, so the head script sets html[data-greet] before
  // first paint and CSS shows the matching variant (no hydration mismatch, no flip, no flash).
  // userName === null means "not known yet" (cache/session not read): the cached first name is
  // painted by CSS (--user-first) until React renders the real one in the same place.
  const nameKnown = userName !== null;
  const firstName = (userName ?? "User").trim().split(" ")[0] || "there";
  // ডানে সাজানো তিনটা টুল (শুধু দেখানোর জন্য)
  const showcase = ["Nid Joiner", "Compress PDF", "Image Upscaler"]
    .map((name) => toolsData.find((t) => t.name === name))
    .filter((t): t is ToolItem => Boolean(t));
  return (
    <section
      className="mb-6 rounded-xl bg-[#2563EB] px-5 py-5 text-white sm:px-10 sm:py-7 fit:px-10 fit:py-6"
    >
      <div
        className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8 fit:flex-row fit:items-center fit:justify-between fit:gap-8"
      >
        <div className="max-w-xl">
          <p
            className="min-h-5 text-sm text-blue-100"
          >
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
            className="mt-0.5 text-2xl font-semibold sm:text-3xl fit:text-3xl"
          >
            <DT>{"Welcome back, "}</DT>
            <span className="first-name-pre" data-k={nameKnown ? 1 : 0}>
              {nameKnown ? firstName : null}
            </span>
          </h2>

          <p className="mt-2 text-[15px] leading-6 text-blue-50">
            <DT>
              {
                "NID, PDF, images and videos — all your everyday digital tasks are now in one place. Choose the tool you need and finish the job in minutes."
              }
            </DT>
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/sohoj-tools"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#2563EB] outline-none transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <DT>{"Explore all tools\n              "}</DT>
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
              className="inline-flex cursor-pointer items-center rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <DT>{"My Files\n            "}</DT>
            </Link>
          </div>

          <p className="mt-3 text-sm text-blue-100">
            {toolsData.length}
            <DT>{"free tools \u00B7 no installation needed\n          "}</DT>
          </p>
        </div>

        <ul
          aria-hidden="true"
          className="flex shrink-0 gap-3 md:gap-5 fit:gap-5"
        >
          {showcase.map((tool) => {
            const Icon = tool.icon;
            return (
              <li
                key={tool.id}
                className="w-[88px] text-center md:w-24 fit:w-24"
              >
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-lg md:h-16 md:w-16 fit:h-16 fit:w-16 ${tool.bgColor}`}
                >
                  {Icon && <Icon size={30} className="text-white" />}
                </div>
                <p className="mt-2 truncate text-xs text-blue-50">
                  {<DT>{tool.name}</DT>}
                </p>
              </li>
            );
          })}
        </ul>
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
function HomeScreen({
  userName,
}: {
  userName: string | null;
}) {
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
        const width = Math.round(
          Math.min(FIT_MAX_WIDTH, Math.max(FIT_MIN_WIDTH, ideal)),
        );
        const height = measure(width);
        // leave the CSS (var(--hv-w)) in charge of the width again
        content.style.width = "";
        if (!height) return;
        const raw = Math.min(availW / width, availH / height);
        const scale = Math.min(FIT_MAX_SCALE, Math.max(FIT_MIN_SCALE, raw));
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
      className="border-t border-slate-200 bg-white/60"
      style={{
        fontFamily:
          '"Trebuchet MS", "Noto Sans Bengali", "Segoe UI", sans-serif',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-5 text-sm text-slate-500 sm:px-6 md:flex-row md:justify-between">
        <p>
          <span className="font-semibold text-slate-800">
            <DT>{"srizon"}</DT>
          </span>
          <span className="ml-2 text-slate-400">
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
                className="font-semibold text-[#2563EB]"
              />
            </p>
            <a
              href="tel:01783666743"
              className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
            >
              <DT>{"01783666743\n            "}</DT>
            </a>
          </div>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-slate-300 sm:block"
          />
          <p>
            <DT>{"Inspired by"}</DT>
            {<DT> </DT>}
            <PersonName
              name={INSPIRED_BY_NAME}
              href={INSPIRED_BY_URL}
              className="font-semibold text-slate-800"
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
    <section className="border-t border-slate-200 bg-white/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:gap-5 sm:px-6 sm:text-left">
        {photoFailed ? (
          <div
            role="img"
            aria-label={CONTACT_NAME}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-blue-50 text-lg font-semibold text-[#2563EB] shadow-sm"
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
            className="h-16 w-16 shrink-0 rounded-full border border-slate-200 object-cover shadow-sm"
          />
        )}
        <div>
          <p className="text-xs text-slate-500">
            <DT>{"Contact"}</DT>
          </p>
          <PersonName
            name={CONTACT_NAME}
            href={CONTACT_FACEBOOK_URL}
            className="text-base font-semibold text-[#2563EB]"
          />
          {CONTACT_FACEBOOK_URL && (
            <p className="text-xs text-slate-500">
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
    <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-[#2563EB] transition-[width] ease-out"
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-600">
            <DT>{"Checking authentication...\n          "}</DT>
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex min-h-svh flex-col justify-between bg-[#F8FAFC] font-sans antialiased">
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-success-title"
            className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white p-7 text-center shadow-xl animate-in zoom-in-95 duration-300"
          >
            {/* লাল রঙের ক্লোজ বাটন */}
            <button
              type="button"
              onClick={() => {
                setShowLoginSuccess(false);
                router.replace("/dashboard");
              }}
              className="absolute right-3 top-3 z-10 cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
              className="text-lg font-semibold text-slate-900"
            >
              <DT>{"Login Successful!\n            "}</DT>
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              <DT>{"Welcome back,"}</DT>
              {<DT> </DT>}
              <span className="font-medium text-slate-900">
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
