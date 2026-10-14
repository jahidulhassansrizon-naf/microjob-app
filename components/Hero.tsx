// components/Hero.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { T, useI18n } from "@/components/i18n/I18nProvider";
import {
  toolsData,
  getSlug,
  REQUIRE_SUBSCRIPTION,
} from "@/app/_components/toolsData";

// ব্যানার ছবির (1672×941) ভেতরের মনিটরে যে ২৪টা টুল আছে, সেগুলোর উপর অদৃশ্য ক্লিক-এরিয়া।
// মানগুলো ছবির সাইজের % — ছবি যেভাবেই স্কেল হোক, এরিয়াগুলো টুলের উপরেই থাকবে।
// name অবশ্যই toolsData এর name এর সাথে হুবহু মিলতে হবে।
const BANNER_HOTSPOTS: {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
}[] = [
  { name: "Nid Joiner", left: 42.52, top: 24.12, width: 5.68, height: 12.54 },
  {
    name: "NID Information Correction Form",
    left: 48.98,
    top: 23.49,
    width: 5.86,
    height: 12.75,
  },
  {
    name: "Document Scanner",
    left: 55.5,
    top: 22.74,
    width: 6.16,
    height: 13.18,
  },
  {
    name: "Govt Job Photo & Sign Resizer",
    left: 62.26,
    top: 22.21,
    width: 5.98,
    height: 13.39,
  },
  {
    name: "Remove Background",
    left: 68.78,
    top: 21.68,
    width: 5.56,
    height: 13.39,
  },
  {
    name: "Lock / Unlock PDF",
    left: 74.88,
    top: 21.25,
    width: 6.16,
    height: 13.6,
  },
  { name: "PDF to Image", left: 81.52, top: 21.25, width: 6.88, height: 13.28 },
  { name: "Compress PDF", left: 88.94, top: 21.25, width: 7.0, height: 12.75 },
  { name: "Merge PDFs", left: 42.58, top: 37.51, width: 5.68, height: 12.86 },
  {
    name: "Image Size Reducer",
    left: 48.98,
    top: 37.3,
    width: 5.98,
    height: 12.96,
  },
  {
    name: "Image Upscaler",
    left: 55.62,
    top: 37.09,
    width: 6.1,
    height: 13.07,
  },
  {
    name: "ATS Friendly CV Maker",
    left: 62.32,
    top: 36.56,
    width: 5.98,
    height: 13.39,
  },
  {
    name: "Family Card Form",
    left: 68.84,
    top: 36.24,
    width: 5.62,
    height: 13.6,
  },
  {
    name: "Voter Migration Form",
    left: 75.06,
    top: 36.03,
    width: 6.1,
    height: 13.71,
  },
  {
    name: "Voter Registration Form",
    left: 81.7,
    top: 35.71,
    width: 6.76,
    height: 13.92,
  },
  {
    name: "Passport Joiner",
    left: 89.06,
    top: 35.39,
    width: 6.94,
    height: 14.13,
  },
  { name: "Crop Image", left: 42.64, top: 51.22, width: 5.68, height: 12.43 },
  {
    name: "Age Calculator",
    left: 48.98,
    top: 51.12,
    width: 5.98,
    height: 12.75,
  },
  {
    name: "Reduce Video File Size",
    left: 55.62,
    top: 51.22,
    width: 6.16,
    height: 12.75,
  },
  { name: "Change Speed", left: 62.38, top: 51.22, width: 5.98, height: 12.96 },
  {
    name: "Add Watermark",
    left: 68.84,
    top: 51.12,
    width: 5.68,
    height: 13.18,
  },
  { name: "Images to PDF", left: 75.06, top: 51.01, width: 6.16, height: 13.5 },
  { name: "Image Convert", left: 81.76, top: 51.01, width: 6.76, height: 13.6 },
  { name: "Image to Text", left: 89.17, top: 50.9, width: 6.88, height: 13.92 },
];

