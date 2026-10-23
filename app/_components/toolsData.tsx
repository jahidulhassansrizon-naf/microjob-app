"use client";
import { T, useI18n } from "@/components/i18n/I18nProvider";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// ====================================================================
//  Shared tools data — এই একটা ফাইল বদলালেই Home (/dashboard) এবং
//  /sohoj-tools দুই পেজেই টুল, আইকন, নাম, রঙ ও ব্যাজ বদলে যাবে।
// ====================================================================
/* ------------------------------------------------------------------ */
/* Semantic mini-illustrations: each icon depicts the tool's action.   */
/* Shared by Dashboard Popular Tools and the full SohojTools catalogue. */
/* ------------------------------------------------------------------ */
type IconProps = {
  size?: number;
  className?: string;
};

const W = "#FFFFFF";
const SOFT = "rgba(255,255,255,0.78)";
const FAINT = "rgba(255,255,255,0.32)";
const INK = "#334155";
const AMB = "#FFD166";
const GREEN = "#22C55E";
const RED = "#EF4444";
const DOC = "M13 7.5h15l8 8V39a2.5 2.5 0 0 1-2.5 2.5h-18A2.5 2.5 0 0 1 13 39z";
const FOLD = "M28 7.5v6a2 2 0 0 0 2 2h6";

