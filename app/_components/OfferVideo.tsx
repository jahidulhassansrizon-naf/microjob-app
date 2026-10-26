"use client";

import { useEffect, useRef } from "react";

type OfferVideoProps = {
  className?: string;
  /** Video URL served from the public directory. */
  src?: string;
  /** Requests automatic playback; browsers may restrict audible autoplay. */
  autoPlay?: boolean;
};

/** Shared subscription-offer video player. */
export default function OfferVideo({
  className = "",
  src = "/offervideo/offerwoman.mp4",
  autoPlay = false,
}: OfferVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    // Restart the offer video whenever this component/page is mounted.
    video.currentTime = 0;
    const attemptPlay = () => {
      const result = video.play();
      if (result && typeof result.catch === "function") result.catch(() => {});
    };
    if (video.readyState >= 2) attemptPlay();
    else video.addEventListener("canplay", attemptPlay, { once: true });
    return () => video.removeEventListener("canplay", attemptPlay);
  }, [src, autoPlay]);

  return (
    <div className={`relative isolate aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.06] ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        autoPlay={autoPlay}
        preload={autoPlay ? "auto" : "metadata"}
        aria-label="Studio Seba subscription offer video"
      >
        Your browser does not support HTML video.
      </video>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
    </div>
  );
}