export default function Hero() {
  const { t } = useI18n();
  // ToolTile এর মতোই: paid টুলে সাবস্ক্রিপশন না থাকলে /subscription এ যাবে
  const [hasActiveSubscription, setHasActiveSubscription] = useState<
    boolean | null
  >(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription/current", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json().catch(() => ({}));
        const sub = data?.subscription;
        const expiresAt = sub?.expiresAt
          ? new Date(sub.expiresAt).getTime()
          : 0;
        return Boolean(
          sub?.accessStatus === "ACTIVE" &&
          sub?.paymentStatus === "COMPLETED" &&
          expiresAt > Date.now(),
        );
      })
      .catch(() => false)
      .then((active) => {
        if (!cancelled) setHasActiveSubscription(active);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hrefFor = (name: string) => {
    const tool = toolsData.find((t) => t.name === name);
    const needsSub =
      tool?.access === "paid" &&
      REQUIRE_SUBSCRIPTION &&
      hasActiveSubscription === false;
    return needsSub ? "/subscription" : `/sohoj-tools/${getSlug(name)}`;
  };

  return (
    <section className="relative isolate w-full overflow-hidden bg-white pb-16 pt-14 sm:pb-24 sm:pt-20">
      {/* ================= BACKGROUND (grid + glow) ================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:64px_64px] [-webkit-mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_35%,transparent_100%)] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_35%,transparent_100%)]" />
        <div className="absolute left-1/2 top-[-14rem] h-[34rem] w-[70rem] max-w-none -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/25 via-indigo-500/20 to-violet-500/25 blur-3xl" />
      </div>

      {/* ================= HEADING ================= */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto flex max-w-[1400px] flex-col items-center px-4 text-center sm:px-6 md:px-12"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm sm:text-[13px]">
          <Zap size={14} className="fill-blue-600 text-blue-600" />
          <T>{"Trusted by 35,000+ users"}</T>
        </div>

        <h1 className="mt-6 max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[64px]">
          <span>
            <T>{"Everyday digital work,"}</T>
          </span>{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            <T>{"done in seconds"}</T>
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-slate-600 sm:text-lg">
          <T>
            {
              "From photo editing and NID tools to PDFs and forms — 30+ smart tools, one simple place."
            }
          </T>
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/dashboard"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 sm:w-auto"
          >
            <T>{"Start for Free"}</T>
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            href="/login?redirect=/sohoj-tools"
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <T>{"View all tools"}</T>
          </Link>
        </div>
      </motion.div>

      {/* ================= BANNER (framed, true aspect ratio, clickable tools) ================= */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        className="relative mx-auto mt-12 w-full max-w-[1240px] px-4 sm:mt-16 sm:px-6"
      >
        {/* glow behind the frame */}
        <div
          aria-hidden
          className="absolute inset-x-8 bottom-[-2.5rem] top-12 -z-10 rounded-[40px] bg-gradient-to-r from-blue-500/25 via-indigo-500/20 to-violet-500/25 blur-3xl"
        />

        <div className="rounded-2xl bg-gradient-to-b from-slate-200/90 to-slate-100/70 p-1.5 shadow-[0_30px_80px_-24px_rgba(30,41,99,0.40)] ring-1 ring-slate-900/10 sm:rounded-3xl sm:p-2">
          {/* aspect ratio = image ratio → hotspots (in %) always sit exactly on the tools */}
          <div className="relative aspect-[1672/941] w-full overflow-hidden rounded-xl bg-slate-900 sm:rounded-2xl">
            <Image
              src="/banner/banner1.png"
              alt={t("Sohoj Hub - Your Creative Toolbox")}
              fill
              priority
              quality={90}
              sizes="(min-width: 1280px) 1240px, 100vw"
              className="select-none object-fill"
              draggable={false}
            />

            {/* inner border + brand accent line */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/15" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600" />

            {/* ক্লিকযোগ্য টুল এরিয়া (ছবির মনিটরের টুলগুলোর উপরে) */}
            {BANNER_HOTSPOTS.map((spot) => (
              <Link
                key={spot.name}
                href={hrefFor(spot.name)}
                prefetch
                aria-label={t(spot.name)}
                title={t(spot.name)}
                className="absolute z-10 cursor-pointer rounded-md outline-none transition duration-200 hover:bg-white/20 hover:shadow-lg hover:ring-2 hover:ring-white/80 focus-visible:ring-2 focus-visible:ring-white"
                style={{
                  left: `${spot.left}%`,
                  top: `${spot.top}%`,
                  width: `${spot.width}%`,
                  height: `${spot.height}%`,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