const Svg = ({ size = 42, className, children }: IconProps & { children?: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true" focusable="false">
    {children}
  </svg>
);

const Line = ({ x, y, width, color = INK, thickness = 2.2 }: { x: number; y: number; width: number; color?: string; thickness?: number }) => (
  <path d={`M${x} ${y}h${width}`} stroke={color} strokeWidth={thickness} strokeLinecap="round" />
);

const Pencil = ({ x = 34, y = 32, rotate = 42, size = 1 }: { x?: number; y?: number; rotate?: number; size?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size})`}>
    <rect x="-3.3" y="-13" width="6.6" height="17" rx="1.6" fill={AMB} stroke={INK} strokeWidth="0.8" />
    <path d="M-3.3 3.5h6.6L0 10z" fill={W} stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
    <path d="M-1.2 7.5 0 10l1.2-2.5z" fill={INK} />
  </g>
);

const CheckBadge = ({ cx = 38, cy = 37, r = 7 }: { cx?: number; cy?: number; r?: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={AMB} stroke={W} strokeWidth="1.5" />
    <path d={`M${cx - r * 0.48} ${cy}l${r * 0.3} ${r * 0.32}l${r * 0.58} ${-r * 0.68}`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const MiniPage = ({ x = 10, y = 6, w = 24, h = 34, label }: { x?: number; y?: number; w?: number; h?: number; label?: string }) => (
  <g>
    <path d={`M${x + 2} ${y}h${w - 8}l6 6v${h - 8}a2 2 0 0 1-2 2H${x + 2}a2 2 0 0 1-2-2V${y + 2}a2 2 0 0 1 2-2z`} fill={W} stroke="rgba(15,23,42,0.18)" strokeWidth="0.6" strokeLinejoin="round" />
    <path d={`M${x + w - 6} ${y}v5a1 1 0 0 0 1 1h5`} fill={SOFT} />
    {label ? <text x={x + w / 2} y={y + h * 0.72} fontSize="5.5" fontWeight="800" textAnchor="middle" fill={RED}>{label}</text> : <g>
      <Line x={x + 5} y={y + 13} width={Math.max(5, w - 12)} thickness={1.5} />
      <Line x={x + 5} y={y + 18} width={Math.max(4, w - 15)} thickness={1.5} />
      <Line x={x + 5} y={y + 23} width={Math.max(5, w - 12)} thickness={1.5} />
    </g>}
  </g>
);

const PhotoThumb = ({ x = 8, y = 10, w = 30, h = 26, faded = false }: { x?: number; y?: number; w?: number; h?: number; faded?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="4" fill={faded ? SOFT : W} stroke="rgba(15,23,42,0.16)" strokeWidth="0.7" />
    <circle cx={x + w * 0.72} cy={y + h * 0.28} r={Math.max(2, w * 0.075)} fill={AMB} />
    <path d={`M${x + 3} ${y + h - 4}l${w * 0.25} ${-h * 0.34}l${w * 0.18} ${h * 0.18}l${w * 0.2} ${-h * 0.26}l${w * 0.25} ${h * 0.32}z`} fill="#57B8D5" />
  </g>
);

const NidJoinerIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="8" width="24" height="29" rx="3.5" fill={SOFT} transform="rotate(-8 17 22.5)" />
    <rect x="13" y="13" width="29" height="29" rx="4" fill={W} stroke="rgba(15,23,42,0.18)" strokeWidth="0.7" />
    <circle cx="22" cy="23" r="4" fill={INK} />
    <path d="M16 33c.6-4 2.8-5.8 6-5.8s5.4 1.8 6 5.8z" fill={INK} />
    <Line x={30} y={22} width={7} /> <Line x={30} y={27} width={5} />
    <circle cx="37" cy="11" r="7" fill={AMB} stroke={W} strokeWidth="1.4" />
    <path d="M33.8 11h6.4M37 7.8v6.4" stroke={INK} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const NidCorrectionIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="10" width="35" height="28" rx="4" fill={W} stroke="rgba(15,23,42,0.18)" strokeWidth="0.7" />
    <rect x="9" y="15" width="11" height="15" rx="2" fill="#DCE9F5" />
    <circle cx="14.5" cy="20" r="2.5" fill={INK} />
    <path d="M10.5 28c.3-2.7 1.8-4 4-4s3.7 1.3 4 4z" fill={INK} />
    <Line x={24} y={17} width={10} /> <Line x={24} y={22} width={8} /> <Line x={10} y={34} width={18} />
    <Pencil x={34} y={31} rotate={42} size={0.9} />
    <circle cx="38" cy="10" r="5.5" fill={AMB} stroke={W} strokeWidth="1.2" />
    <path d="M35.6 10h4.8M38 7.6v4.8" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const DocumentScannerIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="14" y="7" width="20" height="34" rx="3" fill={W} stroke="rgba(15,23,42,0.2)" strokeWidth="0.8" />
    <Line x={19} y={15} width={10} /> <Line x={19} y={20} width={10} /> <Line x={19} y={25} width={7} />
    <path d="M7 17v-5a3 3 0 0 1 3-3h5M33 9h3a3 3 0 0 1 3 3v5M39 31v5a3 3 0 0 1-3 3h-5M15 39h-5a3 3 0 0 1-3-3v-5" stroke={W} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 24h34" stroke={AMB} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M10 21.5h28" stroke={AMB} strokeWidth="1.2" opacity="0.7" />
  </Svg>
);

const PhotoSignIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="7" width="30" height="25" rx="4" fill={W} stroke="rgba(15,23,42,0.18)" strokeWidth="0.7" />
    <circle cx="19" cy="15" r="4" fill={INK} />
    <path d="M11 28c.7-5.5 3.7-8 8-8s7.3 2.5 8 8z" fill={INK} />
    <rect x="8" y="34" width="28" height="8" rx="2.5" fill={SOFT} />
    <path d="M11 39c2-5 3 .5 5-1.8s3 .6 5-1.4 3 .5 5-1.3" stroke={W} strokeWidth="1.6" strokeLinecap="round" />
    <Pencil x={36} y={29} rotate={42} size={0.82} />
    <path d="M5 11V8a2 2 0 0 1 2-2h3M31 6h3a2 2 0 0 1 2 2v3" stroke={AMB} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const RemoveBackgroundIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="7" width="34" height="34" rx="5" fill={FAINT} stroke={W} strokeWidth="1.2" />
    {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => (r + c) % 2 === 0 ? <rect key={`${r}-${c}`} x={9 + c * 8} y={9 + r * 8} width="8" height="8" fill={SOFT} /> : null))}
    <circle cx="24" cy="19" r="6" fill={W} stroke={INK} strokeWidth="0.8" />
    <path d="M12 38c.6-8 5-12 12-12s11.4 4 12 12z" fill={W} stroke={INK} strokeWidth="0.8" />
    <path d="M8 14V10a2 2 0 0 1 2-2h4M34 8h4a2 2 0 0 1 2 2v4M40 34v4a2 2 0 0 1-2 2h-4" stroke={AMB} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="39" cy="9" r="5.5" fill={AMB} stroke={W} strokeWidth="1" />
    <path d="M36.5 9h5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const LockUnlockPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={6} y={5} w={27} h={38} label="PDF" />
    <rect x="23" y="25" width="19" height="16" rx="3.5" fill={AMB} stroke={W} strokeWidth="1.4" />
    <path d="M27 25v-4.5a5.5 5.5 0 0 1 11 0V24" stroke={W} strokeWidth="3.2" strokeLinecap="round" />
    <circle cx="32.5" cy="32" r="1.8" fill={INK} />
    <path d="M32.5 33.7v3.2" stroke={INK} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const PdfToImageIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={3} y={8} w={20} h={31} label="PDF" />
    <path d="M21 23h7m-3.5-3.5L28 23l-3.5 3.5" stroke={AMB} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <PhotoThumb x={28} y={12} w={17} h={25} />
  </Svg>
);

const CompressPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={13} y={6} w={23} h={36} label="PDF" />
    <path d="M3.5 24h9m-4-4 4 4-4 4M44.5 24h-9m4-4-4 4 4 4" stroke={AMB} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 12h9" stroke={RED} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const MergePdfsIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={3} y={5} w={17} h={25} />
    <MiniPage x={3} y={25} w={17} h={20} />
    <path d="M18 19h7m-3.5-3.5L25 19l-3.5 3.5M18 34h7m-3.5-3.5L25 34l-3.5 3.5" stroke={AMB} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <MiniPage x={25} y={8} w={21} h={34} label="PDF" />
  </Svg>
);

const ImageSizeReducerIcon = (p: IconProps) => (
  <Svg {...p}>
    <PhotoThumb x={6} y={7} w={36} h={32} />
    <path d="M8 8v7M8 8h7M40 8h-7M40 8v7M8 38v-6M8 38h7M40 38h-7M40 38v-6" stroke={AMB} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="36" cy="35" r="7.8" fill={AMB} stroke={W} strokeWidth="1.2" />
    <path d="M32.5 32.5h3v-3M39.5 37.5h-3v3M32.5 32.5l-2-2M39.5 37.5l2 2" stroke={INK} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ImageUpscalerIcon = (p: IconProps) => (
  <Svg {...p}>
    <PhotoThumb x={5} y={17} w={22} h={22} faded />
    <path d="M25 12h11m-4-4 4 4-4 4" stroke={AMB} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <PhotoThumb x={24} y={17} w={20} h={25} />
    <path d="M36 7v7m-3.5-3.5L36 7l3.5 3.5" stroke={W} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 8l1.5-3 1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5z" fill={AMB} />
  </Svg>
);

const AtsCvIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={8} y={5} w={27} h={38} />
    <circle cx="18" cy="16" r="3.3" fill="#93C5FD" stroke={INK} strokeWidth="0.6" />
    <path d="M13.5 24c.5-3 2-4.2 4.5-4.2s4 1.2 4.5 4.2z" fill="#93C5FD" />
    <Line x={24} y={15} width={7} /> <Line x={24} y={20} width={6} /> <Line x={13} y={29} width={17} /> <Line x={13} y={34} width={12} />
    <CheckBadge cx={37} cy={35} r={7.5} />
  </Svg>
);

const FamilyCardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="9" width="38" height="30" rx="4.5" fill={W} stroke="rgba(15,23,42,0.16)" strokeWidth="0.8" />
    <circle cx="16" cy="19" r="4" fill="#93C5FD" stroke={INK} strokeWidth="0.6" />
    <circle cx="31.5" cy="19" r="4" fill="#F9A8D4" stroke={INK} strokeWidth="0.6" />
    <circle cx="24" cy="26" r="3.5" fill={AMB} stroke={INK} strokeWidth="0.5" />
    <path d="M9.5 32c.4-4.4 2.5-6.5 6.5-6.5 2 0 3.2.6 4.2 2M38 32c-.4-4.4-2.5-6.5-6.5-6.5-2 0-3.2.6-4.2 2M18.5 35c.4-4 2-5.8 5.5-5.8s5.1 1.8 5.5 5.8z" fill={INK} />
  </Svg>
);

const VoterMigrationIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={5} y={5} w={25} h={38} />
    <path d="M11 15h11m-11 5h8m-8 5h5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M24 31h6m-3-3 3 3-3 3" stroke={AMB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M36 20c-5 0-8 3.7-8 8.1C28 34.3 36 41 36 41s8-6.7 8-12.9C44 23.7 41 20 36 20z" fill={AMB} stroke={W} strokeWidth="1.2" />
    <circle cx="36" cy="28" r="2.8" fill={INK} />
  </Svg>
);

const VoterRegistrationIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={8} y={5} w={28} h={39} />
    {[15, 22, 29].map((y) => <g key={y}><rect x="13" y={y - 2.2} width="5" height="5" rx="1" fill={SOFT} stroke={INK} strokeWidth="0.8" /><Line x={21} y={y} width={9} /></g>)}
    <circle cx="37" cy="36" r="8" fill={AMB} stroke={W} strokeWidth="1.2" />
    <path d="M33 36l2.5 2.5 5-5.5" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PassportJoinerIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="11" width="18" height="27" rx="3" fill={SOFT} transform="rotate(-8 13 24.5)" />
    <rect x="11" y="7" width="24" height="34" rx="3.5" fill={W} stroke="rgba(15,23,42,0.18)" strokeWidth="0.8" />
    <circle cx="23" cy="20" r="7" stroke={INK} strokeWidth="1.3" />
    <ellipse cx="23" cy="20" rx="3" ry="7" stroke={INK} strokeWidth="1" />
    <path d="M16 20h14M17 31h12" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="39" cy="36" r="7.5" fill={AMB} stroke={W} strokeWidth="1.2" />
    <path d="M35 36h8m-4-4v8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const CropImageIcon = (p: IconProps) => (
  <Svg {...p}>
    <PhotoThumb x={12} y={12} w={25} h={25} />
    <path d="M15 5H8a3 3 0 0 0-3 3v7M33 5h7a3 3 0 0 1 3 3v7M5 33v7a3 3 0 0 0 3 3h7M43 33v7a3 3 0 0 1-3 3h-7" stroke={W} strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 15h18v18H15z" stroke={AMB} strokeWidth="1.8" strokeDasharray="3 2" />
  </Svg>
);

const AgeCalculatorIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="9" width="34" height="32" rx="4.5" fill={W} stroke="rgba(15,23,42,0.17)" strokeWidth="0.8" />
    <path d="M7 17h34" stroke={AMB} strokeWidth="4" />
    <path d="M15 5v8M33 5v8" stroke={W} strokeWidth="3" strokeLinecap="round" />
    <text x="24" y="31" fontSize="12" fontWeight="900" textAnchor="middle" fill={INK}>AGE</text>
    <path d="M17 36h14" stroke="#E879F9" strokeWidth="2.4" strokeLinecap="round" />
  </Svg>
);

const ReduceVideoIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="8" width="38" height="27" rx="4.5" fill={W} stroke="rgba(15,23,42,0.17)" strokeWidth="0.8" />
    <path d="M21 15v13l11-6.5z" fill={INK} />
    <path d="M5 21H13m-4-3 4 3-4 3M43 21h-8m4-3-4 3 4 3" stroke={AMB} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="12" y="39" width="24" height="3" rx="1.5" fill={SOFT} />
    <path d="M18 38v5m12-5v5" stroke={W} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const ChangeSpeedIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 34a17 17 0 1 1 34 0" stroke={W} strokeWidth="4" strokeLinecap="round" />
    <path d="M24 34l10-12" stroke={AMB} strokeWidth="3.3" strokeLinecap="round" />
    <circle cx="24" cy="34" r="3.5" fill={AMB} stroke={W} strokeWidth="1" />
    <rect x="14" y="37" width="20" height="8" rx="3" fill={W} />
    <text x="24" y="43" fontSize="6.5" fontWeight="900" textAnchor="middle" fill={INK}>1×</text>
  </Svg>
);

const AddWatermarkIcon = (p: IconProps) => (
  <Svg {...p}>
    <PhotoThumb x={5} y={9} w={37} h={31} />
    <rect x="8" y="26" width="31" height="9" rx="2.5" fill={INK} opacity="0.72" />
    <text x="23.5" y="34" fontSize="12" fontWeight="900" textAnchor="middle" fill={W}>©</text>
    <path d="M36 8l2-3 2 3 3 2-3 2-2 3-2-3-3-2z" fill={AMB} />
  </Svg>
);

const ImagesToPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <PhotoThumb x={3} y={7} w={19} h={17} />
    <PhotoThumb x={3} y={26} w={19} h={17} faded />
    <path d="M20 24h7m-3.5-3.5L27 24l-3.5 3.5" stroke={AMB} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <MiniPage x={26} y={7} w={20} h={36} label="PDF" />
  </Svg>
);

const ImageConvertIcon = (p: IconProps) => (
  <Svg {...p}>
    <PhotoThumb x={4} y={12} w={20} h={24} />
    <path d="M21 19h7m-3.5-3.5L28 19l-3.5 3.5M27 29h-7m3.5-3.5L20 29l3.5 3.5" stroke={AMB} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    <PhotoThumb x={28} y={12} w={16} h={24} faded />
    <rect x="7" y="37" width="15" height="7" rx="2" fill={W} />
    <text x="14.5" y="42.2" fontSize="5.5" fontWeight="900" textAnchor="middle" fill={INK}>JPG</text>
    <rect x="29" y="37" width="15" height="7" rx="2" fill={AMB} />
    <text x="36.5" y="42.2" fontSize="5.5" fontWeight="900" textAnchor="middle" fill={INK}>PNG</text>
  </Svg>
);

const ImageToTextIcon = (p: IconProps) => (
  <Svg {...p}>
    <PhotoThumb x={3} y={10} w={19} h={26} />
    <path d="M5 23h15" stroke={AMB} strokeWidth="2.8" strokeLinecap="round" />
    <path d="M21 24h6m-3-3 3 3-3 3" stroke={W} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="28" y="9" width="17" height="31" rx="3" fill={W} />
    <Line x={31} y={16} width={10} /> <Line x={31} y={21} width={12} /> <Line x={31} y={26} width={9} /> <Line x={31} y={31} width={11} /> <Line x={31} y={36} width={7} />
  </Svg>
);

const SplitPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={13} y={5} w={23} h={38} label="PDF" />
    <path d="M24 19v11M24 30l-8 7M24 30l8 7" stroke={AMB} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 13l5-5m-5 0v5h5M43 13l-5-5m5 0v5h-5" stroke={W} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={8} y={5} w={28} h={38} label="PDF" />
    <Pencil x={35} y={32} rotate={42} size={1.05} />
    <path d="M13 11h10" stroke={RED} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const BijoyUnicodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="9" width="17" height="28" rx="4" fill={W} />
    <rect x="28" y="9" width="17" height="28" rx="4" fill={W} />
    <text x="11.5" y="27" fontSize="15" fontWeight="800" textAnchor="middle" fill={INK} fontFamily="Noto Sans Bengali, sans-serif">ব</text>
    <text x="36.5" y="27" fontSize="15" fontWeight="800" textAnchor="middle" fill={INK} fontFamily="Noto Sans Bengali, sans-serif">অ</text>
    <path d="M18 16h11m-4-4 4 4-4 4M30 31H19m4-4-4 4 4 4" stroke={AMB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BanglishTypingIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="18" width="40" height="25" rx="4.5" fill={W} />
    {[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={8 + i * 6.5} y="22" width="4.5" height="4.5" rx="1" fill={INK} /><rect x={10 + i * 6.5} y="29" width="4.5" height="4.5" rx="1" fill={INK} /></g>)}
    <rect x="25" y="3" width="19" height="15" rx="4" fill={AMB} stroke={W} strokeWidth="1" />
    <path d="M31 17.5l-2 4 6-4" fill={AMB} />
    <text x="34.5" y="14" fontSize="10" fontWeight="900" textAnchor="middle" fill={INK} fontFamily="Noto Sans Bengali, sans-serif">অ</text>
  </Svg>
);

const SpecialInfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <MiniPage x={7} y={5} w={27} h={38} />
    <Line x={13} y={16} width={12} /> <Line x={13} y={21} width={10} /> <Line x={13} y={26} width={12} />
    <circle cx="35" cy="34" r="9" fill={AMB} stroke={W} strokeWidth="1.4" />
    <circle cx="35" cy="29.5" r="1.3" fill={INK} />
    <path d="M35 32.5v6" stroke={INK} strokeWidth="2.3" strokeLinecap="round" />
  </Svg>
);

const FuelCardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="10" width="40" height="28" rx="5" fill={W} stroke="rgba(15,23,42,0.17)" strokeWidth="0.8" />
    <rect x="8" y="15" width="11" height="17" rx="2.5" fill={SOFT} />
    <path d="M13.5 17.5c3 4 4 5.8 4 8a4 4 0 0 1-8 0c0-2.2 1-4 4-8z" fill={AMB} />
    <Line x={23} y={18} width={14} /> <Line x={23} y={23} width={10} />
    <rect x="23" y="28" width="14" height="5" rx="2" fill={AMB} />
    <text x="30" y="32" fontSize="4.5" fontWeight="900" textAnchor="middle" fill={INK}>FUEL</text>
  </Svg>
);

export interface ToolItem {
    id: string;
    name: string;
    category: "PDF" | "Image" | "Text" | "Video" | "General" | "Educational";
    bgColor: string;
    icon: any;
    badge?: "New" | "Hot";
    /** Set to "paid" to require paid access. Omit this field to keep the tool free. */
    access?: "free" | "paid";
}
export const toolsData: ToolItem[] = [
    {
        id: "1",
        name: "Nid Joiner",
        category: "General",
        bgColor: "bg-[#22c55e]",
        icon: NidJoinerIcon,
        badge: "Hot",
    },
    {
        id: "28",
        name: "NID Information Correction Form",
        category: "General",
        bgColor: "bg-[#8b5cf6]",
        icon: NidCorrectionIcon,
        badge: "New",
    },
    {
        id: "11",
        name: "Document Scanner",
        access: "free",
        category: "General",
        bgColor: "bg-[#84cc16]",
        icon: DocumentScannerIcon,
        badge: "New",
    },
    {
        id: "2",
        name: "Govt Job Photo & Sign Resizer",
        access: "free",
        category: "Image",
        bgColor: "bg-[#7c3aed]",
        icon: PhotoSignIcon,
    },
    {
        id: "10",
        name: "Remove Background",
        access: "free",
        category: "Image",
        bgColor: "bg-[#16a34a]",
        icon: RemoveBackgroundIcon,
        badge: "Hot",
    },
    {
        id: "20",
        name: "Lock / Unlock PDF",
        access: "free",
        category: "PDF",
        bgColor: "bg-[#4338ca]",
        icon: LockUnlockPdfIcon,
    },
    {
        id: "21",
        name: "PDF to Image",
        access: "free",
        category: "PDF",
        bgColor: "bg-[#3b82f6]",
        icon: PdfToImageIcon,
    },
    {
        id: "17",
        name: "Compress PDF",
        access: "free",
        category: "PDF",
        bgColor: "bg-[#1cc2e6]",
        icon: CompressPdfIcon,
        badge: "Hot",
    },
    {
        id: "18",
        name: "Merge PDFs",
        access: "free",
        category: "PDF",
        bgColor: "bg-[#0eb2ed]",
        icon: MergePdfsIcon,
        badge: "Hot",
    },
    {
        id: "12",
        name: "Image Size Reducer",
        access: "free",
        category: "Image",
        bgColor: "bg-[#4ade80]",
        icon: ImageSizeReducerIcon,
        badge: "New",
    },
    {
        id: "27",
        name: "Image Upscaler",
        access: "free",
        category: "Image",
        bgColor: "bg-[#6366f1]",
        icon: ImageUpscalerIcon,
        badge: "New",
    },
    {
        id: "25",
        name: "ATS Friendly CV Maker",
        access: "free",
        category: "General",
        bgColor: "bg-[#2563eb]",
        icon: AtsCvIcon,
    },
    {
        id: "8",
        name: "Family Card Form",
        category: "General",
        bgColor: "bg-[#2563eb]",
        icon: FamilyCardIcon,
    },
    {
        id: "7",
        name: "Voter Migration Form",
        category: "General",
        bgColor: "bg-[#4f46e5]",
        icon: VoterMigrationIcon,
        badge: "New",
    },
    {
        id: "26",
        name: "Voter Registration Form",
        category: "General",
        bgColor: "bg-[#4f46e5]",
        icon: VoterRegistrationIcon,
    },
    {
        id: "6",
        name: "Passport Joiner",
        access: "free",
        category: "General",
        bgColor: "bg-[#10b981]",
        icon: PassportJoinerIcon,
        badge: "Hot",
    },
    {
        id: "13",
        name: "Crop Image",
        category: "Image",
        bgColor: "bg-[#0369a1]",
        icon: CropImageIcon,
    },
    {
        id: "5",
        name: "Age Calculator",
        category: "General",
        bgColor: "bg-[#db2777]",
        icon: AgeCalculatorIcon,
    },
    {
        id: "9",
        name: "Reduce Video File Size",
        access: "free",
        category: "General",
        bgColor: "bg-[#7c3aed]",
        icon: ReduceVideoIcon,
        badge: "New",
    },
    // Tools outside the requested priority list stay at the end.
    {
        id: "3",
        name: "Change Speed",
        access: "free",
        category: "Video",
        bgColor: "bg-[#10ca7e]",
        icon: ChangeSpeedIcon,
    },
    {
        id: "4",
        name: "Add Watermark",
        access: "free",
        category: "Video",
        bgColor: "bg-[#06b6d4]",
        icon: AddWatermarkIcon,
    },
    {
        id: "14",
        name: "Images to PDF",
        access: "free",
        category: "Image",
        bgColor: "bg-[#2563eb]",
        icon: ImagesToPdfIcon,
    },
    {
        id: "15",
        name: "Image Convert",
        access: "free",
        category: "Image",
        bgColor: "bg-[#a855f7]",
        icon: ImageConvertIcon,
        badge: "Hot",
    },
    {
        id: "16",
        name: "Image to Text",
        access: "free",
        category: "Text",
        bgColor: "bg-[#14b8a6]",
        icon: ImageToTextIcon,
        badge: "New",
    },
    {
        id: "19",
        name: "Split PDF",
        access: "free",
        category: "PDF",
        bgColor: "bg-[#2563eb]",
        icon: SplitPdfIcon,
    },
    {
        id: "22",
        name: "Edit PDF",
        access: "free",
        category: "PDF",
        bgColor: "bg-[#2563EB]",
        icon: EditPdfIcon,
        badge: "New",
    },
    {
        id: "23",
        name: "Bijoy - Unicode",
        access: "free",
        category: "Text",
        bgColor: "bg-[#a3e635]",
        icon: BijoyUnicodeIcon,
    },
    {
        id: "24",
        name: "Banglish Typing",
        category: "Text",
        bgColor: "bg-[#84cc16]",
        icon: BanglishTypingIcon,
    },
    {
        id: "29",
        name: "Special Information Form",
        category: "General",
        bgColor: "bg-[#0ea5e9]",
        icon: SpecialInfoIcon,
        badge: "New",
    },
    {
        id: "30",
        name: "Fuel Card Form",
        category: "General",
        bgColor: "bg-[#2563EB]",
        icon: FuelCardIcon,
        badge: "New",
    },
];
export const getSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
};
// NAFIA SUBSCRIPTION ACCESS SWITCH — SEARCH THIS COMMENT TO FIND IT QUICKLY
// false = paid badges stay visible, but paid tools can be opened directly (temporary admin/testing mode)
// true  = paid tool clicks go to /subscription
export const REQUIRE_SUBSCRIPTION = true;
export const isPaidTool = (tool: ToolItem) => tool.access === "paid";
/* ------------------------------------------------------------------ */
/*  Premium seal — paid টুলের উপরে সোনালি সিলমোহরের মতো ব্যাজ          */
/* ------------------------------------------------------------------ */
// কিনারা কাটা কাটা (scalloped) গোল আকার
const SEAL_CLIP = "polygon(50.00% 0.00%,57.04% 5.55%,65.45% 2.45%,70.43% 9.90%,79.39% 9.55%,81.82% 18.18%,90.45% 20.61%,90.10% 29.57%,97.55% 34.55%,94.45% 42.96%,100.00% 50.00%,94.45% 57.04%,97.55% 65.45%,90.10% 70.43%,90.45% 79.39%,81.82% 81.82%,79.39% 90.45%,70.43% 90.10%,65.45% 97.55%,57.04% 94.45%,50.00% 100.00%,42.96% 94.45%,34.55% 97.55%,29.57% 90.10%,20.61% 90.45%,18.18% 81.82%,9.55% 79.39%,9.90% 70.43%,2.45% 65.45%,5.55% 57.04%,0.00% 50.00%,5.55% 42.96%,2.45% 34.55%,9.90% 29.57%,9.55% 20.61%,18.18% 18.18%,20.61% 9.55%,29.57% 9.90%,34.55% 2.45%,42.96% 5.55%)";
const SEAL_INK = "#7A4803";
// চকমক (sparkle) তারা — ৪ কোণা
function SealSparkle({ className, delay, size, }: {
    className: string;
    delay: string;
    size: number;
}) {
    return (<svg viewBox="0 0 24 24" aria-hidden="true" width={size} height={size} className={`seal-twinkle pointer-events-none absolute ${className}`} style={{ animationDelay: delay }}>
      <path d="M12 0c.9 6.4 5.6 11.1 12 12-6.4.9-11.1 5.6-12 12-.9-6.4-5.6-11.1-12-12C6.4 11.1 11.1 6.4 12 0z" fill="#FFFBE0"/>
    </svg>);
}
function PremiumSeal({ compact = false }: { compact?: boolean }) {
    const { locale } = useI18n();
    return (<span title={locale === "bn" ? "পেইড টুল" : "Paid tool"} className={`absolute ${compact ? "right-1 top-1 h-7 w-7" : "right-3 top-3 h-9 w-9 sm:h-10 sm:w-10"}`} style={{
            // Compact dashboard tiles use a smaller seal tucked into the corner;
            // the full tools catalogue keeps its original size and placement.
            transform: "rotate(12deg)",
            filter: compact
                ? "drop-shadow(0 1px 2px rgba(88,50,0,0.4)) drop-shadow(0 0 3px rgba(255,214,90,0.45))"
                : "drop-shadow(0 3px 5px rgba(88,50,0,0.45)) drop-shadow(0 0 6px rgba(255,214,90,0.55))",
        }}>
      <style>{`
        @keyframes seal-shine {
          0%   { transform: translateX(0) skewX(-20deg); }
          55%, 100% { transform: translateX(300%) skewX(-20deg); }
        }
        @keyframes seal-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.2) rotate(0deg); }
          50%      { opacity: 1; transform: scale(1) rotate(45deg); }
        }
        @keyframes seal-glow {
          0%, 100% { opacity: 0; }
          50%      { opacity: 0.9; }
        }
        .seal-shine   { animation: seal-shine 2.8s ease-in-out infinite; }
        .seal-twinkle { animation: seal-twinkle 1.8s ease-in-out infinite; }
        .seal-glow    { animation: seal-glow 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .seal-shine, .seal-twinkle, .seal-glow { animation: none; }
        }
      `}</style>
      <span className="sr-only"><T>{"Paid"}</T></span>

      {/* বাইরের কাটা কিনারার সোনালি সিল */}
      <span aria-hidden="true" className="absolute inset-0" style={{
            clipPath: SEAL_CLIP,
            background: "linear-gradient(140deg, #FFF4BF 0%, #F7C84B 35%, #B97A0B 70%, #F3C550 100%)",
        }}/>

      {/* ভেতরের পাতলা রিং */}
      <span aria-hidden="true" className={`absolute ${compact ? "inset-[2.5px]" : "inset-[3.5px]"} rounded-full`} style={{
            background: "linear-gradient(320deg, #FFF1B0 0%, #E5A92A 50%, #A8680A 100%)",
        }}/>

      {/* সোনালি মুখ (সবসময় আলো চলে যায়) */}
      <span aria-hidden="true" className={`absolute ${compact ? "inset-[4px]" : "inset-[5.5px]"} overflow-hidden rounded-full`} style={{
            background: "radial-gradient(circle at 30% 25%, #FFE79A 0%, #F2BC3E 55%, #D8981A 100%)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.65), inset 0 -1px 1px rgba(120,70,0,0.35)",
        }}>
        <span className="seal-shine absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/80 to-transparent"/>
        <span className="seal-glow absolute inset-0 rounded-full" style={{
            background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.32), transparent 60%)",
        }}/>
      </span>

      {/* খোদাই করা মুকুট */}
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`absolute left-1/2 top-1/2 ${compact ? "h-3.5 w-3.5" : "h-[17px] w-[17px] sm:h-5 sm:w-5"} -translate-x-1/2 -translate-y-1/2`} style={{ filter: "drop-shadow(0 0.75px 0 rgba(255,244,190,0.75))" }}>
        <path d="M4.2 17.4 3 8.6l5 3.9L12 5.8l4 6.7 5-3.9-1.2 8.8z" fill={SEAL_INK}/>
        <rect x="4.6" y="18.9" width="14.8" height="2.3" rx="1.1" fill={SEAL_INK}/>
        <circle cx="3" cy="8.2" r="1.35" fill={SEAL_INK}/>
        <circle cx="12" cy="5.4" r="1.35" fill={SEAL_INK}/>
        <circle cx="21" cy="8.2" r="1.35" fill={SEAL_INK}/>
      </svg>

      {/* চারপাশে চকমক তারা */}
      <SealSparkle className={compact ? "-left-0.5 -top-0.5" : "-left-1.5 -top-1.5"} size={compact ? 6 : 10} delay="0s"/>
      <SealSparkle className={compact ? "-bottom-0.5 -right-0.5" : "-bottom-1 -right-1.5"} size={compact ? 5 : 9} delay="0.7s"/>
      <SealSparkle className={compact ? "-bottom-0.5 left-0.5" : "-bottom-1.5 left-0"} size={compact ? 4 : 7} delay="1.3s"/>
    </span>);
}
/* ------------------------------------------------------------------ */
/*  FREE seal — ফ্রি টুলের জন্য স্পষ্ট, প্রিমিয়াম স্ট্যাম্প ব্যাজ          */
/* ------------------------------------------------------------------ */
function FreeSeal({ compact = false }: { compact?: boolean }) {
    const { locale } = useI18n();
    return (<span
      title={locale === "bn" ? "ফ্রি টুল" : "Free tool"}
      className={`absolute z-10 ${compact ? "right-1 top-1 h-8 w-8" : "right-2 top-2 h-10 w-10 sm:h-11 sm:w-11"}`}
      style={{
        transform: "rotate(9deg)",
        filter: compact
          ? "drop-shadow(0 1px 2px rgba(4,75,49,0.45)) drop-shadow(0 0 3px rgba(110,255,190,0.35))"
          : "drop-shadow(0 2px 3px rgba(4,75,49,0.45)) drop-shadow(0 0 5px rgba(110,255,190,0.38))",
      }}>
      <span aria-hidden="true" className="absolute inset-0" style={{
        clipPath: SEAL_CLIP,
        background: "linear-gradient(145deg, #D1FAE5 0%, #34D399 27%, #047857 67%, #6EE7B7 100%)",
      }}/>
      <span aria-hidden="true" className={`absolute ${compact ? "inset-[2px]" : "inset-[2.5px]"} rounded-full`} style={{
        background: "linear-gradient(145deg, #065F46 0%, #10B981 55%, #064E3B 100%)",
      }}/>
      <span aria-hidden="true" className={`absolute ${compact ? "inset-[4px]" : "inset-[4.5px]"} flex items-center justify-center overflow-hidden rounded-full`} style={{
        background: "radial-gradient(circle at 30% 24%, #10B981 0%, #047857 54%, #064E3B 100%)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.48), inset 0 -1px 2px rgba(2,44,34,0.45)",
      }}>
        <span aria-hidden="true" className="absolute inset-0 z-[1] flex items-center justify-center whitespace-nowrap font-black uppercase text-white" style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: compact ? "7.6px" : "9.2px",
          letterSpacing: compact ? "-0.015em" : "0.005em",
          lineHeight: 1,
          fontWeight: 900,
          WebkitTextStroke: "0.28px #064E3B",
          textShadow: "0 1px 0 #064E3B, 0 0 2px rgba(0,30,20,0.9)",
        }}>FREE</span>
      </span>
      <span className="sr-only"><T>{"Free"}</T></span>
    </span>);
}

// একই টাইল ডিজাইন দুই পেজেই ব্যবহার হবে
// Subscription access is read once per browser session and cached for all tiles.
let subscriptionAccessPromise: Promise<boolean> | null = null;
let subscriptionAccessCache: boolean | null = null;
function loadSubscriptionAccess() {
    if (subscriptionAccessCache !== null) {
        return Promise.resolve(subscriptionAccessCache);
    }
    if (!subscriptionAccessPromise) {
        subscriptionAccessPromise = fetch("/api/subscription/current", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
        })
            .then(async (response) => {
            if (!response.ok)
                return false;
            const data = await response.json().catch(() => ({}));
            const subscription = data?.subscription;
            const expiresAt = subscription?.expiresAt
                ? new Date(subscription.expiresAt).getTime()
                : 0;
            const accessExpiresAt = data?.access?.expiresAt
                ? new Date(data.access.expiresAt).getTime()
                : 0;
            const manualOrCombinedAccess = data?.access?.granted === true &&
                accessExpiresAt > Date.now();
            const active = manualOrCombinedAccess || (subscription?.accessStatus === "ACTIVE" &&
                subscription?.paymentStatus === "COMPLETED" &&
                expiresAt > Date.now());
            return Boolean(active);
        })
            .catch((error) => {
            console.error("Failed to load subscription access:", error);
            return false;
        })
            .then((active) => {
            subscriptionAccessCache = active;
            return active;
        });
    }
    return subscriptionAccessPromise;
}
export function ToolTile({ tool, boxPercent, touchCompact = false, warm = false, }: {
    tool: ToolItem;
    // true: compact (small box) layout on touch devices and the full-size layout on desktop,
    // chosen purely by CSS (`fit:` = pointer: fine) so the server HTML already matches.
    touchCompact?: boolean;
    // দিলে শুধু রঙিন বক্স (আইকন) এই % এ ছোট হবে; নাম পুরো ঘরের চওড়া পাবে ও ছোট লেখায় দেখাবে
    boxPercent?: number;
    // Warm Sand + Red label styling (used by the Sohoj Tools page only; default keeps the old look)
    warm?: boolean;
}) {
    const compact = typeof boxPercent === "number";
    const router = useRouter();
    const { locale, t } = useI18n();
    const IconComponent = tool.icon;
    const slug = getSlug(tool.name);
    const displayName = t(tool.name);
    const badgeLabel = tool.badge === "Hot"
        ? (locale === "bn" ? "জনপ্রিয়" : "Hot")
        : tool.badge === "New"
            ? (locale === "bn" ? "নতুন" : "New")
            : "";

    const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(subscriptionAccessCache);
    useEffect(() => {
        let cancelled = false;
        loadSubscriptionAccess().then((active) => {
            if (!cancelled) {
                setHasActiveSubscription(active);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
    const isPaid = tool.access === "paid";
    const requiresSubscription = isPaid && REQUIRE_SUBSCRIPTION;
    // While subscription status is still being resolved, keep the real tool URL.
    // This lets the App Router prefetch/navigate immediately; the server-side paid
    // guard remains authoritative if access is actually unavailable.
    const toolHref = requiresSubscription && hasActiveSubscription === false
        ? "/subscription"
        : `/sohoj-tools/${slug}`;
    // Do not render the paid seal while subscription access is still being
    // resolved. This prevents a premium-user flash on a hard reload: the
    // subscription API is async, so the previous logic treated `null` (loading)
    // as "not subscribed" for the first paint.
    const showPaidSeal = isPaid && hasActiveSubscription !== null && hasActiveSubscription !== true;
    const accessibleLabel = requiresSubscription && hasActiveSubscription === false
        ? locale === "bn"
            ? `${displayName}-এর জন্য সক্রিয় সাবস্ক্রিপশন প্রয়োজন`
            : `${tool.name} requires an active subscription`
        : locale === "bn"
            ? `${displayName} খুলুন`
            : `Open ${tool.name}`;
    return (<Link href={toolHref} prefetch onMouseEnter={() => router.prefetch(`/sohoj-tools/${slug}`)} onFocus={() => router.prefetch(`/sohoj-tools/${slug}`)} className="flex w-full flex-col items-center group cursor-pointer" aria-label={accessibleLabel}>
      <div className={`relative aspect-square ${touchCompact ? "w-[88%] rounded-[22px] fit:w-full fit:rounded-[28px]" : compact ? "rounded-[22px]" : "w-full rounded-[28px]"} ${tool.bgColor} flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-xs overflow-hidden`} style={compact ? { width: `${boxPercent}%` } : undefined} data-tile-box={compact ? "" : undefined}>
        {tool.badge && (<span className={`absolute top-2.5 left-2.5 ${warm ? "text-[11px] font-bold px-2 py-0.5" : "text-[8px] font-black px-1.5 py-0.5"} uppercase text-white rounded-full shadow-xs ${tool.badge === "New" ? "bg-emerald-600" : "bg-red-500"}`}>
            {badgeLabel}
          </span>)}

        {/* The paid/premium seal disappears after an active subscription is detected. */}
        {showPaidSeal && <PremiumSeal compact={compact} />}

        {tool.access !== "paid" && <FreeSeal compact={compact} />}

        {IconComponent && (<IconComponent size={compact ? 52 : 72} className={`text-[#ffffff] stroke-[1.75]${touchCompact ? " h-[52px]! w-[52px]! fit:h-[72px]! fit:w-[72px]!" : ""}`}/>)}
      </div>

      <span className={`text-center transition-colors ${warm ? "group-hover:text-[#DC2626]" : "group-hover:text-[#2563EB]"} ${warm && touchCompact
            ? "mt-2 w-full px-1 text-[13px] font-medium leading-[1.35] tracking-[0.01em] text-[#5A4A32] line-clamp-2 fit:mt-2.5 fit:w-auto fit:px-0 fit:text-[16px] fit:font-medium fit:leading-normal fit:tracking-normal fit:text-[#3B2F1E] fit:line-clamp-1"
            : touchCompact
            ? "mt-2 w-full px-1 text-[11px] font-medium leading-[1.3] tracking-[0.01em] text-slate-700 line-clamp-2 fit:mt-2.5 fit:w-auto fit:px-0 fit:text-[15px] fit:font-medium fit:leading-normal fit:tracking-normal fit:text-[#0F172A] fit:line-clamp-1"
            : compact
            ? "mt-2 w-full px-1 text-[13px] font-medium leading-[1.35] tracking-[0.01em] text-slate-700 line-clamp-2 fit:mt-2.5 fit:w-auto fit:px-0 fit:text-[16px] fit:leading-normal fit:tracking-normal fit:line-clamp-1"
            : "mt-2.5 text-[15px] font-medium text-[#0F172A] line-clamp-1"}`}>
        {displayName}
      </span>
    </Link>);
}
