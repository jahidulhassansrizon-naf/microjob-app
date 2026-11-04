"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { T } from "@/components/i18n/I18nProvider";

type FeaturedTool = {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  imageSrc: string;
  accent: string;
  // Add a public asset path when a Gemini tutorial video is ready, e.g.
  // videoSrc: "/videos/home-tools/print-media.mp4".
  videoSrc: string | null;
};

const FEATURED_TOOLS: FeaturedTool[] = [
  {
    id: "print-media",
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

export default function FeaturedToolsShowcase() {
  const [activeVideo, setActiveVideo] = useState<FeaturedTool | null>(null);

  useEffect(() => {
    if (!activeVideo) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveVideo(null);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeVideo]);

  return (
    <section
      id="featured-tools"
      className="relative isolate overflow-hidden bg-[#F7F9FE] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-56 left-1/2 h-[34rem] w-[72rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-200/50 via-violet-200/45 to-fuchsia-100/50 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.34] [background-image:radial-gradient(rgba(100,116,139,0.34)_0.7px,transparent_0.7px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="mx-auto max-w-[1480px]">
        <div className="mb-6 flex flex-col gap-5 xl:mb-7 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/85 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-blue-700 shadow-sm backdrop-blur">
              <Sparkles size={14} className="fill-blue-100" />
              <T>{"Essential tools, beautifully organized"}</T>
            </div>
            <h1 className="text-[30px] font-extrabold leading-[1.2] tracking-tight text-slate-950 sm:text-4xl lg:text-[44px]">
              <T>{"Your everyday digital work, all in one place"}</T>
              <span className="mt-1 block bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                <T>{"Choose a tool. Get it done."}</T>
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-slate-600 sm:text-[15px] sm:leading-7">
              <T>
                {
                  "From photo editing and exam papers to document cleanup, NID preparation and print-ready designs — discover the tools you need and start in a few clicks."
                }
              </T>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
            className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center xl:pb-1"
          >
            <div className="hidden items-center gap-3 rounded-2xl border border-white/90 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900"><T>{"30+ smart tools"}</T></p>
                <p className="text-[11px] font-medium text-slate-500"><T>{"One simple place"}</T></p>
              </div>
            </div>
            <Link
              href="/tools"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[13px] font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md"
            >
              <T>{"Explore all tools"}</T>
              <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/register"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 text-[13px] font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <T>{"Start creating"}</T>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-600 to-violet-600" />
            <h2 className="text-sm font-extrabold tracking-tight text-slate-800 sm:text-base">
              <T>{"Explore our featured tools"}</T>
            </h2>
          </div>
          <span className="hidden text-[11px] font-semibold text-slate-400 sm:inline">
            <T>{"Helpful guides will be added here"}</T>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {FEATURED_TOOLS.map((tool, index) => {
            return (
              <motion.article
                key={tool.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: Math.min(index * 0.045, 0.28), ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                className="group relative flex min-h-[244px] flex-col overflow-hidden rounded-[20px] border border-white bg-white p-2.5 shadow-[0_8px_28px_-20px_rgba(15,23,42,0.32)] ring-1 ring-slate-200/70 transition-shadow hover:shadow-[0_18px_42px_-22px_rgba(30,64,175,0.32)] sm:p-3"
              >
                <div className={`relative aspect-video w-full shrink-0 overflow-hidden rounded-[14px] bg-gradient-to-br ${tool.accent}`}>
                  <img
                    src={tool.imageSrc}
                    alt={`${tool.title} preview`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-transparent" />

                  <div className="absolute left-3.5 top-3.5 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-700 shadow-sm backdrop-blur">
                    <T>{tool.category}</T>
                  </div>

                  <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
                    <T>{"Seba Lagbe workspace"}</T>
                  </div>

                  {tool.videoSrc ? (
                    <button
                      type="button"
                      onClick={() => setActiveVideo(tool)}
                      aria-label={`Watch ${tool.title} video`}
                      className="absolute bottom-2.5 right-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-950/75 px-3 text-[10px] font-bold text-white shadow-lg backdrop-blur transition hover:bg-slate-950"
                    >
                      <Play size={12} fill="currentColor" />
                      <T>{"Watch video"}</T>
                    </button>
                  ) : (
                    <span className="absolute bottom-2.5 right-2.5 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/70 bg-white/65 px-3 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur">
                      <Play size={11} />
                      <T>{"Video coming soon"}</T>
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-1 pt-3">
                  <h3 className="text-[14px] font-extrabold leading-snug tracking-tight text-slate-900 sm:text-[15px]">
                    <T>{tool.title}</T>
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.55] text-slate-500 sm:text-xs">
                    <T>{tool.description}</T>
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-blue-700 transition hover:text-violet-700 sm:text-xs"
                    >
                      <T>{"Open tool"}</T>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <span className="text-[9px] font-semibold text-slate-400">
                      <T>{"Explore"}</T>
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-2 rounded-2xl border border-blue-100/80 bg-white/75 px-4 py-3 text-center shadow-sm backdrop-blur sm:flex-row sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Sparkles size={16} />
            </div>
            <p className="text-[11px] font-semibold leading-relaxed text-slate-600 sm:text-xs">
              <T>{"New to Seba Lagbe? Browse the tools first, then sign in whenever you are ready to use one."}</T>
            </p>
          </div>
          <Link href="/tools" className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold text-blue-700 hover:text-violet-700">
            <T>{"See all tools"}</T>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {activeVideo && activeVideo.videoSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setActiveVideo(null);
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
                  <p className="truncate text-sm font-bold"> <T>{activeVideo.title}</T> </p>
                  <p className="text-[11px] text-slate-400"><T>{"Seba Lagbe video guide"}</T></p>
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
