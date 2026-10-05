"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ====================================================================
//  Shared tools data — এই একটা ফাইল বদলালেই Home (/dashboard) এবং
//  /sohoj-tools দুই পেজেই টুল, আইকন, নাম, রঙ ও ব্যাজ বদলে যাবে।
// ====================================================================

/* ------------------------------------------------------------------ */
/*  Custom hand-drawn tool icons (48×48 grid, layered white + amber)   */
/* ------------------------------------------------------------------ */
type IconProps = { size?: number; className?: string };

const W = "#ffffff";
const SOFT = "rgba(255,255,255,0.55)";
const FAINT = "rgba(255,255,255,0.25)";
const INK = "rgba(15,23,42,0.32)";
const FOLDC = "rgba(15,23,42,0.18)";
const AMB = "#FFC94D";

const DOC = "M13 11a3 3 0 0 1 3-3h10l9 9v20a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3z";
const FOLD = "M26 8v6a3 3 0 0 0 3 3h6z";

const Svg = ({
  size = 42,
  className,
  children,
}: IconProps & { children?: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Spark = ({
  cx,
  cy,
  r,
  fill = AMB,
}: {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
}) => {
  const k = r * 0.28;
  const pts = [
    [cx, cy - r],
    [cx + k, cy - k],
    [cx + r, cy],
    [cx + k, cy + k],
    [cx, cy + r],
    [cx - k, cy + k],
    [cx - r, cy],
    [cx - k, cy - k],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return <polygon points={pts} fill={fill} strokeLinejoin="round" />;
};

const Pencil = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect
      x="-3"
      y="-13"
      width="6"
      height="17"
      rx="1.5"
      fill={AMB}
      stroke="rgba(15,23,42,0.18)"
      strokeWidth="1"
    />
    <rect x="-3" y="-13" width="6" height="4" rx="1.5" fill="#FFE6A3" />
    <path
      d="M-3 4h6l-3 6z"
      fill="#FFF4D6"
      stroke="rgba(15,23,42,0.18)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path d="M-1.100 8l1.100 2 1.100-2z" fill="#334155" />
  </g>
);

const shrinkBadge = (cx: number, cy: number, r: number) => (
  <>
    <circle cx={cx} cy={cy} r={r} fill={AMB} />
    <path
      d={`M${cx - 3.5} ${cy + 0.5}h3v3M${cx + 3.5} ${cy - 0.5}h-3v-3M${cx - 0.5} ${cy + 0.5}l-3.500 3.500M${cx + 0.5} ${cy - 0.5}l3.500-3.500`}
      stroke={W}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
);

const NidJoinerIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect
      x="5"
      y="9"
      width="28"
      height="19"
      rx="4"
      fill={SOFT}
      transform="rotate(-8 19 18)"
    />
    <rect x="13" y="20" width="30" height="20" rx="4" fill={W} />
    <circle cx="21.500" cy="28.500" r="3.200" fill={INK} />
    <path d="M16 36c.8-3 3-4.400 5.500-4.400S26.200 33 27 36z" fill={INK} />
    <rect x="30" y="26" width="9" height="2.400" rx="1.200" fill={INK} />
    <rect x="30" y="31" width="6" height="2.400" rx="1.200" fill={INK} />
    <circle cx="37" cy="12" r="6" fill={AMB} />
    <path
      d="M34.500 12h5M37 9.500v5"
      stroke={W}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const NidCorrectionIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="12" width="33" height="23" rx="4.500" fill={W} />
    <rect x="9.500" y="17" width="9" height="11" rx="2" fill={INK} />
    <circle cx="14" cy="21.500" r="2.200" fill={W} />
    <path
      d="M10.500 28c.5-2.500 1.800-3.600 3.500-3.600s3 1.100 3.500 3.600z"
      fill={W}
    />
    <rect x="22" y="17.500" width="12" height="2.400" rx="1.200" fill={INK} />
    <rect x="22" y="22.500" width="9" height="2.400" rx="1.200" fill={INK} />
    <rect x="9.500" y="30.500" width="16" height="2" rx="1" fill={INK} />
    <Pencil x={37} y={32} r={45} />
  </Svg>
);

const DocumentScannerIcon = (p: IconProps) => (
  <Svg {...p}>
    <g
      stroke={W}
      strokeWidth="3.500"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 17v-5a3 3 0 0 1 3-3h5" />
      <path d="M31 9h5a3 3 0 0 1 3 3v5" />
      <path d="M39 31v5a3 3 0 0 1-3 3h-5" />
      <path d="M17 39h-5a3 3 0 0 1-3-3v-5" />
    </g>
    <rect x="16" y="14" width="16" height="20" rx="2.500" fill={W} />
    <rect x="19.500" y="18" width="9" height="2" rx="1" fill={INK} />
    <rect x="19.500" y="22.500" width="9" height="2" rx="1" fill={INK} />
    <rect x="19.500" y="27" width="5.500" height="2" rx="1" fill={INK} />
    <rect x="8" y="22.500" width="32" height="3.200" rx="1.600" fill={AMB} />
    <rect
      x="8"
      y="22.500"
      width="32"
      height="3.200"
      rx="1.600"
      fill={AMB}
      opacity="0.35"
      transform="translate(0 -2)"
    />
  </Svg>
);

const PhotoSignIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="7" width="26" height="22" rx="4.500" fill={W} />
    <circle cx="20" cy="15.500" r="3.500" fill={INK} />
    <path d="M13 29c.8-4.200 3.500-6.200 7-6.200s6.200 2 7 6.200z" fill={INK} />
    <rect x="7" y="33" width="26" height="8" rx="3" fill={SOFT} />
    <path
      d="M11 38c1.800-4 3 .5 4.800-1.800s2.200 2.800 4 .3 3 1.200 5-1.300"
      stroke={W}
      strokeWidth="1.800"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="37" cy="31" r="7" fill={AMB} />
    <path
      d="M34 34l6-6M36.500 28H40v3.500M34 30.500V34h3.500"
      stroke={W}
      strokeWidth="1.800"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RemoveBackgroundIcon = (p: IconProps) => (
  <Svg {...p}>
    <defs>
      <clipPath id="sk-rb-clip">
        <rect x="8" y="8" width="32" height="32" rx="7" />
      </clipPath>
    </defs>
    <g clipPath="url(#sk-rb-clip)">
      <rect x="8" y="8" width="32" height="32" fill="rgba(255,255,255,0.12)" />
      {[0, 1, 2, 3].flatMap((r) =>
        [0, 1, 2, 3].map(
          (c) =>
            (r + c) % 2 === 0 && (
              <rect
                key={`${r}-${c}`}
                x={8 + c * 8}
                y={8 + r * 8}
                width="8"
                height="8"
                fill={FAINT}
              />
            ),
        ),
      )}
      <circle cx="24" cy="20" r="6" fill={W} />
      <path d="M11 42c0-8.500 5.500-13 13-13s13 4.500 13 13z" fill={W} />
    </g>
    <rect
      x="8"
      y="8"
      width="32"
      height="32"
      rx="7"
      stroke={W}
      strokeWidth="1.600"
      strokeDasharray="3 3"
    />
    <Spark cx={38} cy={10} r={6} />
  </Svg>
);

const LockUnlockPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={DOC} fill={W} />
    <path d={FOLD} fill={FOLDC} />
    <rect x="17" y="20" width="10" height="2" rx="1" fill={INK} />
    <rect x="17" y="25" width="7" height="2" rx="1" fill={INK} />
    <path
      d="M27.500 27v-3.500a4.500 4.500 0 0 1 9 0V27"
      stroke={AMB}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <rect
      x="24"
      y="27"
      width="16"
      height="13"
      rx="3.500"
      fill={AMB}
      stroke="rgba(15,23,42,0.15)"
      strokeWidth="1"
    />
    <circle cx="32" cy="32.500" r="1.900" fill="#334155" />
    <rect
      x="31.200"
      y="33"
      width="1.600"
      height="3.500"
      rx="0.800"
      fill="#334155"
    />
  </Svg>
);

const PdfToImageIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M5 14a2.500 2.500 0 0 1 2.500-2.500H14l5 5v15.500a2.500 2.500 0 0 1-2.500 2.500h-9A2.500 2.500 0 0 1 5 32z"
      fill={W}
    />
    <path d="M14 11.500v3.500a1.500 1.500 0 0 0 1.500 1.500H19z" fill={FOLDC} />
    <rect x="8.500" y="21" width="7" height="1.800" rx="0.900" fill={INK} />
    <rect x="8.500" y="25" width="7" height="1.800" rx="0.900" fill={INK} />
    <rect x="8.500" y="29" width="4" height="1.800" rx="0.900" fill={INK} />
    <path
      d="M21 23h5M23.500 19.500 27 23l-3.500 3.500"
      stroke={AMB}
      strokeWidth="2.400"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="29" y="14" width="15" height="18" rx="3.500" fill={W} />
    <path d="M30.500 30l4.500-6 3 3.500 2-2 3.500 4.500z" fill={INK} />
    <circle cx="39" cy="19.500" r="1.800" fill={AMB} />
  </Svg>
);

const CompressPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M15 11a3 3 0 0 1 3-3h8l7 7v22a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3z"
      fill={W}
    />
    <path d="M26 8v4.500a2.500 2.500 0 0 0 2.500 2.500H33z" fill={FOLDC} />
    <rect x="19" y="21" width="10" height="2" rx="1" fill={INK} />
    <rect x="19" y="26" width="10" height="2" rx="1" fill={INK} />
    <rect x="19" y="31" width="6" height="2" rx="1" fill={INK} />
    <g
      stroke={AMB}
      strokeWidth="2.600"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.500 24h6.500M7 20.500 10.500 24 7 27.500" />
      <path d="M44.500 24H38M41 20.500 37.500 24 41 27.500" />
    </g>
  </Svg>
);

const MergePdfsIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="8" width="13" height="15" rx="3" fill={W} />
    <rect x="8" y="12.500" width="7" height="1.800" rx="0.900" fill={INK} />
    <rect x="8" y="16.500" width="5" height="1.800" rx="0.900" fill={INK} />
    <rect x="5" y="26" width="13" height="15" rx="3" fill={SOFT} />
    <rect x="8" y="30.500" width="7" height="1.800" rx="0.900" fill={W} />
    <rect x="8" y="34.500" width="5" height="1.800" rx="0.900" fill={W} />
    <path
      d="M19 15.500c5.500 0 4 8.500 8 8.500M19 33.500c5.500 0 4-9.500 8-9.500"
      stroke={AMB}
      strokeWidth="2.400"
      strokeLinecap="round"
    />
    <path
      d="M32 9a3 3 0 0 1 3-3h4l5 5v27a3 3 0 0 1-3 3H35a3 3 0 0 1-3-3z"
      transform="translate(-5 2)"
      fill={W}
    />
    <rect x="30" y="18" width="8" height="2" rx="1" fill={INK} />
    <rect x="30" y="23" width="8" height="2" rx="1" fill={INK} />
    <rect x="30" y="28" width="5" height="2" rx="1" fill={INK} />
  </Svg>
);

const ImageSizeReducerIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="7" width="36" height="32" rx="6" fill={W} />
    <circle cx="16.500" cy="16.500" r="3.500" fill={AMB} />
    <path
      d="M6.500 34l9-10.500 6.500 7.500 4.500-4.500L41.500 34v.500a4.500 4.500 0 0 1-4.500 4.500H11a4.500 4.500 0 0 1-4.500-4.500z"
      fill={INK}
    />
    {shrinkBadge(36, 34, 8)}
  </Svg>
);

const ImageUpscalerIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="7" width="17" height="17" rx="4.500" fill={SOFT} />
    <circle cx="11" cy="13" r="2.200" fill={W} />
    <rect x="15" y="16" width="28" height="26" rx="5" fill={W} />
    <circle cx="36" cy="23" r="2.600" fill={AMB} />
    <path d="M17.500 40l7.500-9.500 6 7 4-4 6.500 6.500z" fill={INK} />
    <Spark cx={37} cy={9} r={6} />
    <Spark cx={28} cy={7} r={3} />
  </Svg>
);

const AtsCvIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={DOC} fill={W} />
    <path d={FOLD} fill={FOLDC} />
    <circle cx="20.500" cy="20" r="2.800" fill={INK} />
    <path
      d="M16.200 27c.5-2.300 2-3.300 4.300-3.300s3.800 1 4.300 3.300z"
      fill={INK}
    />
    <rect x="27" y="19" width="5" height="2" rx="1" fill={INK} />
    <rect x="27" y="23" width="3.500" height="2" rx="1" fill={INK} />
    <rect x="17" y="30" width="14" height="2" rx="1" fill={INK} />
    <rect x="17" y="34.500" width="9" height="2" rx="1" fill={INK} />
    <circle cx="37" cy="35" r="7" fill={AMB} />
    <path
      d="M33.500 35l2.500 2.500 4.500-5"
      stroke={W}
      strokeWidth="2.200"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FamilyCardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="11" width="38" height="27" rx="5" fill={W} />
    <circle cx="14" cy="20" r="3.200" fill={INK} />
    <path d="M9 34c.6-4 2.800-5.500 5-5.500s4.400 1.500 5 5.500z" fill={INK} />
    <circle cx="26" cy="20" r="3.200" fill={INK} />
    <path d="M21 34c.6-4 2.800-5.500 5-5.500s4.400 1.500 5 5.500z" fill={INK} />
    <circle cx="20" cy="27.500" r="2.400" fill={AMB} />
    <path
      d="M16.500 36.500c.4-2.800 1.800-3.800 3.500-3.800s3.100 1 3.500 3.800z"
      fill={AMB}
    />
    <rect x="34" y="18" width="6" height="2.400" rx="1.200" fill={INK} />
    <rect x="34" y="23" width="4" height="2.400" rx="1.200" fill={INK} />
    <rect x="34" y="28" width="6" height="2.400" rx="1.200" fill={INK} />
  </Svg>
);

const VoterMigrationIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={DOC} fill={W} />
    <path d={FOLD} fill={FOLDC} />
    <rect x="17" y="19" width="10" height="2" rx="1" fill={INK} />
    <rect x="17" y="24" width="7" height="2" rx="1" fill={INK} />
    <path
      d="M17 32h7m-2.500-2.800L24.300 32l-2.800 2.800"
      stroke={INK}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M36 25a7.500 7.500 0 0 0-7.500 7.500C28.500 38.500 36 44 36 44s7.500-5.500 7.500-11.500A7.500 7.500 0 0 0 36 25z"
      fill={AMB}
      stroke="rgba(15,23,42,0.15)"
      strokeWidth="1"
    />
    <circle cx="36" cy="32.500" r="2.800" fill={W} />
  </Svg>
);

const VoterRegistrationIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect
      x="17"
      y="6"
      width="14"
      height="21"
      rx="2.500"
      fill={AMB}
      transform="rotate(-6 24 16)"
    />
    <path
      d="M20.500 14.500l2.500 2.500 4.500-5"
      stroke={W}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="rotate(-6 24 16)"
    />
    <rect x="8" y="24" width="32" height="17" rx="4.500" fill={W} />
    <rect x="16" y="29" width="16" height="2.800" rx="1.400" fill={INK} />
    <rect x="13" y="35" width="10" height="2" rx="1" fill={INK} opacity="0.7" />
  </Svg>
);

const PassportJoinerIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect
      x="15"
      y="7"
      width="26"
      height="36"
      rx="4"
      fill={SOFT}
      transform="rotate(9 28 25)"
    />
    <rect x="9" y="6" width="26" height="36" rx="4" fill={W} />
    <circle cx="22" cy="20" r="7" stroke={INK} strokeWidth="1.800" />
    <ellipse cx="22" cy="20" rx="3" ry="7" stroke={INK} strokeWidth="1.800" />
    <path d="M15 20h14" stroke={INK} strokeWidth="1.800" />
    <rect x="16" y="32" width="12" height="2.400" rx="1.200" fill={INK} />
    <circle cx="36" cy="36" r="7" fill={AMB} />
    <path
      d="M32.500 36h7M36 32.500v7"
      stroke={W}
      strokeWidth="2.200"
      strokeLinecap="round"
    />
  </Svg>
);

const CropImageIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="15" y="15" width="18" height="18" rx="2.500" fill={SOFT} />
    <circle cx="20.500" cy="20.500" r="2" fill={AMB} />
    <path d="M15.500 33l5-6 3 3.500 2-2 6.500 4.500z" fill={W} />
    <path
      d="M13 5v28a2 2 0 0 0 2 2h28M5 13h28a2 2 0 0 1 2 2v28"
      stroke={W}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AgeCalculatorIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M24.300 3.500c2.400 2.600 2.900 4.500 0 6.300-2.900-1.800-2.400-3.700 0-6.300z"
      fill={W}
    />
    <rect x="23" y="11" width="2.600" height="8" rx="1.300" fill={AMB} />
    <rect x="14" y="19" width="20" height="9.500" rx="3.500" fill={W} />
    <rect x="9" y="28" width="30" height="3.200" fill={AMB} />
    <rect x="9" y="28" width="30" height="12" rx="3.500" fill={W} />
    <rect x="9" y="28" width="30" height="3.400" fill={AMB} />
    <circle cx="16" cy="35.500" r="1.100" fill={INK} />
    <circle cx="24" cy="36" r="1.100" fill={INK} />
    <circle cx="32" cy="35.500" r="1.100" fill={INK} />
    <rect x="5" y="40" width="38" height="3" rx="1.500" fill={SOFT} />
  </Svg>
);

const ReduceVideoIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="9" width="38" height="27" rx="6" fill={W} />
    <path
      d="M20 17v11.500a1 1 0 0 0 1.500.9l9.500-5.700a1 1 0 0 0 0-1.700L21.500 16.100A1 1 0 0 0 20 17z"
      fill={INK}
    />
    <rect x="10" y="40" width="20" height="2.600" rx="1.300" fill={SOFT} />
    {shrinkBadge(37, 35, 8)}
  </Svg>
);

const ChangeSpeedIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M8 33A16 16 0 0 1 35.300 21.700"
      stroke={W}
      strokeWidth="4.500"
      strokeLinecap="round"
    />
    <path
      d="M35.300 21.700A16 16 0 0 1 40 33"
      stroke={SOFT}
      strokeWidth="4.500"
      strokeLinecap="round"
    />
    <path
      d="M24 33l6.800-6.800"
      stroke={AMB}
      strokeWidth="3.200"
      strokeLinecap="round"
    />
    <circle cx="24" cy="33" r="3.600" fill={W} />
    <path
      d="M19.500 39.500l3.200 2.500-3.200 2.500M25 39.500l3.200 2.500-3.200 2.500"
      stroke={AMB}
      strokeWidth="2.200"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AddWatermarkIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="7" width="34" height="32" rx="6" fill={W} />
    <circle cx="16" cy="16" r="3.500" fill={AMB} />
    <path
      d="M6.500 33l9-10 6.500 7 5-5 13 11v.500a4.500 4.500 0 0 1-4.500 4.500H11a4.500 4.500 0 0 1-4.500-4.500z"
      fill={INK}
    />
    <path
      d="M35 22c4.200 5.200 6.500 8 6.500 11.700a6.500 6.500 0 0 1-13 0C28.500 30 30.800 27.200 35 22z"
      fill={AMB}
      stroke="rgba(15,23,42,0.15)"
      strokeWidth="1"
    />
    <path
      d="M31.500 33.500a3.600 3.600 0 0 0 2.400 3.200"
      stroke={W}
      strokeWidth="1.600"
      strokeLinecap="round"
    />
  </Svg>
);

const ImagesToPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect
      x="9"
      y="11"
      width="15"
      height="18"
      rx="3.500"
      fill={SOFT}
      transform="rotate(-8 16 20)"
    />
    <rect x="4" y="14" width="15" height="18" rx="3.500" fill={W} />
    <path d="M5.500 30l4.500-6 3 3.500 2-2 3.500 4.500z" fill={INK} />
    <circle cx="14" cy="19.500" r="1.800" fill={AMB} />
    <path
      d="M21 23h5M23.500 19.500 27 23l-3.500 3.500"
      stroke={AMB}
      strokeWidth="2.400"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M29 14a2.500 2.500 0 0 1 2.500-2.500H38l5 5v15.500a2.500 2.500 0 0 1-2.500 2.500h-9A2.500 2.500 0 0 1 29 32z"
      fill={W}
    />
    <path d="M38 11.500v3.500a1.500 1.500 0 0 0 1.500 1.500H43z" fill={FOLDC} />
    <rect x="32.500" y="21" width="7" height="1.800" rx="0.900" fill={INK} />
    <rect x="32.500" y="25" width="7" height="1.800" rx="0.900" fill={INK} />
    <rect x="32.500" y="29" width="4" height="1.800" rx="0.900" fill={INK} />
  </Svg>
);

const ImageConvertIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="7" width="27" height="23" rx="5" fill={W} />
    <circle cx="13" cy="14" r="2.800" fill={AMB} />
    <path
      d="M5.500 26l7-8 5 6 3.500-3.500 10.500 8v.500a3.500 3.500 0 0 1-3.500 3.500H9a3.500 3.500 0 0 1-3.500-3.500z"
      fill={INK}
    />
    <circle
      cx="33"
      cy="33"
      r="9.500"
      fill={AMB}
      stroke="rgba(15,23,42,0.12)"
      strokeWidth="1"
    />
    <g stroke={W} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28.500 32a4.700 4.700 0 0 1 8.200-2.300M37.500 34a4.700 4.700 0 0 1-8.200 2.300" />
      <path d="M37 26.500v3.500h-3.500M29 39.500V36h3.500" />
    </g>
  </Svg>
);

const ImageToTextIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="5" width="28" height="19" rx="4.500" fill={W} />
    <circle cx="12" cy="11" r="2.400" fill={AMB} />
    <path
      d="M5.500 20.500l6-6 4.500 4.500 3-3 8 5.500v.500a3.500 3.500 0 0 1-3.500 3.500H9a3.500 3.500 0 0 1-3.500-3.500z"
      fill={INK}
      transform="translate(0 -1)"
    />
    <path
      d="M19 27v4.500M16.200 29l2.800 3 2.800-3"
      stroke={W}
      strokeWidth="2.200"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="6" y="35" width="32" height="3" rx="1.500" fill={W} />
    <rect x="6" y="40.500" width="21" height="3" rx="1.500" fill={SOFT} />
    <circle
      cx="36"
      cy="13"
      r="8"
      fill={AMB}
      stroke="rgba(15,23,42,0.12)"
      strokeWidth="1"
    />
    <path
      d="M32 10h8M36 10v8"
      stroke={W}
      strokeWidth="2.400"
      strokeLinecap="round"
    />
  </Svg>
);

const SplitPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 11a3 3 0 0 1 3-3h10v32H11a3 3 0 0 1-3-3z" fill={W} />
    <path d="M27 8h4l9 9v20a3 3 0 0 1-3 3h-10z" fill={W} />
    <path d="M31 8v5a4 4 0 0 0 4 4h5z" fill={FOLDC} />
    <path
      d="M24 5v38"
      stroke={AMB}
      strokeWidth="2.600"
      strokeLinecap="round"
      strokeDasharray="3.500 4"
    />
    <rect x="12" y="19" width="5.500" height="2" rx="1" fill={INK} />
    <rect x="12" y="24.500" width="5.500" height="2" rx="1" fill={INK} />
    <rect x="12" y="30" width="3.500" height="2" rx="1" fill={INK} />
    <rect x="30.500" y="23" width="6" height="2" rx="1" fill={INK} />
    <rect x="30.500" y="28.500" width="6" height="2" rx="1" fill={INK} />
    <rect x="30.500" y="34" width="3.500" height="2" rx="1" fill={INK} />
  </Svg>
);

const EditPdfIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={DOC} fill={W} />
    <path d={FOLD} fill={FOLDC} />
    <rect x="17" y="19" width="12" height="2" rx="1" fill={INK} />
    <rect
      x="16"
      y="23.500"
      width="14"
      height="5"
      rx="1.500"
      fill={AMB}
      opacity="0.55"
    />
    <rect x="17" y="24.800" width="12" height="2" rx="1" fill={INK} />
    <rect x="17" y="32" width="8" height="2" rx="1" fill={INK} />
    <Pencil x={37} y={32} r={45} />
  </Svg>
);

const BijoyUnicodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="13" width="19" height="22" rx="5" fill={W} />
    <rect x="25" y="13" width="19" height="22" rx="5" fill={AMB} />
    <text
      x="13.500"
      y="30"
      textAnchor="middle"
      fontSize="17"
      fontWeight="700"
      fill="#1e293b"
      fontFamily="'Noto Sans Bengali','Hind Siliguri',system-ui,sans-serif"
    >
      অ
    </text>
    <text
      x="34.500"
      y="30"
      textAnchor="middle"
      fontSize="17"
      fontWeight="800"
      fill={W}
      fontFamily="system-ui,'Segoe UI',sans-serif"
    >
      A
    </text>
    <path
      d="M17 8h14M28 5.500 31 8l-3 2.500"
      stroke={W}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M31 40H17M20 37.500 17 40l3 2.500"
      stroke={W}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BanglishTypingIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="17" width="38" height="22" rx="5" fill={W} />
    {[10, 16, 22, 28, 34].map((x) => (
      <rect
        key={`a${x}`}
        x={x}
        y="21.500"
        width="4.500"
        height="4.500"
        rx="1.200"
        fill={INK}
      />
    ))}
    {[12.5, 18.5, 24.5, 30.5].map((x) => (
      <rect
        key={`b${x}`}
        x={x}
        y="28"
        width="4.500"
        height="4.500"
        rx="1.200"
        fill={INK}
      />
    ))}
    <rect x="15" y="34.500" width="18" height="2.800" rx="1.400" fill={INK} />
    <rect x="24" y="3" width="19" height="14" rx="5" fill={AMB} />
    <path d="M28 16.500l1.500 4.500 4-4.500z" fill={AMB} />
    <text
      x="33.500"
      y="14"
      textAnchor="middle"
      fontSize="11"
      fontWeight="700"
      fill={W}
      fontFamily="'Noto Sans Bengali','Hind Siliguri',system-ui,sans-serif"
    >
      ক
    </text>
  </Svg>
);

const SpecialInfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={DOC} fill={W} />
    <path d={FOLD} fill={FOLDC} />
    <rect x="17" y="20" width="10" height="2" rx="1" fill={INK} />
    <rect x="17" y="25" width="13" height="2" rx="1" fill={INK} />
    <rect x="17" y="30" width="7" height="2" rx="1" fill={INK} />
    <circle
      cx="35"
      cy="35"
      r="8"
      fill={AMB}
      stroke="rgba(15,23,42,0.12)"
      strokeWidth="1"
    />
    <circle cx="35" cy="31" r="1.400" fill={W} />
    <rect x="33.800" y="33.500" width="2.400" height="6" rx="1.200" fill={W} />
  </Svg>
);

const FuelCardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="11" width="38" height="27" rx="5" fill={W} />
    <path
      d="M17 16c4.200 5.200 6.500 8 6.500 11.700a6.500 6.500 0 0 1-13 0C10.500 24 12.800 21.200 17 16z"
      fill={AMB}
    />
    <path
      d="M13.500 27.500a3.600 3.600 0 0 0 2.400 3.200"
      stroke={W}
      strokeWidth="1.600"
      strokeLinecap="round"
    />
    <rect x="28" y="19" width="10" height="2.600" rx="1.300" fill={INK} />
    <rect x="28" y="24.500" width="7" height="2.600" rx="1.300" fill={INK} />
    <rect
      x="28"
      y="30"
      width="10"
      height="3.200"
      rx="1.600"
      fill={INK}
      opacity="0.7"
    />
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
    access: "paid",
    category: "General",
    bgColor: "bg-[#84cc16]",
    icon: DocumentScannerIcon,
    badge: "New",
  },
  {
    id: "2",
    name: "Govt Job Photo & Sign Resizer",
    access: "paid",
    category: "Image",
    bgColor: "bg-[#7c3aed]",
    icon: PhotoSignIcon,
  },
  {
    id: "10",
    name: "Remove Background",
    access: "paid",
    category: "Image",
    bgColor: "bg-[#16a34a]",
    icon: RemoveBackgroundIcon,
    badge: "Hot",
  },
  {
    id: "20",
    name: "Lock / Unlock PDF",
    access: "paid",
    category: "PDF",
    bgColor: "bg-[#4338ca]",
    icon: LockUnlockPdfIcon,
  },
  {
    id: "21",
    name: "PDF to Image",
    access: "paid",
    category: "PDF",
    bgColor: "bg-[#3b82f6]",
    icon: PdfToImageIcon,
  },
  {
    id: "17",
    name: "Compress PDF",
    access: "paid",
    category: "PDF",
    bgColor: "bg-[#1cc2e6]",
    icon: CompressPdfIcon,
    badge: "Hot",
  },
  {
    id: "18",
    name: "Merge PDFs",
    access: "paid",
    category: "PDF",
    bgColor: "bg-[#0eb2ed]",
    icon: MergePdfsIcon,
    badge: "Hot",
  },
  {
    id: "12",
    name: "Image Size Reducer",
    access: "paid",
    category: "Image",
    bgColor: "bg-[#4ade80]",
    icon: ImageSizeReducerIcon,
    badge: "New",
  },
  {
    id: "27",
    name: "Image Upscaler",
    access: "paid",
    category: "Image",
    bgColor: "bg-[#6366f1]",
    icon: ImageUpscalerIcon,
    badge: "New",
  },
  {
    id: "25",
    name: "ATS Friendly CV Maker",
    access: "paid",
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
    access: "paid",
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
    access: "paid",
    category: "General",
    bgColor: "bg-[#7c3aed]",
    icon: ReduceVideoIcon,
    badge: "New",
  },
  // Tools outside the requested priority list stay at the end.
  {
    id: "3",
    name: "Change Speed",
    access: "paid",
    category: "Video",
    bgColor: "bg-[#10ca7e]",
    icon: ChangeSpeedIcon,
  },
  {
    id: "4",
    name: "Add Watermark",
    access: "paid",
    category: "Video",
    bgColor: "bg-[#06b6d4]",
    icon: AddWatermarkIcon,
  },
  {
    id: "14",
    name: "Images to PDF",
    access: "paid",
    category: "Image",
    bgColor: "bg-[#2563eb]",
    icon: ImagesToPdfIcon,
  },
  {
    id: "15",
    name: "Image Convert",
    access: "paid",
    category: "Image",
    bgColor: "bg-[#a855f7]",
    icon: ImageConvertIcon,
    badge: "Hot",
  },
  {
    id: "16",
    name: "Image to Text",
    access: "paid",
    category: "Text",
    bgColor: "bg-[#14b8a6]",
    icon: ImageToTextIcon,
    badge: "New",
  },
  {
    id: "19",
    name: "Split PDF",
    access: "paid",
    category: "PDF",
    bgColor: "bg-[#2563eb]",
    icon: SplitPdfIcon,
  },
  {
    id: "22",
    name: "Edit PDF",
    access: "paid",
    category: "PDF",
    bgColor: "bg-[#2563EB]",
    icon: EditPdfIcon,
    badge: "New",
  },
  {
    id: "23",
    name: "Bijoy - Unicode",
    access: "paid",
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
const SEAL_CLIP =
  "polygon(50.00% 0.00%,57.04% 5.55%,65.45% 2.45%,70.43% 9.90%,79.39% 9.55%,81.82% 18.18%,90.45% 20.61%,90.10% 29.57%,97.55% 34.55%,94.45% 42.96%,100.00% 50.00%,94.45% 57.04%,97.55% 65.45%,90.10% 70.43%,90.45% 79.39%,81.82% 81.82%,79.39% 90.45%,70.43% 90.10%,65.45% 97.55%,57.04% 94.45%,50.00% 100.00%,42.96% 94.45%,34.55% 97.55%,29.57% 90.10%,20.61% 90.45%,18.18% 81.82%,9.55% 79.39%,9.90% 70.43%,2.45% 65.45%,5.55% 57.04%,0.00% 50.00%,5.55% 42.96%,2.45% 34.55%,9.90% 29.57%,9.55% 20.61%,18.18% 18.18%,20.61% 9.55%,29.57% 9.90%,34.55% 2.45%,42.96% 5.55%)";

const SEAL_INK = "#7A4803";

// চকমক (sparkle) তারা — ৪ কোণা
function SealSparkle({
  className,
  delay,
  size,
}: {
  className: string;
  delay: string;
  size: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      width={size}
      height={size}
      className={`seal-twinkle pointer-events-none absolute ${className}`}
      style={{ animationDelay: delay }}
    >
      <path
        d="M12 0c.9 6.4 5.6 11.1 12 12-6.4.9-11.1 5.6-12 12-.9-6.4-5.6-11.1-12-12C6.4 11.1 11.1 6.4 12 0z"
        fill="#FFFBE0"
      />
    </svg>
  );
}

function PremiumSeal() {
  return (
    <span
      title="Paid tool"
      className="absolute right-3 top-3 h-9 w-9 sm:h-10 sm:w-10"
      style={{
        // হালকা রোটেট + সোনালি গ্লো
        transform: "rotate(12deg)",
        filter:
          "drop-shadow(0 3px 5px rgba(88,50,0,0.45)) drop-shadow(0 0 6px rgba(255,214,90,0.55))",
      }}
    >
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
      <span className="sr-only">Paid</span>

      {/* বাইরের কাটা কিনারার সোনালি সিল */}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          clipPath: SEAL_CLIP,
          background:
            "linear-gradient(140deg, #FFF4BF 0%, #F7C84B 35%, #B97A0B 70%, #F3C550 100%)",
        }}
      />

      {/* ভেতরের পাতলা রিং */}
      <span
        aria-hidden="true"
        className="absolute inset-[3.5px] rounded-full"
        style={{
          background:
            "linear-gradient(320deg, #FFF1B0 0%, #E5A92A 50%, #A8680A 100%)",
        }}
      />

      {/* সোনালি মুখ (সবসময় আলো চলে যায়) */}
      <span
        aria-hidden="true"
        className="absolute inset-[5.5px] overflow-hidden rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, #FFE79A 0%, #F2BC3E 55%, #D8981A 100%)",
          boxShadow:
            "inset 0 1px 1px rgba(255,255,255,0.65), inset 0 -1px 1px rgba(120,70,0,0.35)",
        }}
      >
        <span className="seal-shine absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <span
          className="seal-glow absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), transparent 60%)",
          }}
        />
      </span>

      {/* খোদাই করা মুকুট */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 sm:h-5 sm:w-5"
        style={{ filter: "drop-shadow(0 0.75px 0 rgba(255,244,190,0.75))" }}
      >
        <path
          d="M4.2 17.4 3 8.6l5 3.9L12 5.8l4 6.7 5-3.9-1.2 8.8z"
          fill={SEAL_INK}
        />
        <rect
          x="4.6"
          y="18.9"
          width="14.8"
          height="2.3"
          rx="1.1"
          fill={SEAL_INK}
        />
        <circle cx="3" cy="8.2" r="1.35" fill={SEAL_INK} />
        <circle cx="12" cy="5.4" r="1.35" fill={SEAL_INK} />
        <circle cx="21" cy="8.2" r="1.35" fill={SEAL_INK} />
      </svg>

      {/* চারপাশে চকমক তারা */}
      <SealSparkle className="-left-1.5 -top-1.5" size={10} delay="0s" />
      <SealSparkle className="-bottom-1 -right-1.5" size={9} delay="0.7s" />
      <SealSparkle className="-bottom-1.5 left-0" size={7} delay="1.3s" />
    </span>
  );
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
        if (!response.ok) return false;

        const data = await response.json().catch(() => ({}));
        const subscription = data?.subscription;

        const expiresAt = subscription?.expiresAt
          ? new Date(subscription.expiresAt).getTime()
          : 0;

        const active =
          subscription?.accessStatus === "ACTIVE" &&
          subscription?.paymentStatus === "COMPLETED" &&
          expiresAt > Date.now();

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

