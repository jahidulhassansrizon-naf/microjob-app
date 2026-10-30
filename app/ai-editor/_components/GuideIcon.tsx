"use client";
import React from "react";

const D = (id: string, a: string, b: string, vertical = true) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
    <stop offset="0" stopColor={a} />
    <stop offset="1" stopColor={b} />
  </linearGradient>
);

const ART: Record<string, () => React.ReactElement> = {
  "Straighten Tilted Photo": () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        {D("gi-st-bg", "#e0f2fe", "#93c5fd")}
        {D("gi-st-sh", "#475569", "#0f172a")}
      </defs>
      <g transform="rotate(-16 24 25)" opacity=".4">
        <rect x="9" y="7" width="30" height="36" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
      </g>
      <rect x="9" y="6" width="30" height="36" rx="3" fill="url(#gi-st-bg)" stroke="#1e3a8a" strokeWidth="1.4" />
      <path d="M12 42 Q13 31 24 30 Q35 31 36 42Z" fill="url(#gi-st-sh)" />
      <rect x="21.5" y="26" width="5" height="5" rx="1.5" fill="#f1c9a0" />
      <ellipse cx="24" cy="19.5" rx="6.2" ry="7.4" fill="#f6d7b4" />
      <path d="M17.6 18.5 Q18 11.5 24 11.5 Q30 11.5 30.4 18.5 Q28 15 24 15.4 Q20 15 17.6 18.5Z" fill="#3a281a" />
      <line x1="24" y1="2" x2="24" y2="46" stroke="#16a34a" strokeWidth="1.6" strokeDasharray="3 2.4" />
      <path d="M6 14 A19 19 0 0 1 17 4.5" stroke="#16a34a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M13.5 3 L17.5 4.5 L15.2 8.2" stroke="#16a34a" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Lipstick: () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        {D("gi-lip-red", "#ff6b86", "#8f0029")}
        {D("gi-lip-gold", "#fff6cf", "#a8751c", false)}
        {D("gi-lip-blk", "#5b6472", "#05070c", false)}
      </defs>
      <ellipse cx="24" cy="45" rx="12" ry="2" fill="#000" opacity=".22" />
      <path d="M17.5 28 V16 Q17.5 12.5 20.5 11.2 L29.5 7 Q31.8 6.2 31.8 8.8 V28 Z" fill="url(#gi-lip-red)" />
      <path d="M19.5 27 V16.4 Q19.5 14.4 21.2 13.7 L23 13 V27 Z" fill="#fff" opacity=".32" />
      <path d="M26.5 9.6 L31.8 8.8 V28 H29 Z" fill="#000" opacity=".18" />
      <rect x="15.5" y="27.5" width="17" height="2.2" rx=".8" fill="url(#gi-lip-gold)" />
      <rect x="15" y="30" width="18" height="5" rx="1" fill="url(#gi-lip-gold)" />
      <rect x="15" y="31.4" width="18" height=".7" fill="#7a5410" opacity=".5" />
      <rect x="14.5" y="35" width="19" height="9.5" rx="2" fill="url(#gi-lip-blk)" />
      <rect x="16.5" y="36" width="2.6" height="7.5" rx="1.3" fill="#fff" opacity=".3" />
      <rect x="21" y="38.5" width="6" height="1.2" rx=".6" fill="#d9a441" opacity=".85" />
    </svg>
  ),
  "Glow & Makeup": () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        <linearGradient id="h1-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3c4" /><stop offset=".5" stopColor="#d9a93e" /><stop offset="1" stopColor="#8a5a10" /></linearGradient>
        <linearGradient id="h1-mir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".5" stopColor="#cfe0ec" /><stop offset="1" stopColor="#8fa9bb" /></linearGradient>
        <radialGradient id="h1-pow" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#ffd0da" /><stop offset="1" stopColor="#dc7893" /></radialGradient>
      </defs>
      <ellipse cx="24" cy="45" rx="17" ry="2.2" fill="#000" opacity=".22" />
      <rect x="9" y="3" width="30" height="24" rx="5" fill="url(#h1-gold)" />
      <rect x="12" y="6" width="24" height="18" rx="3" fill="url(#h1-mir)" />
      <path d="M14 22 L26 7 L30 7 L18 22Z" fill="#fff" opacity=".7" />
      <ellipse cx="24" cy="35" rx="20" ry="10" fill="url(#h1-gold)" />
      <ellipse cx="24" cy="33.5" rx="17" ry="8" fill="#6b4408" opacity=".4" />
      <ellipse cx="24" cy="33" rx="15.5" ry="7" fill="url(#h1-pow)" />
      <ellipse cx="24" cy="33" rx="11" ry="4.5" fill="none" stroke="#fff" strokeWidth=".8" opacity=".5" />
      <ellipse cx="19" cy="31" rx="5" ry="1.8" fill="#fff" opacity=".5" />
      <path d="M41 6 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="#ffe27a" stroke="#fff" strokeWidth=".6" />
    </svg>
  ),
  "Smooth Skin": () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        <linearGradient id="h2-jar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#dbe4ee" /><stop offset=".35" stopColor="#ffffff" /><stop offset="1" stopColor="#b9c6d4" /></linearGradient>
        <linearGradient id="h2-lid" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9a6b1a" /><stop offset=".35" stopColor="#fff0b8" /><stop offset="1" stopColor="#8a5a10" /></linearGradient>
        <radialGradient id="h2-cr" cx=".4" cy=".3" r=".9"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#f5d9dd" /></radialGradient>
      </defs>
      <ellipse cx="24" cy="45" rx="16" ry="2" fill="#000" opacity=".2" />
      <rect x="6" y="26" width="36" height="17" rx="5" fill="url(#h2-jar)" />
      <rect x="4" y="19" width="40" height="9" rx="3" fill="url(#h2-lid)" />
      <rect x="8" y="20.5" width="32" height="2" rx="1" fill="#fff" opacity=".55" />
      <rect x="14" y="32" width="20" height="5" rx="2.5" fill="#cbd5e1" opacity=".5" />
      <path d="M13 19 C12 12 20 13 21 9 C22 5 29 6 28 10 C32 9 36 13 34 19Z" fill="url(#h2-cr)" />
      <path d="M17 17 q7 -5 15 0" stroke="#e7bcc3" strokeWidth="1.2" fill="none" />
      <ellipse cx="20" cy="12" rx="2.5" ry="1.5" fill="#fff" />
      <path d="M40 8 l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2z" fill="#9bd7ff" stroke="#fff" strokeWidth=".6" />
    </svg>
  ),
  "Brighten Image": () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        <radialGradient id="h3-sun" cx=".38" cy=".33" r=".85"><stop offset="0" stopColor="#fffbd0" /><stop offset=".5" stopColor="#ffc928" /><stop offset="1" stopColor="#ee7d00" /></radialGradient>
        <radialGradient id="h3-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffe27a" stopOpacity=".75" /><stop offset="1" stopColor="#ffe27a" stopOpacity="0" /></radialGradient>
        <linearGradient id="h3-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd84a" /><stop offset="1" stopColor="#ff9f00" /></linearGradient>
      </defs>
      <circle cx="24" cy="24" r="23.5" fill="url(#h3-halo)" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d={a % 90 === 0 ? "M24 2 L27 11 H21Z" : "M24 4 L26.5 10.5 H21.500Z"} fill="url(#h3-ray)" transform={`rotate(${a} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="12.5" fill="url(#h3-sun)" />
      <circle cx="24" cy="24" r="12.5" fill="none" stroke="#fff" strokeWidth=".8" opacity=".5" />
      <ellipse cx="19.5" cy="18.5" rx="5" ry="3" fill="#fff" opacity=".6" transform="rotate(-35 19.5 18.5)" />
    </svg>
  ),
  "Studio Lighting": () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        <linearGradient id="h4-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b6472" /><stop offset="1" stopColor="#0b0f19" /></linearGradient>
        <radialGradient id="h4-face" cx=".5" cy=".5" r=".75"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ffe08a" /></radialGradient>
        <linearGradient id="h4-leg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9aa3b2" /><stop offset="1" stopColor="#4b5563" /></linearGradient>
      </defs>
      <ellipse cx="24" cy="46" rx="14" ry="1.6" fill="#000" opacity=".18" />
      <path d="M24 30 V41 M24 38 L12 46 M24 38 L36 46 M24 38 V46" stroke="url(#h4-leg)" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="21.5" y="27" width="5" height="6" rx="1.5" fill="#2b3340" />
      <path d="M6 8 L36 3.5 L39 27 L9 31.500Z" fill="url(#h4-body)" />
      <path d="M9.5 11 L34 7.5 L36 24 L12 27.500Z" fill="url(#h4-face)" />
      <path d="M9.5 11 L34 7.5 L34.5 11 L10 14.500Z" fill="#fff" opacity=".7" />
      <path d="M22 9 L23 26" stroke="#e5c56a" strokeWidth=".6" opacity=".7" />
      <g stroke="#ffcf40" strokeWidth="2.2" strokeLinecap="round"><path d="M42 10 l4 -2" /><path d="M43 17 h4" /><path d="M42 24 l4 2" /></g>
    </svg>
  ),
  "Straighten Head": () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      {SHARED}
      <g transform="translate(5 3) scale(.8)">{Face()}</g>
      <line x1="24" y1="0" x2="24" y2="48" stroke="#2563eb" strokeWidth="1.8" strokeDasharray="3.5 2.5" />
      <path d="M8 6 A18 18 0 0 1 20 1.5" stroke="#2563eb" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M17 -.5 L21 1.5 L17.5 4.5" stroke="#2563eb" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "Keep Marks": () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      {SHARED}
      <g transform="translate(-1 0) scale(.88)">{Face()}</g>
      <circle cx="30" cy="22" r="5.5" fill="none" stroke="#16a34a" strokeWidth="2" />
      <circle cx="30" cy="22" r="1.8" fill="#4a2a18" />
      <path d="M35 28 L44 31 V38 Q44 44 35 47.5 Q26 44 26 38 V31 Z" fill="url(#p-green)" stroke="#fff" strokeWidth="1.6" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.35))" }} />
      <path d="M31 38 l3.2 3.2 5.5 -6.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  "Restore Old Photo": () => (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      {SHARED}
      <ellipse cx="24" cy="45.5" rx="15" ry="1.8" fill="#000" opacity=".18" />
      <g transform="rotate(-6 24 24)">
        <rect x="5" y="4" width="36" height="40" rx="1.5" fill="url(#p-paper)" stroke="#cdbf9f" strokeWidth=".8" />
        <rect x="9" y="8" width="28" height="29" fill="#c9a574" />
        <rect x="9" y="8" width="28" height="29" fill="#fff" opacity=".12" />
        <path d="M11 37 Q12 27 23 26 Q34 27 35 37Z" fill="#4a3320" opacity=".8" />
        <ellipse cx="23" cy="19" rx="6" ry="7.5" fill="#e5c7a0" opacity=".9" />
        <path d="M16.5 17 Q17 10 23 10 Q29 10 29.5 17 Q27 13.5 23 14 Q19 13.5 16.5 17Z" fill="#3a281a" />
        <g stroke="#fff" strokeWidth=".9" opacity=".95"><path d="M10 12 L24 33" /><path d="M16 9 L28 28" /><path d="M30 10 L34 18" /></g>
        <path d="M37 4 L41 4 L41 12Z" fill="#f4f1e8" stroke="#cdbf9f" strokeWidth=".6" />
        <path d="M5 36 L9 38 L6 41 L9 44 L5 44Z" fill="#fff" opacity=".0" />
      </g>
      <path d="M39 3 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2z" fill="#ffd54a" stroke="#fff" strokeWidth=".8" />
      <path d="M8 40 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.200z" fill="#fff" stroke="#e0b94a" strokeWidth=".5" />
    </svg>
  ),
};

ART.__sun = () => ART["Brighten Image"]();

const R = (id: string, a: string, b: string, c?: string) => (
  <radialGradient id={id} cx=".35" cy=".3" r=".95">
    <stop offset="0" stopColor={a} />
    {c && <stop offset=".55" stopColor={c} />}
    <stop offset="1" stopColor={b} />
  </radialGradient>
);
const SHARED = (
  <defs>
    {R("p-skin", "#ffe4cf", "#d9946a")}{R("p-blue", "#d7f1ff", "#0a4fb3", "#38a6f2")}{R("p-sun", "#fffbd0", "#ee7d00", "#ffc928")}
    {R("p-gold", "#fff6d0", "#8f5e12", "#e2b455")}{R("p-glass", "#e9f7ff", "#7fa6c4")}{R("p-red", "#ff8a9d", "#9a0b2e")}
    {D("p-silver", "#f1f5f9", "#7b8494")}{D("p-dark", "#4b5563", "#0b0f19")}{D("p-paper", "#fffdf5", "#e3d8bf")}
    {D("p-sky", "#7cc8ff", "#e6f6ff")}{D("p-hill", "#4fae78", "#1b5e3f")}{D("p-wood", "#f0d3a2", "#a8743a")}
    {D("p-pink", "#ffb3c6", "#e0457b")}{D("p-green", "#86efac", "#15803d")}{D("p-purple", "#d8b4fe", "#6d28d9")}
    {D("p-orange", "#fdba74", "#c2410c")}{D("p-teal", "#5eead4", "#0f766e")}{D("p-navy", "#3b5bdb", "#172554")}
  </defs>
);
const Sh = () => <ellipse cx="24" cy="45" rx="13" ry="1.8" fill="#000" opacity=".18" />;
const Spark = (x: number, y: number, s = 1, f = "#ffe27a") => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6Z" fill={f} stroke="#fff" strokeWidth=".5" />
);

type FO = { cheek?: string; spots?: boolean; shadow?: boolean; glare?: boolean; beard?: boolean; lines?: boolean; tint?: string; fade?: boolean; glasses?: boolean; bw?: boolean; smile?: boolean; teeth?: boolean; light?: boolean };
const Face = (o: FO = {}) => (
  <g opacity={o.fade ? 0.4 : 1} style={o.bw ? { filter: "grayscale(1) contrast(1.1)" } : undefined}>
    <path d="M7 47 Q9 35 24 34 Q39 35 41 47 Z" fill="url(#p-navy)" />
    <path d="M20 34 L24 40 L28 34 Z" fill="#f4f4f4" />
    <rect x="20" y="28" width="8" height="8" rx="3" fill="#cf8c62" />
    <ellipse cx="24" cy="19" rx="11" ry="13" fill="url(#p-skin)" />
    {o.light && <ellipse cx="24" cy="19" rx="11" ry="13" fill="#fff" opacity=".35" />}
    <path d="M12.5 17 Q12 5 24 5 Q36 5 35.5 17 Q32 10 24 10.5 Q16 10 12.5 17Z" fill="#2b1d16" />
    {o.beard && <path d="M13 21 Q13 34 24 34 Q35 34 35 21 Q31 27 24 27 Q17 27 13 21Z" fill="#3a2a20" />}
    <g fill="#2b1d16"><ellipse cx="19.5" cy="18.5" rx="1.4" ry="1.7" /><ellipse cx="28.5" cy="18.5" rx="1.4" ry="1.7" /></g>
    <path d="M17 15.5 q2.5 -1.6 5 0 M26 15.5 q2.5 -1.6 5 0" stroke="#2b1d16" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {o.teeth ? <path d="M19 25 q5 4.5 10 0 q-5 1.5 -10 0Z" fill="#fff" stroke="#b5485f" strokeWidth=".8" /> : <path d="M20 25.5 q4 2.6 8 0" stroke="#b5485f" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
    {o.cheek && (<><circle cx="15.5" cy="23" r="3" fill={o.cheek} opacity=".5" /><circle cx="32.5" cy="23" r="3" fill={o.cheek} opacity=".5" /></>)}
    {o.spots && [[17, 13], [30, 14], [26, 22], [18, 23], [31, 20]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#a0522d" />)}
    {o.lines && <g stroke="#a4673f" strokeWidth=".8" opacity=".7" fill="none"><path d="M16 12 q8 -2 16 0" /><path d="M15 22 q2 2 4 3" /><path d="M33 22 q-2 2 -4 3" /></g>}
    {o.shadow && <path d="M24 6 Q36 6 35 19 Q35 32 24 32 Z" fill="#1e1b4b" opacity=".38" />}
    {o.glare && <ellipse cx="21" cy="12" rx="5" ry="3" fill="#fff" opacity=".85" />}
    {o.glasses && <g fill="rgba(160,210,255,.25)" stroke="#27272a" strokeWidth="1.3"><circle cx="19.5" cy="18.5" r="4.2" /><circle cx="28.5" cy="18.5" r="4.2" /><path d="M23.7 18.5 h.6" /></g>}
    {o.tint && <ellipse cx="24" cy="19" rx="11" ry="13" fill={o.tint} opacity=".3" />}
    <ellipse cx="17" cy="11" rx="4" ry="2.2" fill="#fff" opacity=".35" transform="rotate(-30 17 11)" />
  </g>
);
const Eye = (iris = "#2f6f8f") => (<>
  <path d="M2 24 Q24 5 46 24 Q24 43 2 24Z" fill="url(#p-glass)" stroke="#b9876a" strokeWidth="1.6" />
  <path d="M2 24 Q24 5 46 24 Q24 43 2 24Z" fill="#fff" opacity=".85" />
  <circle cx="24" cy="24" r="10" fill={iris} /><circle cx="24" cy="24" r="10" fill="none" stroke="#0b1a24" strokeWidth="1.4" />
  <circle cx="24" cy="24" r="4.2" fill="#000" /><circle cx="20.5" cy="20.5" r="2.6" fill="#fff" opacity=".9" />
  <path d="M3 21 Q24 3 45 21" stroke="#2b1a10" strokeWidth="2.6" fill="none" strokeLinecap="round" />
</>);
type PO = { tone?: "color" | "bw" | "sepia" | "dark" | "bright" | "fade" | "yellow" | "cast" | "matte"; scratch?: boolean; torn?: boolean; stain?: boolean };
const Photo = (o: PO = {}) => {
  const t = o.tone ?? "color";
  const ov: Record<string, [string, number]> = { sepia: ["#8b5a2b", 0.45], dark: ["#020617", 0.6], bright: ["#ffffff", 0.45], fade: ["#f5f5f4", 0.6], yellow: ["#d6a31a", 0.5], cast: ["#16a34a", 0.35], matte: ["#9ca3af", 0.3] };
  return (<>
    <Sh />
    <g transform="rotate(-4 24 24)">
      <rect x="4" y="6" width="40" height="36" rx="2" fill="url(#p-paper)" stroke="#cdbf9f" strokeWidth=".8" />
      <g style={t === "bw" ? { filter: "grayscale(1)" } : undefined}>
        <rect x="8" y="10" width="32" height="25" fill="url(#p-sky)" />
        <circle cx="32" cy="17" r="3.6" fill="#ffd54a" />
        <path d="M8 35 L19 21 L27 30 L33 24 L40 35Z" fill="url(#p-hill)" />
        {ov[t] && <rect x="8" y="10" width="32" height="25" fill={ov[t][0]} opacity={ov[t][1]} />}
      </g>
      {o.scratch && <g stroke="#fff" strokeWidth=".9" opacity=".95" fill="none"><path d="M12 12 L30 33" /><path d="M20 11 L36 30" /><path d="M10 25 L22 34" /></g>}
      {o.stain && <path d="M10 33 Q14 24 22 30 Q30 36 38 28 L38 35 H10Z" fill="#5b8bb5" opacity=".45" />}
      {o.torn && <path d="M44 6 L44 16 L38 12 L41 9 L36 6Z" fill="#f4f1e8" stroke="#cdbf9f" strokeWidth=".6" />}
      {o.torn && <path d="M4 30 L9 32 L6 35 L10 38 L4 42Z" fill="#f4f1e8" stroke="#cdbf9f" strokeWidth=".6" />}
    </g>
  </>);
};
const Sil = () => (<><Sh /><path d="M6 47 Q8 33 24 32 Q40 33 42 47Z" fill="url(#p-dark)" /><ellipse cx="24" cy="18" rx="10" ry="12" fill="url(#p-dark)" /><ellipse cx="19" cy="12" rx="3" ry="1.8" fill="#fff" opacity=".25" /></>);
const Frame = (blur = false) => (<>
  <Sh />
  <rect x="4" y="7" width="40" height="34" rx="3.5" fill="#fff" stroke="#cbd5e1" strokeWidth="1.2" />
  <rect x="7" y="10" width="34" height="28" rx="1.5" fill="url(#p-sky)" />
  <g style={blur ? { filter: "blur(1.4px)" } : undefined}><circle cx="33" cy="17" r="4" fill="#ffd54a" /><path d="M7 38 L18 22 L26 31 L32 25 L41 38Z" fill="url(#p-hill)" /><path d="M10 38 q1 -5 4 -5 q3 0 4 5Z" fill="#14532d" /></g>
</>);
const Id = () => (<>
  <Sh /><rect x="5" y="8" width="38" height="34" rx="4" fill="url(#p-paper)" stroke="#b7c4d8" strokeWidth="1.2" />
  <path d="M5 12 a4 4 0 0 1 4 -4 H39 a4 4 0 0 1 4 4 V16 H5Z" fill="url(#p-navy)" />
  <rect x="19" y="10" width="10" height="2.6" rx="1.3" fill="#fff" opacity=".85" />
  <rect x="9" y="20" width="14" height="18" rx="1.5" fill="#fff" stroke="#cbd5e1" strokeWidth=".8" />
  <circle cx="16" cy="27" r="3.6" fill="url(#p-skin)" /><path d="M10 38 q1 -6 6 -6 q5 0 6 6Z" fill="#1e3a8a" />
  <rect x="26" y="21" width="13" height="2.4" rx="1.2" fill="#94a3b8" /><rect x="26" y="26" width="10" height="2.4" rx="1.2" fill="#b6c2d3" /><rect x="26" y="31" width="12" height="2.4" rx="1.2" fill="#b6c2d3" />
</>);

const P: Record<string, () => React.ReactElement> = {
  face: () => <>{Sh()}{Face()}</>,
  faceBlush: () => <>{Sh()}{Face({ cheek: "#ff6f91", smile: true })}</>,
  faceRed: () => <>{Sh()}{Face({ cheek: "#e11d48", tint: "#ef4444" })}</>,
  faceSpots: () => <>{Sh()}{Face({ spots: true })}</>,
  faceShine: () => <>{Sh()}{Face({ glare: true })}</>,
  faceLines: () => <>{Sh()}{Face({ lines: true })}</>,
  faceBeard: () => <>{Sh()}{Face({ beard: true })}</>,
  faceShadow: () => <>{Sh()}{Face({ shadow: true })}</>,
  faceFade: () => <>{Sh()}{Face({ fade: true })}</>,
  faceBW: () => <>{Sh()}{Face({ bw: true })}</>,
  faceWarm: () => <>{Sh()}{Face({ tint: "#f59e0b", cheek: "#f97316" })}</>,
  faceCool: () => <>{Sh()}{Face({ tint: "#3b82f6" })}</>,
  faceHigh: () => <>{Sh()}{Face({ light: true })}</>,
  faceLow: () => <>{Sh()}{Face({ shadow: true, bw: false, tint: "#0f172a" })}</>,
  faceGlow: () => <>{Sh()}<circle cx="24" cy="20" r="22" fill="#fff" opacity=".35" />{Face({ cheek: "#ffb3c6", light: true })}</>,
  faceSmile: () => <>{Sh()}{Face({ smile: true, cheek: "#ff9aa9" })}</>,
  faceGlasses: () => <>{Sh()}{Face({ glasses: true })}</>,
  teeth: () => (<><Sh /><path d="M4 18 Q24 4 44 18 Q44 40 24 42 Q4 40 4 18Z" fill="#c4506a" /><path d="M8 19 Q24 9 40 19 Q40 33 24 34 Q8 33 8 19Z" fill="#fff" /><g stroke="#cfd8e3" strokeWidth=".9"><path d="M16 14 V30 M24 12 V33 M32 14 V30" /></g><path d="M10 20 Q24 12 38 20" stroke="#e2e8f0" strokeWidth="2" fill="none" opacity=".7" /></>),
  eye: () => Eye(),
  eyeRed: () => Eye("#c81e1e"),
  brow: () => (<><Sh /><path d="M4 30 Q18 10 44 18 Q22 20 6 34Z" fill="#2b1d16" /><path d="M8 28 Q20 16 38 18" stroke="#6b4a36" strokeWidth="1.4" fill="none" opacity=".6" /><path d="M6 35 Q22 24 44 22" stroke="#e8b995" strokeWidth="0" /></>),
  hair: () => (<><Sh /><path d="M10 4 C2 18 18 22 10 44 C24 36 30 24 24 12 C34 22 28 34 38 44 C46 24 36 8 10 4Z" fill="#3a2418" /><path d="M14 8 C10 18 20 24 14 36" stroke="#8a5a3b" strokeWidth="2" fill="none" opacity=".6" /></>),
  swatches: () => (<><Sh />{["#f6d3b8", "#e9b48c", "#c98a62", "#8d5a3b"].map((c, i) => <rect key={i} x={5 + i * 9} y={8 + (i % 2) * 3} width="9" height="32" rx="3" fill={c} stroke="#fff" strokeWidth="1.2" />)}</>),
  fingerprint: () => (<><Sh /><circle cx="24" cy="24" r="20" fill="url(#p-skin)" />{[5, 8.5, 12, 15.5].map((r) => <path key={r} d={`M${24 - r} 28 a${r} ${r} 0 0 1 ${2 * r} 0`} stroke="#a4673f" strokeWidth="1.4" fill="none" strokeLinecap="round" />)}<path d="M24 30 v7 M19 30 v5 M29 30 v5" stroke="#a4673f" strokeWidth="1.4" strokeLinecap="round" /></>),
  cotton: () => (<><Sh /><circle cx="24" cy="24" r="19" fill="#fff" stroke="#e5e7eb" strokeWidth="1.5" /><circle cx="24" cy="24" r="14" fill="none" stroke="#f1f5f9" strokeWidth="2" /><path d="M14 22 q6 -7 14 -2 q-4 6 -14 2Z" fill="#e0457b" opacity=".55" /></>),
  brush: () => (<><Sh /><g transform="rotate(35 24 24)"><rect x="21" y="22" width="6" height="24" rx="3" fill="url(#p-gold)" /><rect x="20.5" y="16" width="7" height="8" fill="url(#p-silver)" /><path d="M19 17 Q17 4 24 2 Q31 4 29 17Z" fill="url(#p-pink)" /><path d="M21 14 Q21 6 24 4" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".6" /></g></>),
  eraser: () => (<><Sh /><g transform="rotate(-30 24 24)"><rect x="6" y="14" width="36" height="20" rx="4" fill="url(#p-pink)" /><rect x="6" y="14" width="13" height="20" rx="4" fill="url(#p-navy)" /><rect x="8" y="16" width="30" height="4" rx="2" fill="#fff" opacity=".35" /></g></>),
  scissors: () => (<><Sh /><path d="M8 6 L36 34 M40 6 L12 34" stroke="url(#p-silver)" strokeWidth="4.5" strokeLinecap="round" /><path d="M8 6 L36 34 M40 6 L12 34" stroke="#64748b" strokeWidth=".8" /><circle cx="12" cy="38" r="6" fill="none" stroke="#dc2626" strokeWidth="3.4" /><circle cx="36" cy="38" r="6" fill="none" stroke="#dc2626" strokeWidth="3.4" /><circle cx="24" cy="20" r="2" fill="#475569" /></>),
  comb: () => (<><Sh /><rect x="4" y="14" width="40" height="11" rx="3" fill="url(#p-orange)" />{Array.from({ length: 11 }).map((_, i) => <rect key={i} x={6 + i * 3.4} y="25" width="1.8" height="14" rx=".9" fill="#c2410c" />)}<rect x="6" y="16" width="36" height="3" rx="1.5" fill="#fff" opacity=".4" /></>),
  wand: () => (<><Sh /><g transform="rotate(40 24 24)"><rect x="21.5" y="12" width="5" height="34" rx="2.5" fill="url(#p-dark)" /><rect x="21.5" y="12" width="5" height="9" rx="2" fill="url(#p-gold)" /></g>{Spark(14, 12, 1.5)}{Spark(36, 8, 1)}{Spark(38, 24, .8)}</>),
  sparkle: () => (<><Sh />{Spark(24, 24, 3.6)}{Spark(38, 10, 1.4)}{Spark(10, 38, 1.2)}</>),
  shield: () => (<><Sh /><path d="M24 3 L41 9 V24 Q41 38 24 45 Q7 38 7 24 V9Z" fill="url(#p-green)" stroke="#fff" strokeWidth="1.6" /><path d="M15 24 l7 7 12 -14" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>),
  check: () => (<><Sh /><circle cx="24" cy="24" r="20" fill="url(#p-green)" stroke="#fff" strokeWidth="2" /><path d="M13 25 l8 8 14 -17" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>),
  droplet: () => (<><Sh /><path d="M24 3 C24 3 9 20 9 30 a15 15 0 0 0 30 0 C39 20 24 3 24 3Z" fill="url(#p-blue)" /><ellipse cx="17.5" cy="25" rx="2.4" ry="5" fill="#fff" opacity=".7" transform="rotate(20 17.5 25)" /></>),
  sun: () => <>{ART.__sun()}</>,
  moon: () => (<><Sh /><path d="M30 4 A20 20 0 1 0 44 30 A16 16 0 0 1 30 4Z" fill="url(#p-gold)" /><path d="M14 20 q3 -6 9 -8" stroke="#fff" strokeWidth="2" fill="none" opacity=".6" strokeLinecap="round" />{Spark(38, 12, 1.2, "#fff")}{Spark(42, 24, .8, "#fff")}</>),
  bulb: () => (<><Sh /><path d="M24 2 a15 15 0 0 1 8 27.5 V34 H16 V29.5 A15 15 0 0 1 24 2Z" fill="url(#p-sun)" /><path d="M20 28 l4 -9 l4 9" stroke="#b36b00" strokeWidth="1.4" fill="none" /><ellipse cx="17.5" cy="13" rx="2.6" ry="5" fill="#fff" opacity=".6" transform="rotate(20 17.5 13)" /><rect x="16" y="34" width="16" height="4" rx="1" fill="url(#p-silver)" /><rect x="17" y="38" width="14" height="3.5" rx="1" fill="url(#p-silver)" /><path d="M20 41.5 h8 l-1.5 3 h-5Z" fill="#4b5563" /></>),
  camera: () => (<><Sh /><rect x="3" y="12" width="42" height="29" rx="5" fill="url(#p-dark)" /><rect x="14" y="7" width="14" height="7" rx="2" fill="url(#p-dark)" /><rect x="3" y="18" width="42" height="5" fill="#9aa3b2" opacity=".35" /><circle cx="24" cy="28" r="11" fill="url(#p-silver)" /><circle cx="24" cy="28" r="8" fill="#0b0f19" /><circle cx="24" cy="28" r="5.5" fill="#2a2f8f" /><circle cx="21.5" cy="25.5" r="1.8" fill="#fff" opacity=".8" /><circle cx="38" cy="17" r="2" fill="#fbbf24" /></>),
  lens: () => (<><Sh /><circle cx="24" cy="24" r="20" fill="url(#p-silver)" /><circle cx="24" cy="24" r="16" fill="#0b0f19" /><circle cx="24" cy="24" r="12.5" fill="#2a2f8f" /><circle cx="24" cy="24" r="6" fill="none" stroke="#7c8cff" strokeWidth=".9" /><path d="M15 19 A11 11 0 0 1 24 13" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".75" /></>),
  magnifier: () => (<><Sh /><circle cx="20" cy="20" r="14" fill="url(#p-glass)" stroke="url(#p-gold)" strokeWidth="4" opacity=".95" /><path d="M10 15 a11 11 0 0 1 9 -6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" /><path d="M31 31 L44 44" stroke="url(#p-dark)" strokeWidth="6" strokeLinecap="round" /></>),
  crosshair: () => (<><Sh /><circle cx="24" cy="24" r="14" fill="none" stroke="#2563eb" strokeWidth="3" /><circle cx="24" cy="24" r="4" fill="#ef4444" /><path d="M24 2 V12 M24 36 V46 M2 24 H12 M36 24 H46" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" /></>),
  focusbox: () => (<><Sh /><path d="M5 15 V5 H15 M33 5 H43 V15 M43 33 V43 H33 M15 43 H5 V33" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M5 15 V5 H15 M33 5 H43 V15 M43 33 V43 H33 M15 43 H5 V33" stroke="#334155" strokeWidth="1.2" fill="none" /><rect x="17" y="17" width="14" height="14" rx="2" fill="none" stroke="#22c55e" strokeWidth="3" /></>),
  expand: () => (<><Sh /><path d="M6 6 H20 L15 11 L22 18 L18 22 L11 15 L6 20Z" fill="url(#p-navy)" /><path d="M42 42 H28 L33 37 L26 30 L30 26 L37 33 L42 28Z" fill="url(#p-navy)" /><path d="M42 6 V20 L37 15 L30 22 L26 18 L33 11 L28 6Z" fill="url(#p-navy)" opacity=".85" /><path d="M6 42 V28 L11 33 L18 26 L22 30 L15 37 L20 42Z" fill="url(#p-navy)" opacity=".85" /></>),
  ruler: () => (<><Sh /><g transform="rotate(-35 24 24)"><rect x="2" y="16" width="44" height="16" rx="2" fill="url(#p-wood)" stroke="#a8743a" strokeWidth=".8" />{Array.from({ length: 14 }).map((_, i) => <path key={i} d={`M${6 + i * 3} 16 v${i % 3 === 0 ? 7 : 4}`} stroke="#5b3a14" strokeWidth="1" />)}</g></>),
  palette: () => (<><Sh /><path d="M24 4 C11 4 3 13 3 24 c0 9 7 17 17 17 c4 0 5 -3 3 -6 c-2 -3 0 -6 4 -6 h7 c6 0 11 -4 11 -10 C45 10 36 4 24 4Z" fill="url(#p-wood)" stroke="#a8743a" strokeWidth=".8" /><circle cx="14" cy="21" r="3.6" fill="#ef4444" /><circle cx="22" cy="12.5" r="3.6" fill="#facc15" /><circle cx="33" cy="13" r="3.6" fill="#22c55e" /><circle cx="38" cy="23" r="3.6" fill="#3b82f6" /><ellipse cx="13" cy="33" rx="3" ry="2.2" fill="#8a5a24" opacity=".55" /></>),
  contrast: () => (<><Sh /><circle cx="24" cy="24" r="20" fill="#fff" stroke="#334155" strokeWidth="2" /><path d="M24 4 A20 20 0 0 1 24 44Z" fill="#0f172a" /><circle cx="24" cy="24" r="20" fill="none" stroke="#fff" strokeWidth=".6" opacity=".4" /></>),
  pixels: () => (<><Sh />{Array.from({ length: 16 }).map((_, i) => { const c = ["#38bdf8", "#818cf8", "#f472b6", "#fb923c", "#34d399", "#facc15"]; return <rect key={i} x={6 + (i % 4) * 9} y={6 + Math.floor(i / 4) * 9} width="9" height="9" fill={c[(i * 5 + Math.floor(i / 3)) % 6]} stroke="#fff" strokeWidth=".6" />; })}</>),
  grain: () => (<><Sh /><rect x="5" y="5" width="38" height="38" rx="4" fill="#cbd5e1" />{Array.from({ length: 70 }).map((_, i) => <circle key={i} cx={7 + ((i * 37) % 34)} cy={7 + ((i * 53) % 34)} r={.9 + (i % 3) * .4} fill={i % 2 ? "#334155" : "#fff"} opacity=".8" />)}</>),
  blur: () => (<><Sh /><g style={{ filter: "blur(1.6px)" }}><circle cx="18" cy="24" r="13" fill="#38bdf8" opacity=".7" /><circle cx="30" cy="24" r="13" fill="#f472b6" opacity=".7" /></g></>),
  printer: () => (<><Sh /><rect x="12" y="4" width="24" height="14" rx="1" fill="url(#p-paper)" stroke="#cbd5e1" /><rect x="3" y="16" width="42" height="20" rx="4" fill="url(#p-dark)" /><rect x="12" y="30" width="24" height="14" rx="1" fill="#fff" stroke="#cbd5e1" /><path d="M16 35 h16 M16 39 h12" stroke="#94a3b8" strokeWidth="1.4" /><circle cx="38" cy="22" r="1.8" fill="#22c55e" /></>),
  cloud: () => (<><Sh /><path d="M12 38 a9 9 0 0 1 1 -18 a12 12 0 0 1 23 3 a8 8 0 0 1 -1 15Z" fill="url(#p-glass)" stroke="#9fb7c7" strokeWidth="1.4" /><ellipse cx="18" cy="24" rx="5" ry="2.5" fill="#fff" opacity=".8" /></>),
  flare: () => (<><Sh /><circle cx="24" cy="24" r="22" fill="#fff" opacity=".3" /><path d="M24 2 L28 20 L46 24 L28 28 L24 46 L20 28 L2 24 L20 20Z" fill="#fff" stroke="#fde68a" strokeWidth="1.6" /><circle cx="24" cy="24" r="4" fill="#fef9c3" /></>),
  layers: () => (<><Sh /><path d="M24 4 L44 14 L24 24 L4 14Z" fill="url(#p-purple)" /><path d="M4 22 L24 32 L44 22" stroke="#7c3aed" strokeWidth="3.4" fill="none" /><path d="M4 30 L24 40 L44 30" stroke="#a78bfa" strokeWidth="3.4" fill="none" /></>),
  crop: () => (<><Sh /><path d="M12 2 V36 H46 M2 12 H36 V46" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 2 V36 H46 M2 12 H36 V46" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".5" /></>),
  perspective: () => (<><Sh /><path d="M14 6 H34 L44 42 H4Z" fill="url(#p-sky)" stroke="#1e3a8a" strokeWidth="2" /><path d="M10 24 H38 M7 33 H41 M24 6 V42 M17 6 L12 42 M31 6 L36 42" stroke="#1e3a8a" strokeWidth="1.2" opacity=".6" /></>),
  halo: () => (<><Sh /><circle cx="24" cy="24" r="21" fill="none" stroke="#fde047" strokeWidth="4" opacity=".9" /><circle cx="24" cy="24" r="15" fill="none" stroke="#fff" strokeWidth="2" opacity=".6" /></>),
  suit: () => (<><Sh /><path d="M5 47 Q7 30 24 28 Q41 30 43 47Z" fill="url(#p-navy)" /><path d="M24 28 L16 47 H32Z" fill="#fff" /><path d="M24 30 l-3 4 l3 3 l3 -3Z" fill="#b91c1c" /><path d="M21 36 L24 37 L27 36 L28 47 H20Z" fill="#b91c1c" /><path d="M24 28 L12 31 L19 46 L24 34Z M24 28 L36 31 L29 46 L24 34Z" fill="#1e3a8a" opacity=".85" /><ellipse cx="24" cy="15" rx="8.5" ry="10.5" fill="url(#p-skin)" /><path d="M15.5 13 Q16 5 24 5 Q32 5 32.5 13 Q29 9 24 9.5 Q19 9 15.5 13Z" fill="#2b1d16" /></>),
  tie: () => (<><Sh /><path d="M9 6 H39 L33 16 L24 12 L15 16Z" fill="#fff" stroke="#cbd5e1" /><path d="M20 14 L28 14 L26 20 L22 20Z" fill="#b91c1c" /><path d="M22 20 H26 L30 44 L24 47 L18 44Z" fill="url(#p-red)" /></>),
  passport: () => (<><Sh /><rect x="8" y="3" width="32" height="42" rx="3.5" fill="url(#p-navy)" /><circle cx="24" cy="20" r="8.5" fill="none" stroke="#e2b455" strokeWidth="1.6" /><path d="M15.5 20 h17 M24 11.5 q-5 8.5 0 17 q5 -8.5 0 -17" stroke="#e2b455" strokeWidth="1.2" fill="none" /><rect x="15" y="33" width="18" height="3" rx="1.5" fill="#e2b455" /><rect x="11" y="3" width="2.5" height="42" fill="#fff" opacity=".18" /></>),
  glasses: () => (<><Sh /><g fill="rgba(170,215,255,.35)" stroke="#27272a" strokeWidth="3"><rect x="3" y="14" width="19" height="17" rx="6" /><rect x="26" y="14" width="19" height="17" rx="6" /></g><path d="M22 20 q2 -2 4 0" stroke="#27272a" strokeWidth="2.6" fill="none" /><path d="M7 19 l6 -2 M30 19 l6 -2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".8" /><path d="M3 20 L0 17 M45 20 L48 17" stroke="#27272a" strokeWidth="2.4" /></>),
  filmstrip: () => (<><Sh /><g transform="rotate(-12 24 24)"><rect x="2" y="9" width="44" height="30" rx="2" fill="#18181b" />{Array.from({ length: 9 }).map((_, i) => <g key={i}><rect x={4 + i * 5} y="11" width="3" height="3" rx=".6" fill="#e5e7eb" /><rect x={4 + i * 5} y="34" width="3" height="3" rx=".6" fill="#e5e7eb" /></g>)}<rect x="5" y="16" width="12" height="16" fill="url(#p-sky)" /><rect x="18" y="16" width="12" height="16" fill="url(#p-pink)" /><rect x="31" y="16" width="12" height="16" fill="url(#p-wood)" /></g></>),
  clapper: () => (<><Sh /><rect x="4" y="18" width="40" height="26" rx="3" fill="url(#p-dark)" /><g transform="rotate(-14 4 18)"><rect x="4" y="8" width="40" height="9" rx="2" fill="#f1f5f9" />{[8, 18, 28, 38].map((x) => <path key={x} d={`M${x} 8 l5 9 h-5 l-5 -9Z`} fill="#18181b" />)}</g><path d="M10 28 h28 M10 35 h20" stroke="#94a3b8" strokeWidth="1.6" /></>),
  snow: () => (<><Sh /><g stroke="#60a5fa" strokeWidth="3.4" strokeLinecap="round">{[0, 60, 120].map((a) => <line key={a} x1="24" y1="3" x2="24" y2="45" transform={`rotate(${a} 24 24)`} />)}</g><g stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round">{[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d="M24 9 l-4 -3 M24 9 l4 -3" transform={`rotate(${a} 24 24)`} />)}</g></>),
  leaf: () => (<><Sh /><path d="M6 42 C6 18 22 6 44 6 C44 28 32 42 10 42Z" fill="url(#p-green)" /><path d="M8 40 C18 30 28 22 40 10" stroke="#14532d" strokeWidth="1.8" fill="none" /></>),
  cameo: () => (<><Sh /><ellipse cx="24" cy="24" rx="19" ry="22" fill="url(#p-gold)" /><ellipse cx="24" cy="24" rx="14.5" ry="17.5" fill="url(#p-wood)" /><g style={{ filter: "sepia(1)" }}><path d="M12 42 Q14 32 24 31 Q34 32 36 42 Q30 46 18 46Z" fill="#6b4a2f" /><ellipse cx="24" cy="21" rx="7" ry="9" fill="#e8c9a5" /></g></>),
  twoFaces: () => (<><Sh /><g transform="translate(-9 3) scale(.72)">{Face()}</g><g transform="translate(15 3) scale(.72)">{Face({ cheek: "#ff9aa9" })}</g></>),
  tape: () => (<><Sh /><g transform="rotate(-25 24 24)"><rect x="3" y="15" width="42" height="18" rx="2" fill="#fde68a" opacity=".9" stroke="#eab308" strokeWidth="1" /><path d="M3 15 l3 3 l-3 3 l3 3 l-3 3 l3 3 l-3 3" stroke="#eab308" strokeWidth="1" fill="none" /><rect x="8" y="18" width="30" height="4" fill="#fff" opacity=".5" /></g></>),
  bandage: () => (<><Sh /><g transform="rotate(-35 24 24)"><rect x="2" y="14" width="44" height="20" rx="10" fill="#f3c9a0" stroke="#d7a373" strokeWidth="1" /><rect x="15" y="14" width="18" height="20" fill="#fff4e0" stroke="#d7a373" strokeWidth=".8" />{[19, 24, 29].map((x) => <circle key={x} cx={x} cy="24" r="1" fill="#d7a373" />)}</g></>),
  jpg: () => (<><Sh /><path d="M9 3 H30 L40 13 V45 H9Z" fill="url(#p-paper)" stroke="#94a3b8" strokeWidth="1.2" /><path d="M30 3 V13 H40Z" fill="#cbd5e1" /><rect x="3" y="22" width="30" height="14" rx="3" fill="url(#p-orange)" /><text x="18" y="33" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">JPG</text></>),
  hdr: () => (<><Sh /><rect x="3" y="10" width="42" height="28" rx="5" fill="url(#p-dark)" /><rect x="3" y="10" width="42" height="12" rx="5" fill="#fff" opacity=".1" /><text x="24" y="30.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fbbf24" fontFamily="Arial, sans-serif">HDR</text></>),
  kelvin: () => (<><Sh /><rect x="3" y="17" width="42" height="14" rx="7" fill="#60a5fa" /><rect x="3" y="17" width="42" height="14" rx="7" fill="url(#p-orange)" opacity=".65" /><rect x="3" y="17" width="42" height="14" rx="7" fill="none" stroke="#fff" strokeWidth="1.5" /><circle cx="29" cy="24" r="8" fill="url(#p-silver)" stroke="#475569" strokeWidth="1.4" /><circle cx="29" cy="24" r="3" fill="#475569" /></>),
  sunburst: () => <>{ART.__sun()}</>,
  frameScene: () => Frame(),
  frameBlur: () => Frame(true),
  idphoto: () => Id(),
  silhouette: () => Sil(),
  photo: () => Photo(),
  photoDark: () => Photo({ tone: "dark" }),
  photoBright: () => Photo({ tone: "bright" }),
  photoBW: () => Photo({ tone: "bw" }),
  photoSepia: () => Photo({ tone: "sepia" }),
  photoFade: () => Photo({ tone: "fade" }),
  photoYellow: () => Photo({ tone: "yellow" }),
  photoCast: () => Photo({ tone: "cast" }),
  photoMatte: () => Photo({ tone: "matte" }),
  photoScratch: () => Photo({ tone: "sepia", scratch: true }),
  photoTorn: () => Photo({ tone: "sepia", torn: true }),
  photoStain: () => Photo({ tone: "sepia", stain: true }),
};

const SPEC: Record<string, [string, string?]> = {"Even Skin Tone": ["swatches", "faceBlush"], "Remove Blemishes": ["faceSpots", "eraser"], "Reduce Dark Circles": ["eye", "moon"], "Reduce Facial Shine": ["faceShine", "cotton"], "Preserve Skin Texture": ["fingerprint", "shield"], "Reduce Temporary Redness": ["faceRed", "droplet"], "Soften Fine Lines": ["faceLines", "wand"], "Refine Makeup": ["faceBlush", "brush"], "Remove Makeup": ["cotton", "droplet"], "Brighten Eyes": ["eye", "sparkle"], "Sharpen Eye Details": ["eye", "magnifier"], "Reduce Red Eyes": ["eyeRed", "check"], "Whiten Teeth Naturally": ["teeth", "sparkle"], "Enhance Eyebrows": ["brow", "brush"], "Tidy Facial Hair": ["faceBeard", "scissors"], "Define Beard & Mustache": ["faceBeard", "comb"], "Tame Stray Hair": ["hair", "scissors"], "Restore Facial Details": ["face", "magnifier"], "Preserve Natural Expression": ["faceSmile", "shield"], "Fix Underexposure": ["photoDark", "sun"], "Recover Highlights": ["photoBright", "sparkle"], "Correct White Balance": ["kelvin", "sun"], "Natural Color Correction": ["palette", "check"], "Improve Contrast": ["contrast", "sparkle"], "Remove Color Cast": ["photoCast", "eraser"], "Reduce Harsh Shadows": ["faceShadow", "bulb"], "Brighten Face Shadows": ["faceShadow", "sun"], "Correct Backlighting": ["silhouette", "sun"], "Reduce Flash Glare": ["camera", "flare"], "Sharpen Details": ["magnifier", "sparkle"], "Reduce Image Noise": ["grain", "eraser"], "Deblur Image": ["blur", "crosshair"], "Upscale Image Detail": ["photo", "expand"], "Reduce Pixelation": ["pixels", "wand"], "Fix Compression Artifacts": ["jpg", "wand"], "Improve Low-Light Photo": ["moon", "camera"], "Recover Fine Details": ["photo", "magnifier"], "Remove Lens Haze": ["lens", "cloud"], "Correct Soft Focus": ["focusbox", "face"], "Improve Print Clarity": ["printer", "sparkle"], "Balance HDR Highlights": ["hdr", "sun"], "Repair Scratches": ["photoScratch", "bandage"], "Repair Tears & Creases": ["photoTorn", "tape"], "Remove Dust & Spots": ["photoSepia", "brush"], "Restore Faded Photo": ["photoFade", "sparkle"], "Colorize Black & White Photo": ["photoBW", "palette"], "Improve Black & White Contrast": ["photoBW", "contrast"], "Repair Water Damage": ["photoStain", "droplet"], "Rebuild Damaged Edges": ["photoTorn", "wand"], "Recover Faded Faces": ["faceFade", "sparkle"], "Remove Yellowing": ["photoYellow", "eraser"], "Restore Vintage Portrait": ["cameo", "sparkle"], "Clean Background": ["frameScene", "brush"], "Remove Background Distractions": ["frameScene", "eraser"], "Smooth Background": ["frameBlur", "wand"], "Remove Edge Halos": ["silhouette", "halo"], "Refine Hair Edges": ["silhouette", "comb"], "Separate Subject from Background": ["silhouette", "layers"], "Center Subject": ["frameScene", "crosshair"], "Balance Headroom": ["silhouette", "ruler"], "Correct Perspective": ["perspective", "ruler"], "Refine Photo Framing": ["frameScene", "crop"], "Extend Image Edges": ["frameScene", "expand"], "Clean ID Photo Background": ["idphoto", "brush"], "Formal Portrait Finish": ["suit", "sparkle"], "Passport Photo Polish": ["passport", "sparkle"], "Neutral Background Cleanup": ["idphoto", "eraser"], "Even Face Lighting": ["face", "bulb"], "Align Eye Line": ["eye", "ruler"], "Keep Original Glasses": ["glasses", "shield"], "Reduce Glasses Glare": ["faceGlasses", "flare"], "Natural Professional Retouch": ["suit", "brush"], "Clean Clothing Edges": ["suit", "scissors"], "Refine Collar & Tie": ["tie", "sparkle"], "Improve ID Photo Clarity": ["idphoto", "magnifier"], "Consistent Dual Portraits": ["twoFaces", "check"], "Soft Vintage Film Look": ["filmstrip", "sparkle"], "Black & White Portrait": ["faceBW", "contrast"], "Cinematic Color Grade": ["clapper", "palette"], "Warm Classic Portrait": ["faceWarm", "sun"], "Cool Modern Portrait": ["faceCool", "snow"], "Matte Finish": ["photoMatte", "check"], "Subtle Film Grain": ["filmstrip", "grain"], "High-Key Studio Look": ["faceHigh", "bulb"], "Low-Key Studio Look": ["faceLow", "moon"], "Soft Glow Finish": ["faceGlow", "sparkle"], "Rich Natural Colors": ["palette", "leaf"], "Minimalist Portrait Finish": ["frameScene", "faceSmile"]};


function Composite({ main, sub }: { main: string; sub?: string }) {
  const M = P[main];
  const S = sub ? P[sub] : undefined;
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" style={{ overflow: "visible" }}>
      {SHARED}
      <g transform="translate(1 1) scale(.86)">{M ? M() : null}</g>
      {S && (<>
        <circle cx="37" cy="37" r="11.5" fill="#fff" stroke="#e2e8f0" strokeWidth="1" style={{ filter: "drop-shadow(0 1px 2px rgba(15,23,42,.35))" }} />
        <g transform="translate(26.5 26.5) scale(.44)">{S()}</g>
      </>)}
    </svg>
  );
}

export default function GuideIcon({ label, size = 32 }: { label: string; size?: number | string }) {
  const hero = ART[label];
  const spec = SPEC[label];
  return (
    <span aria-hidden="true" style={{ width: size, height: size, display: "inline-block", filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,.25))" }}>
      {hero ? hero() : spec ? <Composite main={spec[0]} sub={spec[1]} /> : <Composite main="sparkle" />}
    </span>
  );
}
