"use client";
/*
 * Shared "AI gate" generating animation.
 * Copied 1:1 from the AI Editor preview (ai-editor/_components/PhotoPreviewArea.tsx)
 * so Bulk Photo Edit and AI Template can show the exact same animation.
 * Put it inside a `relative` box that has the photo's size; it covers that box.
 */
import React, { useEffect, useRef, useState } from "react";

const TRANSPARENT_BACKGROUND_STYLE: React.CSSProperties = {
    backgroundImage: "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    backgroundColor: "#ffffff",
};

const GATE_OPEN_MS = 1350;
const GATE_CLOSE_MS = 850;
const GATE_REVEAL_MS = 1600;
const GATE_REVEAL_DELAY_MS = 150;
const DEFAULT_GATE_STAGES = [
    "Measuring your photo",
    "Detecting face and landmarks",
    "Aligning to the selected size",
    "Preparing the background",
    "Fitting the clothing",
    "Refining the details",
];
const GATE_SHAFT_RINGS = [100, 80, 63, 49, 38, 29, 21, 15];
const GATE_STYLES = `
@keyframes pp-gate-fall {
  0%   { transform: perspective(900px) translateY(0) scale(1) rotateX(0deg) rotateZ(0deg); opacity: 1; }
  30%  { transform: perspective(900px) translateY(3%) scale(0.84) rotateX(12deg) rotateZ(-1.5deg); opacity: 0.82; }
  70%  { transform: perspective(900px) translateY(8%) scale(0.36) rotateX(30deg) rotateZ(4deg); opacity: 0.35; }
  100% { transform: perspective(900px) translateY(10%) scale(0.07) rotateX(42deg) rotateZ(7deg); opacity: 0.04; }
}
@keyframes pp-gate-fall-dl {
  0%   { transform: perspective(900px) translateX(0) translateY(0) scale(1) rotateX(0deg) rotateZ(0deg); opacity: 1; }
  26%  { transform: perspective(900px) translateX(50%) translateY(0) scale(0.9) rotateX(4deg) rotateZ(0deg); opacity: 0.92; }
  50%  { transform: perspective(900px) translateX(50%) translateY(3%) scale(0.74) rotateX(14deg) rotateZ(-1.5deg); opacity: 0.75; }
  78%  { transform: perspective(900px) translateX(50%) translateY(8%) scale(0.3) rotateX(30deg) rotateZ(-4deg); opacity: 0.3; }
  100% { transform: perspective(900px) translateX(50%) translateY(10%) scale(0.07) rotateX(42deg) rotateZ(-7deg); opacity: 0.04; }
}
@keyframes pp-gate-fall-dr {
  0%   { transform: perspective(900px) translateX(0) translateY(0) scale(1) rotateX(0deg) rotateZ(0deg); opacity: 1; }
  26%  { transform: perspective(900px) translateX(-50%) translateY(0) scale(0.9) rotateX(4deg) rotateZ(0deg); opacity: 0.92; }
  50%  { transform: perspective(900px) translateX(-50%) translateY(3%) scale(0.74) rotateX(14deg) rotateZ(1.5deg); opacity: 0.75; }
  78%  { transform: perspective(900px) translateX(-50%) translateY(8%) scale(0.3) rotateX(30deg) rotateZ(4deg); opacity: 0.3; }
  100% { transform: perspective(900px) translateX(-50%) translateY(10%) scale(0.07) rotateX(42deg) rotateZ(7deg); opacity: 0.04; }
}
@keyframes pp-gate-rise {
  0%   { transform: perspective(900px) translateY(10%) scale(0.07) rotateX(42deg) rotateZ(-5deg); opacity: 0.04; }
  60%  { transform: perspective(900px) translateY(2%) scale(0.72) rotateX(10deg) rotateZ(1deg); opacity: 0.7; }
  85%  { transform: perspective(900px) translateY(-0.6%) scale(1.025) rotateX(0deg) rotateZ(0deg); opacity: 1.05; }
  100% { transform: perspective(900px) translateY(0) scale(1) rotateX(0deg) rotateZ(0deg); opacity: 1; }
}
@keyframes pp-gate-l-close { 0% { transform: translateX(-90%); } 88% { transform: translateX(0.6%); } 100% { transform: translateX(0); } }
@keyframes pp-gate-r-close { 0% { transform: translateX(90%); } 88% { transform: translateX(-0.6%); } 100% { transform: translateX(0); } }
@keyframes pp-gate-l-open { from { transform: translateX(0); } to { transform: translateX(-101%); } }
@keyframes pp-gate-r-open { from { transform: translateX(0); } to { transform: translateX(101%); } }
@keyframes pp-gate-flash { 0% { opacity: 0; } 30% { opacity: 0.9; } 100% { opacity: 0; } }
@keyframes pp-gate-fade-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes pp-gate-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes pp-gate-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes pp-gate-spin { to { transform: rotate(360deg); } }
@keyframes pp-gate-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
@keyframes pp-gate-led { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
@keyframes pp-gate-bracket { 0%, 100% { transform: scale(0.9); opacity: 0.6; } 50% { transform: scale(1.06); opacity: 1; } }
@keyframes pp-gate-sheen { 0% { transform: translateX(-130%); } 100% { transform: translateX(260%); } }
@keyframes pp-gate-line { 0% { opacity: 0; transform: translateY(4px); } 15%, 100% { opacity: 1; transform: none; } }
@keyframes pp-gate-dust { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 0.7; } 100% { transform: translateY(-150px); opacity: 0; } }
.pp-gate-list { display: none; }
.pp-gate-line { display: block; }
@container (min-width: 230px) and (min-height: 340px) {
  .pp-gate-list { display: flex; }
  .pp-gate-line { display: none; }
}
@keyframes pp-gate-ripple { 0% { transform: scale(0.35); opacity: 0.55; } 100% { transform: scale(1.25); opacity: 0; } }
@keyframes pp-gate-beam { 0% { transform: translateY(-120%); } 100% { transform: translateY(1300%); } }
`;
type GatePhase = "idle" | "opening" | "closing" | "waiting" | "revealing";
function useGateSequence(active: boolean): GatePhase {
    const [phase, setPhaseState] = useState<GatePhase>("idle");
    const phaseRef = useRef<GatePhase>("idle");
    const activeRef = useRef(active);
    const timers = useRef<number[]>([]);
    const setPhase = (next: GatePhase) => {
        phaseRef.current = next;
        setPhaseState(next);
    };
    const clearTimers = () => {
        timers.current.forEach((id: number) => window.clearTimeout(id));
        timers.current = [];
    };
    const later = (fn: () => void, ms: number) => {
        timers.current.push(window.setTimeout(fn, ms));
    };
    const startReveal = () => {
        setPhase("revealing");
        later(() => setPhase("idle"), GATE_REVEAL_MS);
    };
    useEffect(() => {
        activeRef.current = active;
        if (active) {
            // Generation started: doors open, photo falls, doors seal, then wait.
            clearTimers();
            setPhase("opening");
            later(() => setPhase("closing"), GATE_OPEN_MS);
            later(() => {
                setPhase("waiting");
                // Generation already finished while the doors were closing.
                if (!activeRef.current)
                    later(startReveal, GATE_REVEAL_DELAY_MS);
            }, GATE_OPEN_MS + GATE_CLOSE_MS);
        }
        else if (phaseRef.current === "waiting") {
            // Generation finished while waiting: open the doors again.
            later(startReveal, GATE_REVEAL_DELAY_MS);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);
    useEffect(() => clearTimers, []);
    return phase;
}
export function GateOverlay({ active, image, background, splitImages = null, t, stages = DEFAULT_GATE_STAGES, }: {
    active: boolean;
    image: string | null;
    background: string;
    /** Dual mode: both photos fall into the ONE gate together (left photo + right photo). */
    splitImages?: [string | null, string | null] | null;
    /** Page translator (each page has its own i18n hook). */
    t: (value: string) => string;
    /** Progress step names shown in the checklist (translated through t). */
    stages?: string[];
}) {
    const phase = useGateSequence(active);
    const [stage, setStage] = useState(0);
    const [pct, setPct] = useState(0);
    // While idle, always remember the photo that is currently on screen, so the
    // fall uses the old photo even if the prop changes later.
    const frozenImage = useRef<string | null>(image);
    if (phase === "idle")
        frozenImage.current = image;
    useEffect(() => {
        if (phase === "opening") {
            setStage(0);
            setPct(0);
        }
        if (phase !== "closing" && phase !== "waiting")
            return;
        const stageTimer = window.setInterval(() => setStage((i: number) => Math.min(i + 1, stages.length - 1)), 2400);
        const pctTimer = window.setInterval(() => setPct((p: number) => p + (96 - p) * 0.022), 150);
        return () => {
            window.clearInterval(stageTimer);
            window.clearInterval(pctTimer);
        };
    }, [phase]);
    if (phase === "idle")
        return null;
    const dualFall = phase === "opening" && !!splitImages && !!(splitImages[0] || splitImages[1]);
    const cloneSrc = phase === "opening" ? frozenImage.current : phase === "revealing" ? image : null;
    const doorTransform = (side: "l" | "r") => phase === "opening" ? `translateX(${side === "l" ? "-90%" : "90%"})` : "translateX(0)";
    const doorAnimation = (side: "l" | "r") => phase === "closing"
        ? `pp-gate-${side}-close ${GATE_CLOSE_MS - 50}ms cubic-bezier(0.7, 0, 0.2, 1) forwards`
        : phase === "revealing"
            ? `pp-gate-${side}-open 850ms cubic-bezier(0.65, 0, 0.35, 1) forwards`
            : undefined;
    const doorStyle = (side: "l" | "r"): React.CSSProperties => ({
        transform: doorTransform(side),
        animation: doorAnimation(side),
        background: `linear-gradient(${side === "l" ? "90deg" : "270deg"}, rgba(255,255,255,0.45), transparent 5%, transparent 92%, rgba(59,47,30,0.18)), repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 1px, rgba(59,47,30,0.03) 1px 3px), linear-gradient(180deg, #F8F1DF 0%, #EADFC4 52%, #DACBA4 100%)`,
        boxShadow: side === "l"
            ? "inset -1px 0 0 rgba(255,255,255,0.7), 10px 0 28px rgba(59,47,30,0.28)"
            : "inset 1px 0 0 rgba(255,255,255,0.7), -10px 0 28px rgba(59,47,30,0.28)",
    });
    const showHud = phase === "closing" || phase === "waiting" || phase === "revealing";
    const hudAnimation = phase === "closing"
        ? "pp-gate-fade-in 500ms ease-out 600ms both"
        : phase === "revealing"
            ? "pp-gate-fade-out 350ms ease-out forwards"
            : undefined;
    const bolt = (pos: React.CSSProperties) => (<span className="absolute h-[7px] w-[7px] rounded-full" style={{
            background: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #CDBB92 55%, #8A7650 100%)",
            boxShadow: "0 1px 1px rgba(59,47,30,0.35), inset 0 0 0 0.5px rgba(255,255,255,0.5)",
            ...pos,
        }}/>);
    const doorDetails = (side: "l" | "r") => {
        const inner = side === "l" ? "right" : "left";
        return (<>
        {/* recessed panel */}
        <div className="absolute inset-[7%] rounded-[3px]" style={{
                border: "1px solid rgba(122,106,80,0.22)",
                boxShadow: "inset 0 2px 8px rgba(59,47,30,0.16), 0 1px 0 rgba(255,255,255,0.7)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(122,106,80,0.08))",
            }}/>
        {/* horizontal groove */}
        <div className="absolute inset-x-[7%] top-1/2 h-px bg-[#8A7650]/35" style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.7)" }}/>
        {/* bolts */}
        {bolt({ top: "3%", [side === "l" ? "left" : "right"]: "10%" })}
        {bolt({ top: "3%", [inner]: "10%" })}
        {bolt({ bottom: "3%", [side === "l" ? "left" : "right"]: "10%" })}
        {bolt({ bottom: "3%", [inner]: "10%" })}
        {/* LED strip on the meeting edge */}
        <div className="pp-gate-loop absolute inset-y-[6%] w-[2px] rounded-full" style={{
                [inner]: 0,
                background: "linear-gradient(180deg, transparent, #F87171 15%, #DC2626 85%, transparent)",
                boxShadow: "0 0 8px 1px rgba(220,38,38,0.45)",
                animation: phase === "waiting" ? "pp-gate-led 2s ease-in-out infinite" : undefined,
                opacity: phase === "opening" ? 0.5 : 0.9,
            }}/>
        {phase === "waiting" && (<div className="pp-gate-loop absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{ animation: "pp-gate-sheen 4s ease-in-out infinite" }}/>)}
      </>);
    };
    const bracketCorners: React.CSSProperties[] = [
        { top: 0, left: 0, borderTop: "1.5px solid", borderLeft: "1.5px solid" },
        { top: 0, right: 0, borderTop: "1.5px solid", borderRight: "1.5px solid" },
        { bottom: 0, left: 0, borderBottom: "1.5px solid", borderLeft: "1.5px solid" },
        { bottom: 0, right: 0, borderBottom: "1.5px solid", borderRight: "1.5px solid" },
    ];
    return (<div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden" style={{ containerType: "size" } as React.CSSProperties}>
      <style>{GATE_STYLES}</style>

      {/* The shaft behind the doors: receding frames give real depth */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #E6D9BA 0%, #F3EAD3 100%)" }}>
        {GATE_SHAFT_RINGS.map((size, i) => (<div key={size} className="absolute rounded-[4px]" style={{
                width: `${size}%`,
                height: `${size}%`,
                left: `${(100 - size) / 2}%`,
                top: `${(100 - size) / 2 + 6 * (1 - size / 100)}%`,
                border: `1px solid rgba(122,106,80,${0.34 - i * 0.03})`,
                background: `rgba(227,214,184,${0.15 + i * 0.05})`,
                boxShadow: "inset 0 0 18px rgba(122,106,80,0.22)",
            }}/>))}
        <div className="pp-gate-loop absolute rounded-full" style={{
            left: "38%",
            top: "42%",
            width: "24%",
            height: "24%",
            background: "radial-gradient(circle, rgba(220,38,38,0.28), rgba(220,38,38,0.08) 50%, transparent 72%)",
            animation: "pp-gate-pulse 3s ease-in-out infinite",
        }}/>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(122,106,80,0.38) 100%)" }}/>
      </div>

      {/* Photo falling into the shaft / rising out of it */}
      {dualFall && splitImages && (<>
          {[0, 1].map((index) => (<div key={index} className={`absolute inset-y-0 w-1/2 ${index === 0 ? "left-0" : "right-0"}`} style={{
                    ...getBackgroundStyle(background),
                    transformOrigin: "50% 55%",
                    boxShadow: "0 10px 40px rgba(59,47,30,0.35)",
                    animation: `pp-gate-fall-d${index === 0 ? "l" : "r"} 1250ms cubic-bezier(0.55, 0.05, 0.85, 0.45) 200ms both`,
                }}>
              {splitImages[index] && (<img src={splitImages[index] as string} alt="" className="h-full w-full object-contain" style={{ objectFit: "contain", maxHeight: "none" }}/>)}
            </div>))}
        </>)}
      {cloneSrc && !dualFall && (<div className="absolute inset-0" style={{
                ...getBackgroundStyle(background),
                transformOrigin: "50% 55%",
                boxShadow: "0 10px 40px rgba(59,47,30,0.35)",
                animation: phase === "opening"
                    ? `pp-gate-fall 1100ms cubic-bezier(0.55, 0.05, 0.85, 0.45) 200ms both`
                    : "pp-gate-rise 1050ms cubic-bezier(0.2, 0.7, 0.25, 1) 380ms both",
            }}>
          <img src={cloneSrc} alt="" className="h-full w-full object-contain" style={{ objectFit: "contain", maxHeight: "none" }}/>
        </div>)}

      {/* Doors */}
      <div className="absolute inset-y-0 left-0 w-1/2" style={doorStyle("l")}>{doorDetails("l")}</div>
      <div className="absolute inset-y-0 right-0 w-1/2" style={doorStyle("r")}>{doorDetails("r")}</div>

      {/* Impact flash when the doors seal */}
      {phase === "closing" && (<div className="absolute inset-y-0 left-1/2 w-24 -translate-x-1/2" style={{
                background: "radial-gradient(ellipse at center, rgba(220,38,38,0.35), transparent 70%)",
                animation: `pp-gate-flash 600ms ease-out ${GATE_CLOSE_MS - 150}ms both`,
            }}/>)}

      {/* Slow scanning beam and rising dust while the doors are sealed */}
      {(phase === "closing" || phase === "waiting") && (<div className="absolute inset-0 overflow-hidden">
          <div className="pp-gate-loop absolute inset-x-[6%] top-0 h-[6%]" style={{
                background: "linear-gradient(180deg, transparent, rgba(220,38,38,0.14), transparent)",
                animation: "pp-gate-beam 5.5s ease-in-out infinite",
            }}/>
          {[12, 27, 42, 58, 73, 88].map((left, i) => (<span key={left} className="pp-gate-loop absolute bottom-10 h-[3px] w-[3px] rounded-full bg-[#DC2626]/50" style={{
                    left: `${left}%`,
                    animation: `pp-gate-dust ${3.4 + (i % 3) * 0.7}s ease-out ${i * 0.55}s infinite`,
                }}/>))}
        </div>)}

      {/* Processing HUD */}
      {showHud && (<div className="absolute inset-0 flex flex-col items-center justify-between px-3 pb-3 pt-3" style={{ animation: hudAnimation }}>
          {/* Title */}
          <div className="flex max-w-full items-center gap-1.5 rounded-full border border-[#E3D6B8] bg-[#FBF6E8]/95 px-3.5 py-1.5 shadow-md backdrop-blur-sm">
            <span className="pp-gate-loop h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]" style={{ animation: "pp-gate-pulse 1.4s ease-in-out infinite", boxShadow: "0 0 6px #DC2626" }}/>
            <span className="pp-gate-loop text-center text-[12px] font-semibold leading-tight sm:text-[13px]" style={{
                backgroundImage: "linear-gradient(90deg, #5A4A32, #3B2F1E, #DC2626, #3B2F1E, #5A4A32)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                animation: "pp-gate-shimmer 3s linear infinite",
            }}>
              {t("Your photo is generating, please wait.")}
            </span>
          </div>

          {/* Rotating instrument + current stage */}
          <div className="flex min-h-0 flex-col items-center gap-2">
            <div className="relative" style={{ width: "min(44cqw, 34cqh, 150px)", aspectRatio: "1" }}>
              {/* tick ring */}
              <div className="pp-gate-loop absolute inset-0 rounded-full" style={{
                background: "repeating-conic-gradient(from 0deg, rgba(122,106,80,0.55) 0 0.8deg, transparent 0.8deg 6deg)",
                WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))",
                animation: "pp-gate-spin 26s linear infinite",
            }}/>
              {/* ripples radiating from the core */}
              {[0, 1.2].map((delay) => (<span key={delay} className="pp-gate-loop absolute inset-[30%] rounded-full" style={{ border: "1px solid rgba(220,38,38,0.4)", animation: `pp-gate-ripple 3s ease-out ${delay}s infinite` }}/>))}
              {/* orbiting dots */}
              <div className="pp-gate-loop absolute inset-[5%]" style={{ animation: "pp-gate-spin 7s linear infinite" }}>
                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#DC2626]" style={{ boxShadow: "0 0 8px 1px rgba(220,38,38,0.6)" }}/>
                <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#8A7650]"/>
              </div>
              {/* dashed counter-rotating ring */}
              <div className="pp-gate-loop absolute inset-[11%] rounded-full" style={{ border: "1px dashed rgba(220,38,38,0.35)", animation: "pp-gate-spin 16s linear infinite reverse" }}/>
              {/* sweeping arc */}
              <div className="pp-gate-loop absolute inset-[19%] rounded-full" style={{
                background: "conic-gradient(from 0deg, rgba(220,38,38,0) 0%, rgba(220,38,38,0.9) 70%, rgba(248,113,113,1) 100%)",
                WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
                animation: "pp-gate-spin 1.5s linear infinite",
            }}/>
              {/* measuring brackets */}
              <div className="pp-gate-loop absolute inset-[34%] text-[#B91C1C]" style={{ animation: "pp-gate-bracket 2.2s ease-in-out infinite" }}>
                {bracketCorners.map((c, i) => (<span key={i} className="absolute h-[28%] w-[28%]" style={c}/>))}
              </div>
              {/* core */}
              <div className="pp-gate-loop absolute inset-[44%] rounded-full" style={{
                background: "radial-gradient(circle, #ffffff, rgba(220,38,38,0.6) 55%, transparent 75%)",
                animation: "pp-gate-pulse 1.6s ease-in-out infinite",
            }}/>
            </div>

            {/* Compact current stage (shown when the frame is small) */}
            <span key={stage} className="pp-gate-line max-w-full px-2 text-center text-[12px] leading-tight text-[#5A4A32]" style={{ animation: "pp-gate-line 500ms ease-out both" }}>
              {t(stages[stage])}...
            </span>
          </div>

          {/* Stage checklist + progress */}
          <div className="flex w-full flex-col items-center gap-2">
            <div className="pp-gate-list w-[86%] max-w-[260px] flex-col gap-1 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8]/95 px-3 py-2 shadow-md backdrop-blur-sm">
              {stages.map((label, i) => {
                const done = i < stage;
                const current = i === stage;
                return (<div key={label} className="flex items-center gap-2 text-[12px] leading-tight" style={{ color: current ? "#3B2F1E" : done ? "#7A6A50" : "#B0A080", fontWeight: current ? 600 : 400 }}>
                    <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                      {done ? (<svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="5" strokeOpacity="0.5"/><path d="M3.6 6.2l1.7 1.7 3.1-3.4"/></svg>) : current ? (<span className="pp-gate-loop block h-3 w-3 rounded-full border-[1.5px] border-[#DC2626]/25 border-t-[#DC2626]" style={{ animation: "pp-gate-spin 0.9s linear infinite" }}/>) : (<span className="block h-1.5 w-1.5 rounded-full bg-[#D8C9A6]"/>)}
                    </span>
                    <span>{t(label)}</span>
                  </div>);
            })}
            </div>

            <div className="flex w-[70%] max-w-[260px] items-center gap-2">
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[#D8C9A6]/60">
                <div className="h-full rounded-full" style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #DC2626, #F87171)",
                transition: "width 150ms linear",
            }}/>
              </div>
              <span className="w-7 text-right text-[11px] tabular-nums text-[#B91C1C]">{Math.round(pct)}%</span>
            </div>
          </div>
        </div>)}
    </div>);
}
function getBackgroundStyle(background: string): React.CSSProperties {
    return background === "transparent"
        ? TRANSPARENT_BACKGROUND_STYLE
        : { backgroundColor: background };
}