export function ToolTile({ tool }: { tool: ToolItem }) {
  const router = useRouter();
  const IconComponent = tool.icon;
  const slug = getSlug(tool.name);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<
    boolean | null
  >(subscriptionAccessCache);

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
  const toolHref =
    requiresSubscription && hasActiveSubscription === false
      ? "/subscription"
      : `/sohoj-tools/${slug}`;

  const showPaidSeal = isPaid && hasActiveSubscription !== true;

  return (
    <Link
      href={toolHref}
      prefetch
      onMouseEnter={() => router.prefetch(`/sohoj-tools/${slug}`)}
      onFocus={() => router.prefetch(`/sohoj-tools/${slug}`)}
      className="flex flex-col items-center group cursor-pointer"
      aria-label={
        requiresSubscription && hasActiveSubscription === false
          ? `${tool.name} requires an active subscription`
          : `Open ${tool.name}`
      }
    >
      <div
        className={`relative w-full aspect-square rounded-[28px] ${tool.bgColor} flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-xs overflow-hidden`}
      >
        {tool.badge && (
          <span
            className={`absolute top-2.5 left-2.5 text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-full shadow-xs ${
              tool.badge === "New" ? "bg-emerald-600" : "bg-red-500"
            }`}
          >
            {tool.badge}
          </span>
        )}

        {/* The paid/premium seal disappears after an active subscription is detected. */}
        {showPaidSeal && <PremiumSeal />}

        {tool.access === "free" && (
          <span className="absolute top-2.5 right-2.5 text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-full shadow-xs bg-emerald-600">
            free
          </span>
        )}

        {IconComponent && (
          <IconComponent size={42} className="text-[#ffffff] stroke-[1.75]" />
        )}
      </div>

      <span className="mt-2.5 text-[15px] font-bold text-[#0F172A] text-center line-clamp-1 group-hover:text-[#2563EB] transition-colors">
        {tool.name}
      </span>
    </Link>
  );
}
