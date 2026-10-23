type WalletName = "Nagad" | "bKash";

/** bKash — গোলাপি অরিগামি পাখি */
function BkashLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="bKash" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#ffffff" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M5 29 L41 5 L34 27 Z" fill="#E2136E" />
        <path d="M34 27 L41 5 L59 23 Z" fill="#B0105A" />
        <path d="M34 27 L59 23 L31 60 Z" fill="#E2136E" />
        <path d="M5 29 L34 27 L31 60 Z" fill="#F2579A" />
      </g>
    </svg>
  );
}

/** Nagad — কমলা-লাল গোল লোগো */
function NagadLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Nagad" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nagad-ring" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FBB03B" />
          <stop offset="0.55" stopColor="#F26A21" />
          <stop offset="1" stopColor="#ED1C24" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#nagad-ring)" />
      <circle cx="32" cy="32" r="21.5" fill="#ffffff" />
      <path d="M32 14 A18 18 0 1 1 14.6 36.6" fill="none" stroke="url(#nagad-ring)" strokeWidth="5" strokeLinecap="round" />
      <path d="M22 41 L22 24 L42 41 L42 24" fill="none" stroke="#ED1C24" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WalletLogo({ wallet, size = 40 }: { wallet: WalletName; size?: number }) {
  return wallet === "bKash" ? <BkashLogo size={size} /> : <NagadLogo size={size} />;
}
