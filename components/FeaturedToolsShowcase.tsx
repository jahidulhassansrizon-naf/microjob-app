"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Play,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { T } from "@/components/i18n/I18nProvider";

type Group = "photo" | "documents" | "design";

type FeaturedTool = {
  id: string;
  group: Group;
  title: string;
  category: string;
  description: string;
  href: string;
  imageSrc: string;
  accent: string;
  // Add a public asset path when a tutorial video is ready, e.g.
  // videoSrc: "/videos/home-tools/print-media.mp4".
  videoSrc: string | null;
};

const FEATURED_TOOLS: FeaturedTool[] = [
  {
    id: "print-media",
    group: "design",
    title: "Print Media",
    category: "Print & design",
    description:
      "Create banners, posters, flyers, signboards and promotional designs with ready-to-edit templates.",
    href: "/login?redirect=/print-media",
    imageSrc: "/Herothumbnail/printmedia.png",
    accent: "from-amber-100 via-orange-50 to-rose-100",
    videoSrc: null,
  },
  {
    id: "question-paper",
    group: "design",
    title: "Question Paper Maker",
    category: "Education",
    description:
      "Build school and college exam papers with your own questions, marks and layout.",
    href: "/login?redirect=/questions-create/create",
    imageSrc: "/Herothumbnail/question.png",
    accent: "from-sky-100 via-blue-50 to-indigo-100",
    videoSrc: null,
  },
  {
    id: "ai-template",
    group: "photo",
    title: "AI Template",
    category: "Creative photos",
    description:
      "Choose a design template and create a personalized photo using your own image.",
    href: "/login?redirect=/ai-template",
    imageSrc: "/Herothumbnail/aiTemplate.png",
    accent: "from-violet-100 via-fuchsia-50 to-pink-100",
    videoSrc: null,
  },
  {
    id: "ai-editor",
    group: "photo",
    title: "AI Editor",
    category: "Photo restoration",
    description:
      "Enhance old, faded or damaged photos, remove backgrounds and prepare passport-size images.",
    href: "/login?redirect=/ai-editor",
    imageSrc: "/Herothumbnail/aiEditor.png",
    accent: "from-indigo-100 via-blue-50 to-cyan-100",
    videoSrc: null,
  },
  {
    id: "bulk-photo-edit",
    group: "photo",
    title: "Bulk Photo Edit",
    category: "Batch editing",
    description:
      "Edit, resize and prepare many photos together in one simple workflow.",
    href: "/login?redirect=/bulk-photo-edit",
    imageSrc: "/Herothumbnail/bulkPhoto.png",
    accent: "from-emerald-100 via-teal-50 to-cyan-100",
    videoSrc: null,
  },
  {
    id: "document-scanner",
    group: "documents",
    title: "Document Scanner",
    category: "Document cleanup",
    description:
      "Scan documents, clean stains and shadows, sharpen text and make pages look neat.",
    href: "/login?callbackUrl=%2Fsohoj-tools%2Fdocument-scanner",
    imageSrc: "/Herothumbnail/documentScan.jpg",
    accent: "from-lime-100 via-emerald-50 to-green-100",
    videoSrc: null,
  },
  {
    id: "govt-job-photo-sign",
    group: "documents",
    title: "Govt. Job Photo & Signature",
    category: "Job applications",
    description:
      "Prepare applicant photos and signatures in the dimensions and file size required for applications.",
    href: "/login?callbackUrl=%2Fsohoj-tools%2Fgovt-job-photo-sign-resizer",
    imageSrc: "/Herothumbnail/governmentJob.jpg",
    accent: "from-rose-100 via-red-50 to-orange-100",
    videoSrc: null,
  },
  {
    id: "nid-joiner",
    group: "documents",
    title: "NID Joiner",
    category: "NID preparation",
    description:
      "Combine both sides of an NID into one neat, print-ready page.",
    href: "/login?callbackUrl=%2Fsohoj-tools%2Fnid-joiner",
    imageSrc: "/Herothumbnail/nidJoiner.jpg",
    accent: "from-cyan-100 via-sky-50 to-blue-100",
    videoSrc: null,
  },
];


