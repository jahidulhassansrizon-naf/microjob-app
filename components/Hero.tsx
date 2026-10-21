// components/Hero.tsx
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, RotateCcw, Zap } from "lucide-react";
import { T, useI18n } from "@/components/i18n/I18nProvider";

const VIDEO_SRC = "/intro/sohojhubIntro.mp4";

export default function Hero() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  // `showOverlay` controls the play button on top of the video. It is visible
  // before the first play and again after the video finishes (replay).
  const [showOverlay, setShowOverlay] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    // The click is a user gesture, so playback with sound is allowed.
    if (hasEnded) video.currentTime = 0;
    video.volume = 1;
    video.muted = false;
    setShowOverlay(false);
    setHasEnded(false);

    try {
      await video.play();
    } catch {
      // If audible playback is blocked, fall back to muted playback.
      video.muted = true;
      try {
        await video.play();
      } catch {
        // The browser or media file could not start playback; show the button again.
        setShowOverlay(true);
      }
    }
  };

  return (
    <section className="relative isolate w-full overflow-hidden bg-white py-10 sm:py-14 lg:py-16">
      {/* ================= BACKGROUND (grid + glow) ================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:64px_64px] [-webkit-mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_35%,transparent_100%)] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_35%,transparent_100%)]" />
        <div className="absolute left-1/2 top-[-14rem] h-[34rem] w-[70rem] max-w-none -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/25 via-indigo-500/20 to-violet-500/25 blur-3xl" />
      </div>

      {/* ================= HERO: VIDEO LEFT, CONTENT RIGHT ================= */}
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-8 px-4 sm:px-6 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 xl:gap-16">
        {/* The video src uses "#t=0.1" so browsers (incl. iOS Safari) show a first frame as the thumbnail. */}
        {/* The video is first in the DOM so it appears above the copy on mobile. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative order-1 w-full min-w-0"
        >
          <div
            aria-hidden
            className="absolute inset-x-5 bottom-[-1.5rem] top-8 -z-10 rounded-[32px] bg-gradient-to-r from-blue-500/25 via-indigo-500/20 to-violet-500/25 blur-3xl sm:inset-x-8 sm:bottom-[-2rem]"
          />

          <div className="rounded-2xl bg-gradient-to-b from-slate-200/90 to-slate-100/70 p-1.5 shadow-[0_30px_80px_-24px_rgba(30,41,99,0.40)] ring-1 ring-slate-900/10 sm:rounded-3xl sm:p-2">
            <div className="relative aspect-[1672/941] w-full overflow-hidden rounded-xl bg-slate-900 sm:rounded-2xl">
              <video
                ref={videoRef}
                src={`${VIDEO_SRC}#t=0.1`}
                aria-label={t("Sohoj Hub - Your Creative Toolbox")}
                playsInline
                loop={false}
                controls={!showOverlay}
                preload="metadata"
                className="absolute inset-0 h-full w-full select-none object-cover"
                disablePictureInPicture
                controlsList="nodownload noplaybackrate noremoteplayback"
                onEnded={() => {
                  setHasEnded(true);
                  setShowOverlay(true);
                }}
                onContextMenu={(event) => event.preventDefault()}
              />

              {/* Play overlay: makes it obvious that this is a video. */}
              <button
                type="button"
                onClick={handlePlay}
                aria-label={t(hasEnded ? "Replay video" : "Watch video")}
                tabIndex={showOverlay ? 0 : -1}
                className={`group absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-3 bg-gradient-to-t from-slate-900/55 via-slate-900/20 to-slate-900/30 transition-opacity duration-300 focus-visible:outline-none ${
                  showOverlay ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <span className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-ping rounded-full bg-white/50 [animation-duration:2s]"
                  />
                  <span className="relative flex h-full w-full items-center justify-center rounded-full bg-white/95 text-indigo-600 shadow-2xl shadow-indigo-900/40 ring-4 ring-white/40 transition-transform duration-200 group-hover:scale-110 group-focus-visible:ring-indigo-300 group-active:scale-95">
                    {hasEnded ? (
                      <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9" />
                    ) : (
                      <Play className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9 lg:h-10 lg:w-10" />
                    )}
                  </span>
                </span>
                <span className="rounded-full bg-slate-900/60 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm sm:text-sm">
                  {hasEnded ? <T>{"Replay video"}</T> : <T>{"Watch video"}</T>}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Copy is beside the video on desktop and below it on small screens. */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="order-2 flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm sm:text-[13px]">
            <Zap size={14} className="fill-blue-600 text-blue-600" />
            <T>{"Trusted by 35,000+ users"}</T>
          </div>

          <h1 className="mt-5 max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:mt-6 lg:text-[54px] xl:text-[60px]">
            <span>
              <T>{"Everyday digital work,"}</T>
            </span>{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              <T>{"done in seconds"}</T>
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-slate-600 sm:text-lg">
            <T>
              {
                "From photo editing and NID tools to PDFs and forms — 30+ smart tools, one simple place."
              }
            </T>
          </p>

          <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row lg:justify-start">
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
      </div>
    </section>
  );
}
