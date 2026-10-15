import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useEffect, useRef, useState } from "react";
import { Upload, X, ArrowLeftRight, ImageIcon, RefreshCw } from "lucide-react";
export interface BoxInfo {
    text: string;
    /** True when no photo size is selected: preview uses the photo's own ratio. */
    isOriginal?: boolean;
    style: {
        width: string;
        height: string;
    };
}
interface PhotoPreviewAreaProps {
    isDualMode: boolean;
    uploadedImage: string | null;
    setUploadedImage: React.Dispatch<React.SetStateAction<string | null>>;
    leftImage: string | null;
    setLeftImage: React.Dispatch<React.SetStateAction<string | null>>;
    rightImage: string | null;
    setRightImage: React.Dispatch<React.SetStateAction<string | null>>;
    triggerUpload: (target: "single" | "left" | "right") => void;
    enableDualMode: () => void;
    exitDualMode: () => void;
    activeBoxInfo: BoxInfo;
    currentBgColorValue: string;
    isGenerating: boolean;
    isDeleting: boolean;
    originalImageForDual: string | null;
    setOriginalImageForDual: React.Dispatch<React.SetStateAction<string | null>>;
    isDualPreviewActive: boolean;
    setIsDualPreviewActive: React.Dispatch<React.SetStateAction<boolean>>;
}
const TRANSPARENT_BACKGROUND_STYLE: React.CSSProperties = {
    backgroundImage: "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    backgroundColor: "#ffffff",
};
/* ------------------------------------------------------------------ */
/* AI GATE ANIMATION (generation only)                                 */
/* Photo sits on a hatch. Two heavy metal doors slide apart, the photo */
/* falls away from the viewer down a shaft, the doors seal shut and a  */
/* processing HUD runs. When generation ends the doors open again and  */
/* the new photo rises out of the shaft.                               */
/* All keyframes use the "pp-gate-" prefix so they never clash.        */
/* ------------------------------------------------------------------ */
const GATE_OPEN_MS = 1350;
const GATE_CLOSE_MS = 850;
const GATE_REVEAL_MS = 1600;
const GATE_REVEAL_DELAY_MS = 150;
const GATE_STAGES = [
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
  0%   { transform: perspective(900px) translateY(0) scale(1) rotateX(0deg) rotateZ(0deg); filter: brightness(1) blur(0); }
  30%  { transform: perspective(900px) translateY(3%) scale(0.84) rotateX(12deg) rotateZ(-1.5deg); filter: brightness(0.82) blur(0); }
  70%  { transform: perspective(900px) translateY(8%) scale(0.36) rotateX(30deg) rotateZ(4deg); filter: brightness(0.35) blur(0.5px); }
  100% { transform: perspective(900px) translateY(10%) scale(0.07) rotateX(42deg) rotateZ(7deg); filter: brightness(0.04) blur(1.5px); }
}
@keyframes pp-gate-rise {
  0%   { transform: perspective(900px) translateY(10%) scale(0.07) rotateX(42deg) rotateZ(-5deg); filter: brightness(0.04) blur(1.5px); }
  60%  { transform: perspective(900px) translateY(2%) scale(0.72) rotateX(10deg) rotateZ(1deg); filter: brightness(0.7) blur(0); }
  85%  { transform: perspective(900px) translateY(-0.6%) scale(1.025) rotateX(0deg) rotateZ(0deg); filter: brightness(1.05) blur(0); }
  100% { transform: perspective(900px) translateY(0) scale(1) rotateX(0deg) rotateZ(0deg); filter: brightness(1) blur(0); }
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
function GateOverlay({ active, image, background }: {
    active: boolean;
    image: string | null;
    background: string;
}) {
    const { t } = useAiEditorText();
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
        const stageTimer = window.setInterval(() => setStage((i: number) => Math.min(i + 1, GATE_STAGES.length - 1)), 2400);
        const pctTimer = window.setInterval(() => setPct((p: number) => p + (96 - p) * 0.022), 150);
        return () => {
            window.clearInterval(stageTimer);
            window.clearInterval(pctTimer);
        };
    }, [phase]);
    if (phase === "idle")
        return null;
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
        background: `linear-gradient(${side === "l" ? "90deg" : "270deg"}, rgba(255,255,255,0.05), transparent 5%, transparent 92%, rgba(0,0,0,0.45)), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, rgba(0,0,0,0.04) 1px 3px), linear-gradient(180deg, #212a3b 0%, #121823 48%, #0a0e16 100%)`,
        boxShadow: side === "l"
            ? "inset -1px 0 0 rgba(255,255,255,0.10), 14px 0 34px rgba(0,0,0,0.7)"
            : "inset 1px 0 0 rgba(255,255,255,0.10), -14px 0 34px rgba(0,0,0,0.7)",
    });
    const showHud = phase === "closing" || phase === "waiting" || phase === "revealing";
    const hudAnimation = phase === "closing"
        ? "pp-gate-fade-in 500ms ease-out 600ms both"
        : phase === "revealing"
            ? "pp-gate-fade-out 350ms ease-out forwards"
            : undefined;
    const bolt = (pos: React.CSSProperties) => (<span className="absolute h-[7px] w-[7px] rounded-full" style={{
            background: "radial-gradient(circle at 35% 30%, #6b7a93 0%, #2a3447 55%, #0b0f17 100%)",
            boxShadow: "0 1px 1px rgba(0,0,0,0.8), inset 0 0 0 0.5px rgba(255,255,255,0.12)",
            ...pos,
        }}/>);
    const doorDetails = (side: "l" | "r") => {
        const inner = side === "l" ? "right" : "left";
        return (<>
        {/* recessed panel */}
        <div className="absolute inset-[7%] rounded-[3px]" style={{
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "inset 0 2px 10px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.018), rgba(0,0,0,0.18))",
            }}/>
        {/* horizontal groove */}
        <div className="absolute inset-x-[7%] top-1/2 h-px bg-black/50" style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.05)" }}/>
        {/* bolts */}
        {bolt({ top: "3%", [side === "l" ? "left" : "right"]: "10%" })}
        {bolt({ top: "3%", [inner]: "10%" })}
        {bolt({ bottom: "3%", [side === "l" ? "left" : "right"]: "10%" })}
        {bolt({ bottom: "3%", [inner]: "10%" })}
        {/* LED strip on the meeting edge */}
        <div className="pp-gate-loop absolute inset-y-[6%] w-[2px] rounded-full" style={{
                [inner]: 0,
                background: "linear-gradient(180deg, transparent, #67e8f9 15%, #38bdf8 85%, transparent)",
                boxShadow: "0 0 8px 1px rgba(56,189,248,0.55)",
                animation: phase === "waiting" ? "pp-gate-led 2s ease-in-out infinite" : undefined,
                opacity: phase === "opening" ? 0.5 : 0.9,
            }}/>
        {phase === "waiting" && (<div className="pp-gate-loop absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" style={{ animation: "pp-gate-sheen 4s ease-in-out infinite" }}/>)}
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
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #05070d 0%, #070b14 100%)" }}>
        {GATE_SHAFT_RINGS.map((size, i) => (<div key={size} className="absolute rounded-[4px]" style={{
                width: `${size}%`,
                height: `${size}%`,
                left: `${(100 - size) / 2}%`,
                top: `${(100 - size) / 2 + 6 * (1 - size / 100)}%`,
                border: `1px solid rgba(148,163,184,${0.16 - i * 0.012})`,
                background: `rgba(2,6,14,${0.18 + i * 0.05})`,
                boxShadow: "inset 0 0 22px rgba(0,0,0,0.6)",
            }}/>))}
        <div className="pp-gate-loop absolute rounded-full" style={{
            left: "38%",
            top: "42%",
            width: "24%",
            height: "24%",
            background: "radial-gradient(circle, rgba(103,232,249,0.55), rgba(37,99,235,0.18) 50%, transparent 72%)",
            animation: "pp-gate-pulse 3s ease-in-out infinite",
        }}/>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)" }}/>
      </div>

      {/* Photo falling into the shaft / rising out of it */}
      {cloneSrc && (<div className="absolute inset-0" style={{
                ...getBackgroundStyle(background),
                transformOrigin: "50% 55%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                animation: phase === "opening"
                    ? `pp-gate-fall 1100ms cubic-bezier(0.55, 0.05, 0.85, 0.45) 200ms both`
                    : "pp-gate-rise 1050ms cubic-bezier(0.2, 0.7, 0.25, 1) 380ms both",
            }}>
          <img src={cloneSrc} alt="" className="h-full w-full object-contain"/>
        </div>)}

      {/* Doors */}
      <div className="absolute inset-y-0 left-0 w-1/2" style={doorStyle("l")}>{doorDetails("l")}</div>
      <div className="absolute inset-y-0 right-0 w-1/2" style={doorStyle("r")}>{doorDetails("r")}</div>

      {/* Impact flash when the doors seal */}
      {phase === "closing" && (<div className="absolute inset-y-0 left-1/2 w-24 -translate-x-1/2" style={{
                background: "radial-gradient(ellipse at center, rgba(125,211,252,0.7), transparent 70%)",
                animation: `pp-gate-flash 600ms ease-out ${GATE_CLOSE_MS - 150}ms both`,
            }}/>)}

      {/* Slow scanning beam and rising dust while the doors are sealed */}
      {(phase === "closing" || phase === "waiting") && (<div className="absolute inset-0 overflow-hidden">
          <div className="pp-gate-loop absolute inset-x-[6%] top-0 h-[6%]" style={{
                background: "linear-gradient(180deg, transparent, rgba(125,211,252,0.10), transparent)",
                animation: "pp-gate-beam 5.5s ease-in-out infinite",
            }}/>
          {[12, 27, 42, 58, 73, 88].map((left, i) => (<span key={left} className="pp-gate-loop absolute bottom-10 h-[3px] w-[3px] rounded-full bg-sky-200/70" style={{
                    left: `${left}%`,
                    animation: `pp-gate-dust ${3.4 + (i % 3) * 0.7}s ease-out ${i * 0.55}s infinite`,
                }}/>))}
        </div>)}

      {/* Processing HUD */}
      {showHud && (<div className="absolute inset-0 flex flex-col items-center justify-between px-3 pb-3 pt-3" style={{ animation: hudAnimation }}>
          {/* Title */}
          <div className="flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 backdrop-blur-sm">
            <span className="pp-gate-loop h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" style={{ animation: "pp-gate-pulse 1.4s ease-in-out infinite", boxShadow: "0 0 6px #67e8f9" }}/>
            <span className="pp-gate-loop text-center text-[10px] font-semibold leading-tight sm:text-[11px]" style={{
                backgroundImage: "linear-gradient(90deg, #94a3b8, #ffffff, #7dd3fc, #ffffff, #94a3b8)",
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
                background: "repeating-conic-gradient(from 0deg, rgba(148,163,184,0.7) 0 0.8deg, transparent 0.8deg 6deg)",
                WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))",
                animation: "pp-gate-spin 26s linear infinite",
            }}/>
              {/* ripples radiating from the core */}
              {[0, 1.2].map((delay) => (<span key={delay} className="pp-gate-loop absolute inset-[30%] rounded-full" style={{ border: "1px solid rgba(125,211,252,0.5)", animation: `pp-gate-ripple 3s ease-out ${delay}s infinite` }}/>))}
              {/* orbiting dots */}
              <div className="pp-gate-loop absolute inset-[5%]" style={{ animation: "pp-gate-spin 7s linear infinite" }}>
                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-200" style={{ boxShadow: "0 0 8px 1px #67e8f9" }}/>
                <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sky-300/80"/>
              </div>
              {/* dashed counter-rotating ring */}
              <div className="pp-gate-loop absolute inset-[11%] rounded-full" style={{ border: "1px dashed rgba(125,211,252,0.4)", animation: "pp-gate-spin 16s linear infinite reverse" }}/>
              {/* sweeping arc */}
              <div className="pp-gate-loop absolute inset-[19%] rounded-full" style={{
                background: "conic-gradient(from 0deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.95) 70%, rgba(186,230,253,1) 100%)",
                WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
                animation: "pp-gate-spin 1.5s linear infinite",
            }}/>
              {/* measuring brackets */}
              <div className="pp-gate-loop absolute inset-[34%] text-cyan-200/90" style={{ animation: "pp-gate-bracket 2.2s ease-in-out infinite" }}>
                {bracketCorners.map((c, i) => (<span key={i} className="absolute h-[28%] w-[28%]" style={c}/>))}
              </div>
              {/* core */}
              <div className="pp-gate-loop absolute inset-[44%] rounded-full" style={{
                background: "radial-gradient(circle, #ffffff, rgba(125,211,252,0.7) 55%, transparent 75%)",
                animation: "pp-gate-pulse 1.6s ease-in-out infinite",
            }}/>
            </div>

            {/* Compact current stage (shown when the frame is small) */}
            <span key={stage} className="pp-gate-line max-w-full px-2 text-center text-[10px] leading-tight text-sky-100/90" style={{ animation: "pp-gate-line 500ms ease-out both" }}>
              {t(GATE_STAGES[stage])}...
            </span>
          </div>

          {/* Stage checklist + progress */}
          <div className="flex w-full flex-col items-center gap-2">
            <div className="pp-gate-list w-[86%] max-w-[260px] flex-col gap-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 backdrop-blur-sm">
              {GATE_STAGES.map((label, i) => {
                const done = i < stage;
                const current = i === stage;
                return (<div key={label} className="flex items-center gap-2 text-[10px] leading-tight" style={{ color: current ? "#f1f5f9" : done ? "#94a3b8" : "#475569" }}>
                    <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                      {done ? (<svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="5" strokeOpacity="0.5"/><path d="M3.6 6.2l1.7 1.7 3.1-3.4"/></svg>) : current ? (<span className="pp-gate-loop block h-3 w-3 rounded-full border-[1.5px] border-sky-300/30 border-t-sky-300" style={{ animation: "pp-gate-spin 0.9s linear infinite" }}/>) : (<span className="block h-1.5 w-1.5 rounded-full bg-slate-600"/>)}
                    </span>
                    <span>{t(label)}</span>
                  </div>);
            })}
            </div>

            <div className="flex w-[70%] max-w-[260px] items-center gap-2">
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #0ea5e9, #67e8f9)",
                transition: "width 150ms linear",
            }}/>
              </div>
              <span className="w-7 text-right text-[9px] tabular-nums text-sky-200/80">{Math.round(pct)}%</span>
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
/* Sizes a photo frame so it never gets taller or wider than the space left
   for it. On xl screens the holder becomes a size container, and the frame
   is capped by both the holder width and the holder height (keeping the
   photo aspect ratio). Below xl the original fixed-width behaviour is kept. */