const FILTERS: { id: "all" | Group; label: string }[] = [
  { id: "all", label: "All tools" },
  { id: "photo", label: "Photo" },
  { id: "documents", label: "Documents" },
  { id: "design", label: "Design & print" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------- Hero visual: tilt deck ------------------------- */

const DECK = [
  {
    src: "/Herothumbnail/printmedia.png",
    alt: "Print Media preview",
    pos: "right-0 top-0 w-[72%]",
    rotate: 5,
    depth: 18,
    delay: 0.25,
  },
  {
    src: "/Herothumbnail/aiTemplate.png",
    alt: "AI Template preview",
    pos: "left-0 top-[31%] w-[72%]",
    rotate: -4,
    depth: 34,
    delay: 0.4,
  },
  {
    src: "/Herothumbnail/aiEditor.png",
    alt: "AI Editor preview",
    pos: "bottom-0 right-[3%] w-[70%]",
    rotate: 1.5,
    depth: 52,
    delay: 0.55,
  },
];

function HeroDeck() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.6 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const rotX = useTransform(sy, [-0.5, 0.5], [6, -6]);

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative mx-auto hidden h-[430px] w-full max-w-[560px] [perspective:1400px] md:block lg:h-[470px]"
    >
      {/* glow behind the deck */}
      <div
        aria-hidden
        className="absolute inset-x-6 inset-y-10 -z-10 rounded-[48px] bg-gradient-to-br from-blue-400/30 via-indigo-400/25 to-fuchsia-300/30 blur-3xl"
      />

      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="relative h-full w-full"
      >
        {DECK.map((c) => (
          <motion.div
            key={c.src}
            initial={{ opacity: 0, y: 46, rotate: 0, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotate: c.rotate, scale: 1 }}
            transition={{ duration: 0.9, delay: c.delay, ease: EASE }}
            style={{ translateZ: c.depth }}
            className={`absolute ${c.pos}`}
          >
            <div className="rounded-[22px] bg-white p-1.5 shadow-[0_34px_60px_-26px_rgba(30,41,99,0.55)] ring-1 ring-slate-900/10">
              <div className="aspect-video overflow-hidden rounded-[17px] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.src}
                  alt={c.alt}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            </div>
          </motion.div>
        ))}

        {/* floating chips */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: EASE }}
          style={{ translateZ: 80 }}
          className="absolute left-[2%] top-[4%] flex items-center gap-2 rounded-full border border-white bg-white/90 py-1.5 pl-2 pr-3.5 text-[11.5px] font-bold text-slate-800 shadow-[0_14px_30px_-14px_rgba(30,41,99,0.5)] backdrop-blur"
        >
          <CheckCircle2 size={16} className="text-emerald-500" />
          <T>{"Browse first, sign in later"}</T>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.15, ease: EASE }}
          style={{ translateZ: 90 }}
          className="absolute bottom-[6%] left-[3%] flex items-center gap-2 rounded-full bg-slate-950 py-1.5 pl-2 pr-3.5 text-[11.5px] font-bold text-white shadow-[0_18px_34px_-14px_rgba(15,23,42,0.7)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600">
            <Users size={12} />
          </span>
          <T>{"Trusted by 35,000+ users"}</T>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ----------------------------- Tool card ----------------------------- */

type Variant = "regular" | "feature" | "wide";

