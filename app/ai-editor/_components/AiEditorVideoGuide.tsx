"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { AiT, useAiEditorText } from "./aiEditorI18n";

// Video tutorial for the AI Editor: https://youtu.be/y2u-K0jEdLM
const VIDEO_ID = "y2u-K0jEdLM";
const EMBED_SRC = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
const THUMB_MAX = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
// hqdefault is 4:3 with black bars; object-cover inside a 16:9 box crops those bars away.
const THUMB_HQ = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`;

/** Popup player. The iframe only exists while open, so closing it also stops the video. */
function VideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useAiEditorText();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className="ai-editor-font fixed inset-0 z-[1100] flex items-center justify-center bg-stone-950/70 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={t("Video tutorial")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl border border-white/15 bg-stone-950 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              <AiT>{"How to use the AI Editor"}</AiT>
            </p>
            <p className="text-[11px] text-stone-400">
              <AiT>{"Video tutorial"}</AiT>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close video")}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          <iframe
            src={EMBED_SRC}
            title={t("How to use the AI Editor")}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Compact "Video tutorial" pill for the Generation-settings header (always visible). */
export default function AiEditorVideoGuide() {
  const { t } = useAiEditorText();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("Watch the AI Editor video tutorial")}
        aria-label={t("Watch the AI Editor video tutorial")}
        className="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#DC2626]/30 bg-white py-1 pl-1 pr-3 text-[13px] font-bold text-[#B91C1C] shadow-sm transition hover:border-[#DC2626]/60 hover:bg-[#FEF2F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span aria-hidden className="absolute inset-0 rounded-full bg-[#DC2626]/40 motion-safe:animate-ping [animation-duration:2.4s]" />
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-[#DC2626] text-white">
            <Play size={11} className="ml-px fill-current" />
          </span>
        </span>
        <span className="whitespace-nowrap">
          <AiT>{"Video tutorial"}</AiT>
        </span>
      </button>
      <VideoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * Large video card with the real YouTube thumbnail, so visitors recognise it as a video at a
 * glance. Shown inside the empty upload box. It is hidden on short screens, where the header
 * pill above remains available.
 */
export function AiEditorVideoCard() {
  const { t } = useAiEditorText();
  const [open, setOpen] = useState(false);
  const [thumb, setThumb] = useState(THUMB_MAX);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("Watch the AI Editor video tutorial")}
        className="group relative mt-4 block w-[88%] max-w-[380px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-[#E3D6B8] bg-stone-900 text-left shadow-[0_18px_36px_-18px_rgba(59,47,30,0.65)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-16px_rgba(185,28,28,0.5)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#DC2626]/50 [@media(max-height:820px)]:hidden"
      >
        <div className="relative aspect-video w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            draggable={false}
            loading="lazy"
            onLoad={(e) => {
              // YouTube answers a missing maxres thumbnail with a tiny grey placeholder.
              if (thumb === THUMB_MAX && e.currentTarget.naturalWidth < 400) setThumb(THUMB_HQ);
            }}
            onError={() => thumb === THUMB_MAX && setThumb(THUMB_HQ)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-stone-950/30" />

          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2.5 py-1 text-[11px] font-bold text-white shadow">
            <Play size={10} className="fill-current" />
            <AiT>{"Video tutorial"}</AiT>
          </span>

          <span className="absolute inset-0 flex items-center justify-center">
            <span className="relative flex h-14 w-14 items-center justify-center">
              <span aria-hidden className="absolute inset-0 rounded-full bg-white/60 motion-safe:animate-ping [animation-duration:2.2s]" />
              <span className="relative flex h-full w-full items-center justify-center rounded-full bg-white text-[#DC2626] shadow-2xl ring-4 ring-white/40 transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                <Play size={24} className="ml-1 fill-current" />
              </span>
            </span>
          </span>

          <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-6">
            <p className="text-[13px] font-bold leading-snug text-white drop-shadow">
              <AiT>{"Learn how to use the AI Editor"}</AiT>
            </p>
            <p className="mt-0.5 text-[11px] text-white/80">
              <AiT>{"Tap to watch the tutorial"}</AiT>
            </p>
          </div>
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
            <span className="block h-full w-[18%] bg-red-500" />
          </span>
        </div>
      </button>
      <VideoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
