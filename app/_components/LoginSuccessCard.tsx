import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

type LoginSuccessCardProps = {
  title: ReactNode;
  subtitle: ReactNode;
  /** Fills the progress bar when true (flip it just after mount so the bar animates). */
  go: boolean;
  /** Bar fill duration in ms. */
  durationMs?: number;
  onClose?: () => void;
  closeLabel?: string;
  /** Optional small line under the bar (e.g. "Taking you to your dashboard..."). */
  footer?: ReactNode;
  titleId?: string;
};

/**
 * The one "Login Successful" card used everywhere (root overlay, dashboard, /login-success).
 * Colors come from the site's own palette: dark espresso brown (hero banner), warm gold
 * (name highlight), cream (page background) and the brand red.
 */
export default function LoginSuccessCard({
  title,
  subtitle,
  go,
  durationMs = 1500,
  onClose,
  closeLabel = "Close",
  footer,
  titleId = "login-success-title",
}: LoginSuccessCardProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="relative w-full max-w-[22rem] overflow-hidden rounded-3xl border border-[#F2B93B]/30 bg-gradient-to-b from-[#3B2F1E] to-[#2A2118] px-7 pb-7 pt-9 text-center shadow-[0_30px_80px_-20px_rgba(42,33,24,0.75),0_0_0_1px_rgba(255,255,255,0.04)_inset] animate-in zoom-in-95 fade-in duration-300"
    >
      {/* soft gold glow behind the badge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#F2B93B]/25 blur-3xl"
      />
      {/* thin gold line on top edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F2B93B] to-transparent"
      />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-10 cursor-pointer rounded-full p-1.5 text-[#E9DDC3]/60 transition-colors hover:bg-white/10 hover:text-[#F2B93B]"
          aria-label={closeLabel}
          title={closeLabel}
        >
          <X size={16} />
        </button>
      )}

      <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-[#F2B93B]/40 animate-ping [animation-duration:2.2s]"
        />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#F7CD6B] to-[#E0A12A] text-[#3B2F1E] shadow-[0_8px_24px_-6px_rgba(242,185,59,0.7)]">
          <Check
            size={30}
            strokeWidth={3}
            className="animate-in zoom-in-50 duration-500"
          />
        </span>
      </div>

      <h2
        id={titleId}
        className="text-[1.35rem] font-extrabold tracking-tight text-[#FBF6E8]"
      >
        {title}
      </h2>
      <p className="mt-1.5 text-[0.95rem] font-medium text-[#E9DDC3]/80 [&_strong]:font-bold [&_strong]:text-[#F2B93B]">
        {subtitle}
      </p>

      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F2B93B] via-[#EF8A3A] to-[#DC2626] transition-[width] ease-out"
          style={{
            width: go ? "100%" : "0%",
            transitionDuration: `${durationMs}ms`,
          }}
        />
      </div>

      {footer && (
        <div className="mt-3.5 flex items-center justify-center gap-2 text-[11px] font-semibold tracking-wide text-[#E9DDC3]/55">
          {footer}
        </div>
      )}
    </div>
  );
}