function ToolCard({
  tool,
  variant,
  onWatch,
}: {
  tool: FeaturedTool;
  variant: Variant;
  onWatch: (t: FeaturedTool) => void;
}) {
  const ref = useRef<HTMLElement>(null);

  // Cursor-following spotlight (CSS variables, no re-render)
  const onMove = (e: ReactMouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const feature = variant === "feature";
  const wide = variant === "wide";

  return (
    <motion.article
      ref={ref}
      layout
      onMouseMove={onMove}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={`group relative flex overflow-hidden rounded-[26px] bg-white p-2.5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_34px_-24px_rgba(30,41,99,0.35)] ring-1 ring-slate-200/80 transition-shadow duration-300 hover:shadow-[0_28px_56px_-28px_rgba(67,56,202,0.45)] ${
        feature
          ? "flex-col sm:col-span-2 lg:row-span-2"
          : wide
            ? "flex-col sm:col-span-2 sm:flex-row"
            : "flex-col"
      }`}
    >
      {/* spotlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-[26px] opacity-0 transition-opacity duration-300 [background:radial-gradient(380px_circle_at_var(--mx,50%)_var(--my,50%),rgba(99,102,241,0.12),transparent_62%)] group-hover:opacity-100"
      />

      {/* media */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-[18px] bg-gradient-to-br ${tool.accent} ${
          feature
            ? "aspect-video lg:aspect-auto lg:min-h-[300px] lg:flex-1"
            : wide
              ? "aspect-video sm:w-[54%]"
              : "aspect-video"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tool.imageSrc}
          alt={`${tool.title} preview`}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur">
          <T>{tool.category}</T>
        </div>

        {tool.videoSrc ? (
          <button
            type="button"
            onClick={() => onWatch(tool)}
            aria-label={`Watch ${tool.title} video`}
            className="absolute bottom-2.5 right-2.5 z-30 inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-950/80 px-3 text-[10px] font-bold text-white shadow-lg backdrop-blur transition hover:bg-slate-950"
          >
            <Play size={12} fill="currentColor" />
            <T>{"Watch video"}</T>
          </button>
        ) : (
          <span className="absolute bottom-2.5 right-2.5 inline-flex h-7 items-center gap-1.5 rounded-full bg-white/75 px-2.5 text-[10px] font-semibold text-slate-600 backdrop-blur">
            <Play size={10} />
            <T>{"Video coming soon"}</T>
          </span>
        )}
      </div>

      {/* body */}
      <div
        className={`relative z-10 flex flex-1 flex-col px-2 pb-1 pt-3.5 ${
          wide ? "sm:justify-center sm:px-5" : ""
        }`}
      >
        <h3
          className={`font-extrabold leading-snug tracking-[-0.015em] text-slate-950 ${
            feature ? "text-xl sm:text-2xl" : "text-[15px] sm:text-base"
          }`}
        >
          <T>{tool.title}</T>
        </h3>
        <p
          className={`mt-1.5 leading-relaxed text-slate-500 ${
            feature
              ? "max-w-md text-[13px] sm:text-sm"
              : "line-clamp-2 text-xs"
          }`}
        >
          <T>{tool.description}</T>
        </p>
        <div className="mt-auto pt-4">
          <Link
            href={tool.href}
            className="group/btn inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100 pl-4 pr-3 text-xs font-bold text-slate-800 transition-colors duration-200 after:absolute after:inset-0 after:content-[''] hover:bg-slate-950 hover:text-white group-hover:bg-slate-950 group-hover:text-white"
          >
            <T>{"Open tool"}</T>
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------ Section ------------------------------ */

export default function FeaturedToolsShowcase() {
  const [activeVideo, setActiveVideo] = useState<FeaturedTool | null>(null);
  const [filter, setFilter] = useState<"all" | Group>("all");

  useEffect(() => {
    if (!activeVideo) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveVideo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeVideo]);

  const visible =
    filter === "all"
      ? FEATURED_TOOLS
      : FEATURED_TOOLS.filter((t) => t.group === filter);

  const variantFor = (i: number): Variant => {
    if (filter !== "all") return "regular";
    if (i === 0) return "feature";
    if (i === visible.length - 1) return "wide";
    return "regular";
  };

  const countOf = (id: "all" | Group) =>
    id === "all"
      ? FEATURED_TOOLS.length
      : FEATURED_TOOLS.filter((t) => t.group === id).length;

  return (
    <section
      id="featured-tools"
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#F8F9FF] via-[#F6F8FF] to-[#F3F5FD] px-4 pb-10 pt-[100px] sm:px-6 sm:pb-14 sm:pt-[116px] lg:px-10"
    >
      {/* background: aurora + fine grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-[8%] h-[30rem] w-[44rem] rounded-full bg-gradient-to-r from-blue-300/40 to-indigo-300/30 blur-3xl" />
        <div className="absolute -top-40 right-[-6%] h-[28rem] w-[38rem] rounded-full bg-gradient-to-l from-fuchsia-200/50 to-violet-300/40 blur-3xl" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(30,41,99,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,99,0.055)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_30%,transparent_100%)]" />
      </div>

      <div className="mx-auto max-w-[1240px]">
        {/* ================= HERO ================= */}
        <div className="grid items-center gap-10 pb-12 pt-4 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6 lg:pb-16 lg:pt-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/80 py-1 pl-1 pr-3.5 text-[11.5px] font-bold text-indigo-700 shadow-sm backdrop-blur"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                <Sparkles size={12} />
              </span>
              <T>{"Essential tools, beautifully organized"}</T>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
              className="mt-5 text-[38px] font-black leading-[1.04] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[58px]"
            >
              <T>{"Your everyday digital work, all in one place"}</T>
              <span className="mt-2 block bg-gradient-to-r from-blue-700 via-indigo-600 to-fuchsia-600 bg-clip-text pb-1 text-transparent">
                <T>{"Choose a tool. Get it done."}</T>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
              className="mt-5 max-w-xl text-[15px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8"
            >
              <T>
                {
                  "From photo editing and exam papers to document cleanup, NID preparation and print-ready designs — discover the tools you need and start in a few clicks."
                }
              </T>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: EASE }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href="/register"
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 text-sm font-bold text-white shadow-[0_18px_34px_-14px_rgba(79,70,229,0.75)] ring-1 ring-white/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-14px_rgba(79,70,229,0.8)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[420%]"
                />
                <span className="relative">
                  <T>{"Start creating"}</T>
                </span>
                <ArrowRight
                  size={16}
                  className="relative transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/tools"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 px-6 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md"
              >
                <T>{"Explore all tools"}</T>
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-9 flex items-stretch gap-6 border-t border-slate-200/80 pt-6"
            >
              <div>
                <dt className="text-2xl font-black tracking-tight text-slate-950">
                  30+
                </dt>
                <dd className="text-xs font-medium text-slate-500">
                  <T>{"smart tools"}</T>
                </dd>
              </div>
              <span className="w-px bg-slate-200" />
              <div>
                <dt className="text-2xl font-black tracking-tight text-slate-950">
                  35,000+
                </dt>
                <dd className="text-xs font-medium text-slate-500">
                  <T>{"happy users"}</T>
                </dd>
              </div>
              <span className="w-px bg-slate-200" />
              <div>
                <dt className="text-2xl font-black tracking-tight text-slate-950">
                  বাং / EN
                </dt>
                <dd className="text-xs font-medium text-slate-500">
                  <T>{"One simple place"}</T>
                </dd>
              </div>
            </motion.dl>
          </div>

          <HeroDeck />
        </div>

        {/* ================= TOOLS ================= */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-600 to-fuchsia-600" />
            <h2 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">
              <T>{"Explore our featured tools"}</T>
            </h2>
          </div>

          <LayoutGroup id="tool-filter">
            <div
              role="tablist"
              className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-slate-200/90 bg-white/80 p-1 shadow-sm backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.id)}
                    className={`relative isolate shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                      active
                        ? "text-white"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="filter-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-slate-950 shadow-md"
                        transition={{
                          type: "spring",
                          stiffness: 460,
                          damping: 36,
                        }}
                      />
                    )}
                    <T>{f.label}</T>
                    <span
                      className={`ml-1.5 text-[10px] ${
                        active ? "text-white/60" : "text-slate-400"
                      }`}
                    >
                      {countOf(f.id)}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                variant={variantFor(i)}
                onWatch={setActiveVideo}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* footer strip */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-[22px] border border-indigo-100/80 bg-white/80 px-5 py-3.5 text-center shadow-sm backdrop-blur sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-indigo-500/30">
              <Sparkles size={16} />
            </span>
            <p className="text-xs font-semibold leading-relaxed text-slate-600">
              <T>
                {
                  "New to Seba Lagbe? Browse the tools first, then sign in whenever you are ready to use one."
                }
              </T>
            </p>
          </div>
          <Link
            href="/tools"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-indigo-700 hover:text-violet-700"
          >
            <T>{"See all tools"}</T>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* video modal (unchanged behaviour) */}
      <AnimatePresence>
        {activeVideo && activeVideo.videoSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setActiveVideo(null);
            }}
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeVideo.title} tutorial`}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    <T>{activeVideo.title}</T>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    <T>{"Seba Lagbe video guide"}</T>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close video"
                >
                  <X size={18} />
                </button>
              </div>
              <video
                key={activeVideo.videoSrc}
                src={activeVideo.videoSrc}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
