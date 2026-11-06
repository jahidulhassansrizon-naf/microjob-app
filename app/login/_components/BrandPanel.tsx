// Brand side panel for the sign-in page (desktop only) + shared brand fonts.
export const BRAND_FONT = "'Plus Jakarta Sans','Hind Siliguri',system-ui,sans-serif";

export function BrandFonts() {
  return (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
[data-bn="1"] .tracking-tight{letter-spacing:0}
@media (prefers-reduced-motion: no-preference){.sl-frame{animation:slFrame .7s cubic-bezier(.2,.7,.2,1) both}@keyframes slFrame{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}}`}</style>
  );
}

const FRAMES = [
  { key: "passport", bn: "পাসপোর্ট", en: "Passport", shirt: "#B91C1C", skin: "#E7C29B", bg: ["#3B82F6", "#1D4ED8"] },
  { key: "visa", bn: "ভিসা", en: "Visa", shirt: "#F8F4EA", skin: "#D9A97C", bg: ["#60A5FA", "#2563EB"] },
  { key: "birth", bn: "জন্ম নিবন্ধন", en: "Birth certificate", shirt: "#1F2A44", skin: "#EBCBA6", bg: ["#93C5FD", "#3B82F6"] },
];

export default function BrandPanel({ isBn }: { isBn: boolean }) {
  return (
    <aside className="relative hidden overflow-hidden bg-[#3B2F1E] text-[#FBF6E8] lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:gap-14 lg:p-12 xl:p-16">
      <BrandFonts />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#DC2626]/25 blur-3xl" />
      <div className="relative">
        <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
          {isBn ? "ছবি মাপমতো, ছাপার জন্য তৈরি।" : "Photos sized right, ready to print."}
        </h2>
        <p className="mt-5 max-w-sm text-base leading-7 text-[#D9C9A6]">
          {isBn
            ? "পাসপোর্ট, ভিসা ও জন্ম নিবন্ধনের ছবি বানান, আর এক শিটেই প্রিন্ট করুন।"
            : "Make passport, visa and birth-certificate photos, then print them together on one sheet."}
        </p>
      </div>

      <div className="relative grid max-w-lg grid-cols-3 gap-6" aria-hidden="true">
        {FRAMES.map((f, i) => (
          <figure key={f.key} className="sl-frame" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="relative">
              <span className="absolute -left-2 -top-2 h-3 w-3 border-l border-t border-[#BFAE8B]" />
              <span className="absolute -bottom-2 -right-2 h-3 w-3 border-b border-r border-[#BFAE8B]" />
              <div className="aspect-[4/5] overflow-hidden rounded-[3px] shadow-2xl shadow-black/40 ring-1 ring-black/20">
                <svg viewBox="0 0 80 100" className="block h-full w-full">
                  <defs>
                    <linearGradient id={`slbg-${f.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={f.bg[0]} />
                      <stop offset="1" stopColor={f.bg[1]} />
                    </linearGradient>
                  </defs>
                  <rect width="80" height="100" fill={`url(#slbg-${f.key})`} />
                  <path d="M8 100c0-20 14-30 32-30s32 10 32 30z" fill={f.shirt} />
                  <rect x="34" y="56" width="12" height="16" rx="5" fill={f.skin} />
                  <ellipse cx="40" cy="40" rx="14" ry="17" fill={f.skin} />
                  <path d="M26 38c0-14 8-20 14-20s14 6 14 20c-4-8-10-11-14-11s-10 3-14 11z" fill="#2B2118" />
                </svg>
              </div>
            </div>
            <figcaption className="mt-3 text-xs text-[#D9C9A6]">{isBn ? f.bn : f.en}</figcaption>
          </figure>
        ))}
      </div>

      <p className="relative text-sm text-[#BFAE8B]">
        {isBn ? "সংরক্ষিত ছবি ৩০ দিন পর নিজে থেকেই মুছে যায়।" : "Saved photos are deleted automatically after 30 days."}
      </p>
    </aside>
  );
}
