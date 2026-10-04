"use client";

const SCAN_STYLES = `
@keyframes pp-scan-sweep {
  0%,
  1% {
    transform: translate3d(0, -120%, 0);
  }

  82% {
    transform: translate3d(0, 420%, 0);
  }

  82.01%,
  100% {
    transform: translate3d(0, -120%, 0);
  }
}

@keyframes pp-scan-grid {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.42;
  }
}

.pp-scan-beam {
  animation: pp-scan-sweep 1.9s linear infinite;
  will-change: transform;
  transform: translate3d(0, -120%, 0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.pp-scan-grid {
  animation: pp-scan-grid 3s ease-in-out infinite;
  will-change: opacity;
}

.pp-scan-overlay.is-inactive .pp-scan-beam {
  animation: none !important;
  transform: translate3d(0, -120%, 0) !important;
}

.pp-scan-overlay.is-inactive .pp-scan-grid {
  animation: none !important;
  opacity: 0 !important;
}

@media (prefers-reduced-motion: reduce) {
  .pp-scan-beam {
    animation-duration: 3.8s;
  }

  .pp-scan-grid {
    animation-duration: 5s;
  }
}
`;

export function ScanOverlay({ active = true }: { active?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pp-scan-overlay pointer-events-none absolute inset-0 z-[5] overflow-hidden${
        active ? "" : " is-inactive"
      }`}
    >
      <style dangerouslySetInnerHTML={{ __html: SCAN_STYLES }} />

      <div
        className="pp-scan-grid absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className="pp-scan-beam absolute left-0 right-0 top-0"
        style={{ height: "22%" }}
      >
        <div
          className="absolute inset-x-[8%] top-1/2 h-[18px] -translate-y-1/2 rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(37,99,235,0) 0%, rgba(37,99,235,0.10) 32%, rgba(16,185,129,0.18) 50%, rgba(37,99,235,0.10) 68%, rgba(37,99,235,0) 100%)",
            boxShadow:
              "0 0 24px 8px rgba(37,99,235,0.12), 0 0 28px 6px rgba(16,185,129,0.10)",
          }}
        />

        <div
          className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.75) 18%, #10B981 50%, rgba(37,99,235,0.75) 82%, transparent 100%)",
            boxShadow:
              "0 0 10px 2px rgba(37,99,235,0.34), 0 0 16px 3px rgba(16,185,129,0.18)",
          }}
        />

        <div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 18%, rgba(255,255,255,0.9) 50%, transparent 82%)",
          }}
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 28px rgba(37,99,235,0.16)",
        }}
      />
    </div>
  );
}
