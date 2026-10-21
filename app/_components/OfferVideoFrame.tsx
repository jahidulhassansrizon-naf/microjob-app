"use client";

import { useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

type OfferVideoFrameProps = {
  src: string;
  className?: string;
  /** Text under the play button (pass a translated string). */
  playLabel?: string;
  /** Text under the replay button shown after the video ends. */
  replayLabel?: string;
  /**
   * Max height of the video as a share of the viewport height, so the video,
   * the payment button and the plan card can all fit on one screen.
   */
  maxHeightDvh?: number;
  /** Smaller frame for popups/modals: no decorative dots, thinner mat. */
  compact?: boolean;
};

export default function OfferVideoFrame({
  src,
  className = "",
  playLabel = "Watch video",
  replayLabel = "Replay video",
  maxHeightDvh = 44,
  compact = false,
}: OfferVideoFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);

  // "#t=0.1" makes browsers (incl. iOS Safari) render a first frame as the thumbnail.
  const videoSrc = src.includes("#") ? src : `${src}#t=0.1`;

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (hasEnded) video.currentTime = 0;
    video.volume = 1;
    video.muted = false; // the click is a user gesture, so sound is allowed
    setShowOverlay(false);
    setHasEnded(false);

    try {
      await video.play();
    } catch {
      video.muted = true;
      try {
        await video.play();
      } catch {
        setShowOverlay(true);
      }
    }
  };

  return (
    <div
      className={`relative isolate mx-auto w-full ${className}`}
      // Keeps the 16:9 frame short enough to leave room for the content below it.
      style={compact ? undefined : { maxWidth: `min(100%, calc(${maxHeightDvh}dvh * 16 / 9))` }}
    >
      {/* Decorative dotted patterns peeking out from behind the frame */}
      {!compact && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-5 -top-5 -z-10 hidden h-24 w-32 opacity-60 [background-image:radial-gradient(circle,#6366f1_1.5px,transparent_1.5px)] [background-size:14px_14px] sm:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-5 -left-5 -z-10 hidden h-24 w-32 opacity-60 [background-image:radial-gradient(circle,#2563eb_1.5px,transparent_1.5px)] [background-size:14px_14px] sm:block"
          />
        </>
      )}
      {/* Soft glow */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -z-10 rounded-[2.2rem] ${compact ? "-inset-1" : "-inset-3"} bg-gradient-to-r from-blue-500/30 via-indigo-500/25 to-violet-500/30 blur-2xl`}
      />

      {/* Gradient border */}
      <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 p-[3px] shadow-[0_28px_70px_-26px_rgba(49,46,129,0.55)] sm:rounded-[1.9rem]">
        {/* White mat */}
        <div className="rounded-[1.35rem] bg-white p-1.5 sm:rounded-[1.7rem] sm:p-2.5">
          {/* Video area */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[1rem] bg-slate-900 ring-1 ring-slate-900/10 sm:rounded-[1.25rem]">
            <video
              ref={videoRef}
              src={videoSrc}
              playsInline
              preload="metadata"
              controls={!showOverlay}
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              onContextMenu={(event) => event.preventDefault()}
              onEnded={() => {
                setHasEnded(true);
                setShowOverlay(true);
              }}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />

            <button
              type="button"
              onClick={handlePlay}
              aria-label={hasEnded ? replayLabel : playLabel}
              tabIndex={showOverlay ? 0 : -1}
              className={`group absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-3 bg-gradient-to-t from-slate-900/55 via-slate-900/15 to-slate-900/25 transition-opacity duration-300 focus-visible:outline-none ${
                showOverlay ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <span className="relative flex h-14 w-14 items-center justify-center sm:h-[72px] sm:w-[72px] lg:h-20 lg:w-20">
                <span
                  aria-hidden
                  className="absolute inset-0 animate-ping rounded-full bg-white/50 [animation-duration:2s]"
                />
                <span className="relative flex h-full w-full items-center justify-center rounded-full bg-white/95 text-indigo-600 shadow-2xl shadow-indigo-900/40 ring-4 ring-white/40 transition-transform duration-200 group-hover:scale-110 group-focus-visible:ring-indigo-300 group-active:scale-95">
                  {hasEnded ? (
                    <RotateCcw className="h-5 w-5 sm:h-7 sm:w-7" />
                  ) : (
                    <Play className="ml-1 h-6 w-6 fill-current sm:h-8 sm:w-8" />
                  )}
                </span>
              </span>
              <span className="rounded-full bg-slate-900/60 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm sm:text-sm">
                {hasEnded ? replayLabel : playLabel}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