function useNaturalRatio(src: string | null | undefined, enabled: boolean) {
    const [ratio, setRatio] = useState<number | null>(null);
    useEffect(() => {
        if (!enabled || !src) {
            setRatio(null);
            return;
        }
        let cancelled = false;
        const img = new window.Image();
        img.onload = () => {
            if (!cancelled && img.naturalWidth && img.naturalHeight) {
                setRatio(img.naturalWidth / img.naturalHeight);
            }
        };
        img.src = src;
        return () => {
            cancelled = true;
        };
    }, [src, enabled]);
    return ratio;
}
function FitFrame({ info, imageSrc, className = "", style, children, }: {
    info: BoxInfo;
    imageSrc?: string | null;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
}) {
    const naturalRatio = useNaturalRatio(imageSrc, !!info.isOriginal);
    let w = parseFloat(info.style.width) || 290;
    let h = parseFloat(info.style.height) || 372;
    if (info.isOriginal) {
        // No photo size selected: show the photo at its own ratio, as large as fits.
        const ratio = naturalRatio || 4 / 5;
        const maxW = 620;
        const maxH = 680;
        w = maxW;
        h = w / ratio;
        if (h > maxH) {
            h = maxH;
            w = h * ratio;
        }
    }
    return (<div className="flex min-h-0 w-full flex-1 items-center justify-center xl:[container-type:size]">
      <div className={`relative w-[min(var(--cw),100%)] xl:w-[min(var(--cw),100cqw,calc(100cqh*var(--cr)))] ${className}`} style={{
            "--cw": `${w}px`,
            "--cr": String(w / h),
            aspectRatio: `${w} / ${h}`,
            height: "auto",
            ...style,
        } as React.CSSProperties}>
        {children}
      </div>
    </div>);
}
function EmptyUploadBox({ title, subtitle, onUpload, }: {
    title: string;
    subtitle?: string;
    onUpload: () => void;
}) {
    const { t } = useAiEditorText();
    return (<div className="flex h-full min-h-[250px] flex-col items-center justify-center bg-[#E2E8F0] p-4 text-center xl:min-h-0 xl:p-2">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC] text-[#2563EB]">
        <Upload size={18}/>
      </div>

      <h3 className="mb-1 text-xs font-medium text-[#0F172A]"><AiT>{title}</AiT></h3>

      {subtitle && (<p className="mb-3 text-[10px] leading-tight text-[#0F172A]/70">
          <AiT>{subtitle}</AiT>
        </p>)}

      <button type="button" onClick={onUpload} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-[11px] font-medium text-white shadow-md transition hover:bg-[#2563EB]/90 active:scale-95">
        <Upload size={12}/><AiT>{"Upload Photo\n      "}</AiT></button>
    </div>);
}
function PhotoCard({ image, label, boxInfo, background, onRemove, showBorder = true, isScanning = false, }: {
    image: string | null;
    label: string;
    boxInfo: BoxInfo;
    background: string;
    onRemove: () => void;
    showBorder?: boolean;
    isScanning?: boolean;
}) {
    const { t } = useAiEditorText();
    return (<div className="flex min-w-0 flex-col items-center gap-1.5 xl:min-h-0">
      <span className="max-w-full shrink-0 truncate text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
        <AiT>{label}</AiT>
      </span>

      <FitFrame info={boxInfo} imageSrc={image} className={`overflow-hidden rounded-2xl shadow-xl ${showBorder ? "border-2 border-[#E2E8F0]" : ""}`} style={getBackgroundStyle(background)}>
        {image ? (<div className="group relative h-full w-full">
            <img src={image} alt={t(label)} className="h-full w-full object-contain"/>

            <button type="button" onClick={onRemove} aria-label={t(`Remove ${label}`)} className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-[#0F172A]/80 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100">
              <X size={14}/>
            </button>

            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#0F172A]/70 px-2 py-0.5 text-[9px] text-white backdrop-blur-sm">
              <AiT>{boxInfo.text}</AiT>
            </div>
          </div>) : (<EmptyUploadBox title={`Upload ${label.toLowerCase()}`} onUpload={onRemove}/>)}

        <GateOverlay active={isScanning && !!image} image={image} background={background}/>
      </FitFrame>
    </div>);
}
export default function PhotoPreviewArea({
    isDualMode, uploadedImage, setUploadedImage, leftImage, setLeftImage, rightImage, setRightImage, triggerUpload, enableDualMode, exitDualMode, activeBoxInfo, currentBgColorValue, isGenerating, isDeleting, originalImageForDual, setOriginalImageForDual, isDualPreviewActive, setIsDualPreviewActive,
}: PhotoPreviewAreaProps) {
    const { t } = useAiEditorText();
    const handleRemoveSingle = () => {
        if (originalImageForDual && uploadedImage) {
            setUploadedImage(originalImageForDual);
            setOriginalImageForDual(null);
            setIsDualPreviewActive(false);
            return;
        }
        setUploadedImage(null);
        setOriginalImageForDual(null);
        setIsDualPreviewActive(false);
    };
    return (<div className="relative flex max-h-[85vh] min-h-[540px] flex-1 flex-col items-center justify-center overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 shadow-lg sm:p-6 xl:max-h-none xl:min-h-0 xl:overflow-hidden xl:p-4">
      {/* Deleting keeps the simple overlay. Generating uses the door animation on the photo frame. */}
      {isDeleting && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-[#F8FAFC]/90 p-4 text-center backdrop-blur-md">
          <div className="mb-5 h-16 w-16 animate-spin rounded-full border-4 border-red-500/20 border-t-red-500"/>

          <h3 className="mb-1 text-base font-semibold tracking-wide text-[#0F172A]"><AiT>{"Deleting Photo...\n          "}</AiT></h3>

          <p className="max-w-xs text-xs leading-relaxed text-[#0F172A]/70"><AiT>{"Removing your photo, please wait...\n          "}</AiT></p>

          <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full border border-[#E2E8F0] bg-[#E2E8F0]">
            <div className="h-full w-full animate-pulse rounded-full bg-red-500"/>
          </div>
        </div>)}

      {!isDualMode ? (<div className="flex w-full flex-col items-center justify-center gap-4 xl:min-h-0 xl:flex-1 xl:gap-3">
          {isDualPreviewActive && originalImageForDual ? (<div className="grid w-full max-w-[1000px] grid-cols-1 gap-6 md:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-rows-[minmax(0,1fr)] xl:gap-4">
              <PhotoCard image={originalImageForDual} label="Real Photo" boxInfo={activeBoxInfo} background={currentBgColorValue} onRemove={() => setOriginalImageForDual(null)} isScanning={isGenerating}/>

              <PhotoCard image={uploadedImage} label="Edited Photo" boxInfo={activeBoxInfo} background={currentBgColorValue} onRemove={handleRemoveSingle} isScanning={isGenerating}/>
            </div>) : (<FitFrame info={activeBoxInfo} imageSrc={uploadedImage} className={`overflow-hidden rounded-2xl shadow-xl ${uploadedImage
                    ? "border-2 border-transparent"
                    : "border-2 border-dashed border-[#2563EB]/40"}`}>
              {uploadedImage ? (<div className="group relative h-full w-full" style={getBackgroundStyle(currentBgColorValue)}>
                  <img src={uploadedImage} alt="Uploaded or generated preview" className="h-full w-full object-contain"/>

                  <button type="button" onClick={handleRemoveSingle} className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-[#0F172A]/80 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100" aria-label={t("Remove current photo")}>
                    <X size={14}/>
                  </button>

                  <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#0F172A]/70 px-2 py-0.5 text-[9px] text-white backdrop-blur-sm">
                    {activeBoxInfo.text}
                  </div>
                </div>) : (<EmptyUploadBox title="Upload a Photo" subtitle={`Click or scan QR code to upload (${activeBoxInfo.text})`} onUpload={() => triggerUpload("single")}/>)}

              <GateOverlay active={isGenerating} image={uploadedImage} background={currentBgColorValue}/>
            </FitFrame>)}

          {!isDualPreviewActive && (<button type="button" onClick={enableDualMode} className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#E2E8F0]/60 px-4 py-2 text-xs font-medium text-[#0F172A] shadow-sm transition hover:bg-[#E2E8F0]">
              <ImageIcon size={14} className="text-[#2563EB]"/><AiT>{"Upload 2 separate images\n            "}</AiT></button>)}
        </div>) : (<div className="flex w-full max-w-[1000px] flex-col items-center gap-5 xl:min-h-0 xl:flex-1 xl:gap-3">
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-rows-[minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-1.5 xl:min-h-0">
              <span className="shrink-0 text-center text-xs font-semibold uppercase tracking-wider text-[#0F172A]"><AiT>{"Left Person\n              "}</AiT></span>

              <FitFrame info={activeBoxInfo} imageSrc={leftImage} className="overflow-hidden rounded-2xl border-2 border-[#E2E8F0] shadow-xl">
                {leftImage ? (<div className="group relative h-full w-full" style={getBackgroundStyle(currentBgColorValue)}>
                    <img src={leftImage} alt="Left person" className="h-full w-full object-contain"/>

                    <button type="button" onClick={() => setLeftImage(null)} className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label={t("Remove left photo")}>
                      <X size={14}/>
                    </button>
                  </div>) : (<EmptyUploadBox title="Upload left photo" onUpload={() => triggerUpload("left")}/>)}

                <GateOverlay active={isGenerating && !!leftImage} image={leftImage} background={currentBgColorValue}/>
              </FitFrame>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5 xl:min-h-0">
              <span className="shrink-0 text-center text-xs font-semibold uppercase tracking-wider text-[#0F172A]"><AiT>{"Right Person\n              "}</AiT></span>

              <FitFrame info={activeBoxInfo} imageSrc={rightImage} className="overflow-hidden rounded-2xl border-2 border-[#E2E8F0] shadow-xl">
                {rightImage ? (<div className="group relative h-full w-full" style={getBackgroundStyle(currentBgColorValue)}>
                    <img src={rightImage} alt="Right person" className="h-full w-full object-contain"/>

                    <button type="button" onClick={() => setRightImage(null)} className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label={t("Remove right photo")}>
                      <X size={14}/>
                    </button>
                  </div>) : (<EmptyUploadBox title="Upload right photo" onUpload={() => triggerUpload("right")}/>)}

                <GateOverlay active={isGenerating && !!rightImage} image={rightImage} background={currentBgColorValue}/>
              </FitFrame>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={() => {
                setLeftImage(rightImage);
                setRightImage(leftImage);
            }} className="cursor-pointer rounded-xl border border-[#E2E8F0] bg-[#E2E8F0] p-2 text-[#0F172A] transition hover:bg-[#E2E8F0]/80" title="Swap images" aria-label={t("Swap images")}>
              <ArrowLeftRight size={16}/>
            </button>

            <button type="button" onClick={() => {
                setLeftImage(null);
                setRightImage(null);
                exitDualMode();
            }} className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100">
              <RefreshCw size={14}/><AiT>{"Exit dual mode\n            "}</AiT></button>
          </div>
        </div>)}
    </div>);
}
