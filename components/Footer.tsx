"use client";

import SiteBrandLogo from "@/app/_components/SiteBrandLogo";
import { T } from "@/components/i18n/I18nProvider";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Code2, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";

type PersonInfo = {
  title?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  photo?: string;
  facebook?: string; // full profile URL
  whatsapp?: string; // number or full wa.me link (falls back to phone)
};

// Put profile links here if they are not saved in site settings yet.
const PROFILE_LINK_FALLBACK = {
  partner: { facebook: "" },
  developer: { facebook: "" },
};

function toWhatsAppUrl(person: PersonInfo): string | undefined {
  const raw = (person.whatsapp || person.phone || "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `880${digits.slice(1)}`; // BD local number -> intl
  return digits.length >= 10 ? `https://wa.me/${digits}` : undefined;
}

const FB_PATH =
  "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z";
const WA_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

// Photo with a safe fallback: if the file is missing, the icon is shown instead.
function PersonAvatar({
  photo,
  name,
  icon: Icon,
  className,
  iconSize = 18,
}: {
  photo?: string;
  name?: string;
  icon: LucideIcon;
  className: string;
  iconSize?: number;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-slate-700 text-slate-200 ${className}`}
    >
      {photo && !failed ? (
        <img
          src={photo}
          alt={name || ""}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Icon size={iconSize} />
      )}
    </span>
  );
}

// Accent themes for profile cards. To give a new card its own colour, add an entry here
// (and to the Accent union). glowRgb is "R G B" (space separated) and drives the pulsing glow.
type Accent = "sky" | "violet" | "emerald" | "amber";

const ACCENT_STYLES: Record<
  Accent,
  { card: string; bar: string; badge: string; icon: string; ring: string; glow: string; glowRgb: string }
> = {
  sky: {
    card: "border-sky-400/25 from-sky-400/[0.12] via-white/[0.03]",
    bar: "bg-sky-400",
    badge: "border-sky-300/30 bg-sky-400/10 text-sky-200",
    icon: "text-sky-300",
    ring: "ring-sky-300/40",
    glow: "bg-sky-400/25",
    glowRgb: "56 189 248",
  },
  violet: {
    card: "border-violet-400/25 from-violet-400/[0.12] via-white/[0.03]",
    bar: "bg-violet-400",
    badge: "border-violet-300/30 bg-violet-400/10 text-violet-200",
    icon: "text-violet-300",
    ring: "ring-violet-300/40",
    glow: "bg-violet-400/25",
    glowRgb: "167 139 250",
  },
  emerald: {
    card: "border-emerald-400/25 from-emerald-400/[0.12] via-white/[0.03]",
    bar: "bg-emerald-400",
    badge: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
    icon: "text-emerald-300",
    ring: "ring-emerald-300/40",
    glow: "bg-emerald-400/25",
    glowRgb: "52 211 153",
  },
  amber: {
    card: "border-amber-400/25 from-amber-400/[0.12] via-white/[0.03]",
    bar: "bg-amber-400",
    badge: "border-amber-300/30 bg-amber-400/10 text-amber-200",
    icon: "text-amber-300",
    ring: "ring-amber-300/40",
    glow: "bg-amber-400/25",
    glowRgb: "251 191 36",
  },
};

function PersonContactRows({ person, accent }: { person: PersonInfo; accent: Accent }) {
  const a = ACCENT_STYLES[accent];
  const rows = [
    {
      icon: Mail,
      value: person.email,
      href: person.email ? `mailto:${person.email}` : undefined,
    },
    {
      icon: Phone,
      value: person.phone,
      href: person.phone ? `tel:${person.phone.replace(/[^\d+]/g, "")}` : undefined,
    },
    { icon: MapPin, value: person.address, href: undefined },
  ].filter((row) => Boolean(row.value));

  if (rows.length === 0) return null;

  return (
    <div className="space-y-1.5 border-t border-white/10 px-3 pb-2.5 pt-2.5">
      {rows.map(({ icon: RowIcon, value, href }, i) => (
        <div
          key={i}
          // leave room at the bottom-right for the Facebook / WhatsApp buttons
          className={`flex items-start gap-2 text-[11.5px] leading-snug text-slate-200 ${
            i === rows.length - 1 ? "pr-16" : ""
          }`}
        >
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10 ${a.icon}`}>
            <RowIcon size={11} />
          </span>
          {href ? (
            <a href={href} className="min-w-0 cursor-pointer break-all pt-0.5 transition-colors hover:text-white">
              {value}
            </a>
          ) : (
            <span className="min-w-0 break-words pt-0.5">{value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function SocialChip({
  href,
  label,
  path,
  hoverClass,
}: {
  href: string;
  label: string;
  path: string;
  hoverClass: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:text-white ${hoverClass}`}
    >
      <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden>
        <path d={path} />
      </svg>
    </a>
  );
}

// Compact profile card used for both Executive Leadership and Designed & developed by.
// Always open (no dropdown); two sit side by side. Facebook + WhatsApp sit at the bottom-right.
function PersonCard({
  icon,
  person,
  accent,
  glow = false,
}: {
  icon: LucideIcon;
  person: PersonInfo;
  accent: Accent;
  glow?: boolean;
}) {
  const a = ACCENT_STYLES[accent];
  const BadgeIcon = accent === "sky" ? Lightbulb : Code2;
  const whatsappUrl = toWhatsAppUrl(person);

  return (
    <div
      style={{ "--glow": a.glowRgb } as CSSProperties}
      className={`relative h-full cursor-pointer overflow-hidden rounded-xl border bg-[#0c1220] bg-gradient-to-br to-transparent shadow-[0_8px_24px_rgba(0,0,0,0.25)] ${
        glow ? "cardstack-glow" : ""
      } ${a.card}`}
    >
      {/* accent bar + soft corner glow */}
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${a.bar}`} />
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${a.glow}`}
      />

      <div className="relative flex items-center gap-2.5 py-2.5 pl-4 pr-3">
        <PersonAvatar
          photo={person.photo}
          name={person.name}
          icon={icon}
          iconSize={20}
          className={`h-11 w-11 rounded-lg ring-2 ${a.ring}`}
        />
        <div className="min-w-0 flex-1">
          <span
            className={`mb-1 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-px text-[10px] font-semibold ${a.badge}`}
          >
            <BadgeIcon size={10} className="shrink-0" />
            <span className="truncate">
              <T>{person.title || ""}</T>
            </span>
          </span>
          <span className="block break-words text-[13.5px] font-bold leading-snug text-white">
            {person.name}
          </span>
        </div>
      </div>

      <div className="relative">
        <PersonContactRows person={person} accent={accent} />

        {(person.facebook || whatsappUrl) && (
          <div className="absolute bottom-2 right-2.5 flex items-center gap-1.5">
            {person.facebook && (
              <SocialChip
                href={person.facebook}
                label="Facebook"
                path={FB_PATH}
                hoverClass="hover:bg-[#1877F2]"
              />
            )}
            {whatsappUrl && (
              <SocialChip
                href={whatsappUrl}
                label="WhatsApp"
                path={WA_PATH}
                hoverClass="hover:bg-[#25D366]"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * CARD STACK  (Executive Leadership / Designed & developed by / ...future cards)
 *
 * NOTE FOR ANY AI / DEVELOPER EDITING THIS FILE:
 * - The footer profile cards are NOT hard-coded in JSX. They come from the
 *   `profileCards` array inside <Footer /> and are rendered by <CardStack />.
 * - TO ADD A CARD: build a PersonInfo object, then push one entry into
 *   `profileCards`:
 *       { id: "mentor", accent: "emerald", icon: Lightbulb, person: mentorInfo }
 *   That is all. The stack, dots, motion, glow and Facebook/WhatsApp chips
 *   pick it up automatically. Do NOT create a second grid or a new component.
 * - Order in the array = order of rotation.
 * - `accent` must exist in ACCENT_STYLES (sky | violet | emerald | amber). Add a
 *   new entry there for a new colour.
 * - PersonInfo.facebook = full profile URL. PersonInfo.whatsapp = number or
 *   wa.me link (falls back to `phone`). Missing values simply hide that chip.
 *
 * HOW THE MOTION WORKS (continuous, never stops while visible):
 * - A single number `p` (progress) grows continuously inside a requestAnimationFrame
 *   loop. One whole unit of `p` = one swap = CARD_STACK_SWAP_MS milliseconds.
 * - cardStackStyle(i, p, n) turns `p` into the transform / opacity / brightness /
 *   z-index of card i. The front card arcs UP and drops BEHIND the stack while the
 *   next card rises to the FRONT, and this keeps flowing with no rests in between.
 * - Styles are written straight to the DOM (no React re-render per frame), so it
 *   stays smooth. React only re-renders when the front card changes (glow + dots).
 * - The loop runs only while the stack is on screen (IntersectionObserver).
 * - Mouse hover / keyboard focus eases the stack to rest on a clean front card;
 *   it eases back into motion when the mouse leaves. On touch screens a tap freezes the
 *   stack on the tapped card at once; it resumes 5s later or when the visitor taps elsewhere.
 * - Only the front card is clickable (back cards are `inert`).
 * - Back cards must stay opaque (PersonCard has bg-[#0c1220]) or text shows through.
 * ------------------------------------------------------------------------- */
type FooterCard = {
  id: string;
  accent: Accent;
  icon: LucideIcon;
  person: PersonInfo;
};

const CARD_STACK_SWAP_MS = 1400; // time for one full swap (lower = faster)
const CARD_STACK_DEPTH_PX = 14; // how much each back card peeks out below the front one
const CARD_STACK_LIFT_PX = 22; // how high the front card arcs before dropping behind
// true  = obey the visitor's OS "reduce motion / animations off" setting (motion is disabled then)
// false = always animate, ignoring that setting
const RESPECT_REDUCED_MOTION = false;

const CARD_STACK_CSS = `
.cardstack-glow { animation: cardstack-glow 2.8s ease-in-out infinite; }
@keyframes cardstack-glow {
  0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,0.25), 0 0 0 0 rgb(var(--glow) / 0); }
  50%      { box-shadow: 0 8px 24px rgba(0,0,0,0.25), 0 0 22px 2px rgb(var(--glow) / 0.45); }
}
`;

// Position of card `i` for progress `p` (n cards). Pure function, used for the first render and every frame.
function cardStackStyle(i: number, p: number, n: number) {
  const s = (((i - p) % n) + n) % n; // 0 = front; larger = further back
  const leaving = s >= n - 1; // card that just left the front, flying to the back
  const lf = leaving ? n - s : 0; // 0 -> 1 while flying back
  const dv = leaving ? lf * (n - 1) : s; // visual depth
  const c = Math.min(dv, 2);
  const arc = leaving ? Math.sin(Math.PI * lf) : 0; // 0 -> 1 -> 0 : the "lift" of the leaving card
  return {
    transform: `translate3d(0, ${(c * CARD_STACK_DEPTH_PX - arc * CARD_STACK_LIFT_PX).toFixed(2)}px, 0) rotate(${(
      -arc * 1.6
    ).toFixed(2)}deg) scale(${(1 - c * 0.05 + arc * 0.02).toFixed(4)})`,
    opacity: Math.max(0, Math.min(1, 3 - dv)),
    filter: `brightness(${(1 - c * 0.18).toFixed(3)})`,
    zIndex: Math.round((n - dv) * 10),
  };
}

function CardStack({ cards }: { cards: FooterCard[] }) {
  const n = cards.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pRef = useRef(0); // progress
  const vRef = useRef(0); // speed ramp 0..1 (eases motion back in after a hover)
  const targetRef = useRef<number | null>(null); // dot click target
  const holdTargetRef = useRef<number | null>(null); // where to rest while hovered
  const hoverRef = useRef(false);
  const kbRef = useRef(false);
  const touchRef = useRef(false); // finger / pen is (or was just) on the stack
  const touchTimerRef = useRef<number | null>(null);
  const [front, setFront] = useState(0);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const applyAll = (p: number) => {
    for (let i = 0; i < n; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const st = cardStackStyle(i, p, n);
      el.style.transform = st.transform;
      el.style.opacity = String(st.opacity);
      el.style.filter = st.filter;
      el.style.zIndex = String(st.zIndex);
    }
  };

  // Respect "reduce motion" only if RESPECT_REDUCED_MOTION is on
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(RESPECT_REDUCED_MOTION && mq.matches);
    const onChange = () => setReduceMotion(RESPECT_REDUCED_MOTION && mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Run only while the visitor is actually looking at the footer
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Touch / pen: a tap on the stack freezes it on the tapped card; it flows again 5s after the
  // last touch, or immediately when the visitor taps anywhere outside the stack.
  const TOUCH_RESUME_MS = 5000;
  const clearTouchTimer = () => {
    if (touchTimerRef.current !== null) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };
  const holdTouch = () => {
    clearTouchTimer();
    touchRef.current = true;
  };
  const releaseTouchLater = () => {
    clearTouchTimer();
    touchTimerRef.current = window.setTimeout(() => {
      touchRef.current = false;
      touchTimerRef.current = null;
    }, TOUCH_RESUME_MS);
  };

  useEffect(() => {
    const onOutside = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        clearTouchTimer();
        touchRef.current = false;
      }
    };
    document.addEventListener("pointerdown", onOutside, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      clearTouchTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the front card is interactive
  useEffect(() => {
    itemRefs.current.forEach((el, i) => {
      if (el) (el as HTMLDivElement & { inert?: boolean }).inert = i !== front;
    });
  }, [front, n]);

  // The continuous motion loop
  useEffect(() => {
    if (n < 2 || !inView || reduceMotion) return;
    const base = 1 / CARD_STACK_SWAP_MS; // progress units per ms
    let raf = 0;
    let last = performance.now();
    let lastFront = -1;
    let lastP = Number.NaN;
    vRef.current = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 48); // clamp so a background tab never causes a jump
      last = now;
      let p = pRef.current;
      const touching = touchRef.current;
      const holding = hoverRef.current || kbRef.current || touching;

      if (holding && holdTargetRef.current === null) {
        // mouse/keyboard: glide forward to the next clean card; touch: snap to the nearest one
        // (almost instantly, so the card under the finger stops where it was tapped)
        holdTargetRef.current =
          targetRef.current ?? (touching ? Math.round(p) : Math.ceil(p - 1e-6));
      }
      if (!holding) holdTargetRef.current = null;

      const settle = holdTargetRef.current ?? targetRef.current;
      if (settle !== null) {
        // glide to rest on a clean front card (ease-out), never overshoot
        const rem = settle - p;
        const ar = Math.abs(rem);
        if (ar <= 0.0005) {
          p = settle;
          vRef.current = 0;
          if (!holding) targetRef.current = null;
        } else {
          const mult = touching && targetRef.current === null ? 10 : 1;
          p += Math.sign(rem) * Math.min(ar, base * dt * mult * Math.max(0.12, Math.min(1, ar * 2.5)));
        }
      } else {
        // normal: constant flowing motion, eased in after a rest
        vRef.current += (1 - vRef.current) * (1 - Math.exp(-dt / 280));
        p += base * dt * vRef.current;
      }

      pRef.current = p;
      if (p !== lastP) {
        applyAll(p);
        lastP = p;
      }
      const f = ((Math.round(p) % n) + n) % n;
      if (f !== lastFront) {
        lastFront = f;
        setFront(f);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, n, reduceMotion]);

  if (n === 0) return null;

  const goTo = (i: number) => {
    let tgt = Math.ceil(pRef.current - 1e-6);
    while ((((tgt % n) + n) % n) !== i) tgt += 1;
    if (n < 2 || !inView || reduceMotion) {
      pRef.current = tgt;
      applyAll(tgt);
      setFront(i);
      return;
    }
    targetRef.current = tgt;
    if (hoverRef.current || kbRef.current || touchRef.current) holdTargetRef.current = tgt;
  };

  return (
    <div
      ref={rootRef}
      className="w-full max-w-[20rem]"
      // Hovering / keyboard focus eases the stack to rest on a clean front card so it can be
      // read and clicked; it flows again as soon as the mouse leaves. A mouse-click focus
      // (e.g. after opening WhatsApp) never freezes it.
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hoverRef.current = true;
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") hoverRef.current = false;
      }}
      onFocus={(e) => {
        kbRef.current = (e.target as Element).matches(":focus-visible");
      }}
      onBlur={() => {
        kbRef.current = false;
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") holdTouch();
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse") releaseTouchLater();
      }}
      onPointerCancel={(e) => {
        if (e.pointerType !== "mouse") releaseTouchLater();
      }}
    >
      <style>{CARD_STACK_CSS}</style>

      {/* all cards share one grid cell, so the stack is as tall as the tallest card */}
      <div
        className="grid"
        style={{
          paddingTop: n > 1 ? CARD_STACK_LIFT_PX : 0,
          paddingBottom: Math.min(n - 1, 2) * CARD_STACK_DEPTH_PX,
        }}
      >
        {cards.map((card, i) => (
          <div
            key={card.id}
            aria-hidden={i !== front}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            style={cardStackStyle(i, 0, n)}
            className="col-start-1 row-start-1 origin-bottom will-change-transform"
          >
            <PersonCard
              icon={card.icon}
              person={card.person}
              accent={card.accent}
              glow={i === front && inView && !reduceMotion}
            />
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="mt-1 flex items-center gap-1.5">
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              aria-label={`Show ${card.person.name || card.id}`}
              aria-current={i === front}
              onClick={() => goTo(i)}
              className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                i === front
                  ? `w-5 ${ACCENT_STYLES[card.accent].bar}`
                  : "w-1.5 bg-white/25 hover:bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SecureBadge() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-400/25">
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" aria-hidden>
        <defs>
          <linearGradient id="secureShieldFill" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
        {/* shield body */}
        <path
          d="M16 3 5.5 7v8.2c0 6.1 4.2 11.2 10.5 13.8 6.3-2.6 10.5-7.7 10.5-13.8V7L16 3Z"
          fill="url(#secureShieldFill)"
        />
        {/* soft light on the left half for depth */}
        <path d="M16 3 5.5 7v8.2c0 6.1 4.2 11.2 10.5 13.8V3Z" fill="#fff" fillOpacity="0.14" />
        {/* check mark */}
        <path
          d="m11 15.8 3.4 3.4 6.6-7.2"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Footer() {
  const [showContestComingSoon, setShowContestComingSoon] = useState(false);
  const { settings } = useSiteSettings();
  const serviceLinks = [
    { title: "AI Photo Edit", href: "/login?redirect=/ai-editor" },
    { title: "Manual Photo Edit", href: "/login?redirect=/manual-editor" },
    { title: "Bulk Photo Edit", href: "/login?redirect=/bulk-photo-edit" },
    { title: "AI Photo", href: "/login?redirect=/ai-template" },
    { title: "Document Templates", href: "/login" },
    { title: "Print Media", href: "/login?redirect=/print-media" },
    {
      title: "Create Questions",
      href: "/login?redirect=/questions-create/create",
    },
    { title: "Job Circular", href: "/login?redirect=/jobs" },
    { title: "Seba Lagbe Tools", href: "/login?redirect=/sohoj-tools" },
  ];

  const pagesLinks: Array<{ title: string; href?: string; target?: string; comingSoon?: boolean }> = [
    { title: "What is Seba Lagbe?", href: "/help" },
    { title: "About Us", href: "/about" },
    { title: "Our Team", href: "/our-team" },
    { title: "Contact", href: "/contact" },
    { title: "Document Templates", href: "/dorkari-document" },
    { title: "AI Photo", href: "/ai-photo" },
    { title: "Package", href: "/pricing" },
    { title: "Contest", comingSoon: true },
  ];

  const supportLinks = [
    { title: "Terms of Service", href: "/terms" },
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Copyright Policy", href: "/copyright" },
  ];

  const socials = [
    {
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61593666395329",
      path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@happycodingn",
      path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.56-1.28 2.56.02.82.42 1.61 1.08 2.1 1.05.82 2.57.85 3.65.08.73-.5 1.17-1.33 1.25-2.22.08-2.37.03-4.75.03-7.12 0-3.37-.02-6.75.02-10.12z",
    },
    {
      label: "Instagram",
      href: "",
      path: "M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm0 2h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3zm5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.5-3a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCt9GohPOuqrNFYdkcM1fqWQ",
      path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    },
  ];

  // Link style: a small gradient dash slides in on hover
  const linkClass =
    "group inline-flex cursor-pointer items-center text-[13px] text-slate-300/75 transition-all duration-300 hover:text-white";

  const Dash = () => (
    <span
      aria-hidden
      className="mr-0 h-[2px] w-0 rounded-full bg-sky-400 transition-all duration-300 group-hover:mr-2.5 group-hover:w-3.5"
    />
  );

  const columnTitle = "mb-4 flex items-center gap-2.5 text-sm font-semibold text-white";

  const TitleBar = () => (
    <span
      aria-hidden
      className="h-4 w-1 rounded-full bg-sky-400"
    />
  );

  // Developer and Executive Profile details are separate profiles. Never use shared
  // Contact information as a fallback for either footer profile.
  const extra = settings as unknown as { developer?: PersonInfo; partner?: PersonInfo };

  const developer: PersonInfo = {
    title: extra.developer?.title || "Designed & developed by",
    name: extra.developer?.name || "Jahidul Hasan Srizon",
    email: extra.developer?.email || "",
    phone: extra.developer?.phone || "",
    address: extra.developer?.address || "",
    photo: extra.developer?.photo || "/adminpic/srizonFbPic.jpg",
    facebook: extra.developer?.facebook || PROFILE_LINK_FALLBACK.developer.facebook,
    whatsapp: extra.developer?.whatsapp || "",
  };

  const partner: PersonInfo | null = extra.partner?.name
    ? {
        ...extra.partner,
        title: extra.partner.title || "Executive Leadership",
        photo: extra.partner.photo || "/adminpic/exicutive.jpg",
        facebook: extra.partner.facebook || PROFILE_LINK_FALLBACK.partner.facebook,
      }
    : process.env.NODE_ENV !== "production"
      ? {
          // Local preview only. Hidden in production until real details are saved.
          title: "Executive Leadership",
          name: "Partner Name",
          photo: "/adminpic/exicutive.jpg",
          email: "partner@example.com",
          phone: "01XXXXXXXXX",
          address: "Partner address",
          facebook: PROFILE_LINK_FALLBACK.partner.facebook,
        }
      : null;

  // Footer profile cards. Order = rotation order. See the CARD STACK note above to add more.
  const profileCards: FooterCard[] = [
    ...(partner
      ? [{ id: "partner", accent: "sky" as const, icon: Lightbulb, person: partner }]
      : []),
    { id: "developer", accent: "violet" as const, icon: Code2, person: developer },
  ];

  return (
    <footer className="navbar-font relative isolate overflow-hidden border-t border-white/10 bg-[#0c1220] text-slate-300">

      <div className="relative mx-auto max-w-[1400px] px-4 pb-5 pt-10 sm:px-6 md:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 pb-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Column 1: Logo & Contact Info */}
          <div className="space-y-4 pr-4 lg:col-span-2">
            <Link href="/" className="flex w-fit items-center">
              <SiteBrandLogo width={120} height={38} className="h-[38px] w-auto" />
            </Link>

            <p className="max-w-sm text-[13px] leading-relaxed text-slate-300/80">
              <T>{settings.footer.description.replaceAll("Seba Lagbe", settings.branding.siteName)}</T>
            </p>

            {/* Executive Leadership + Designed & developed by (+ future cards): animated stack */}
            <CardStack cards={profileCards} />
          </div>

          {/* Column 2: Services */}
          <div>
            <h3 className={columnTitle}>
              <TitleBar />
              <T>{"Services\r\n            "}</T>
            </h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((service, index) => (
                <li key={index}>
                  <Link href={service.href} className={linkClass}>
                    <Dash />
                    <T>{service.title}</T>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Pages */}
          <div>
            <h3 className={columnTitle}>
              <TitleBar />
              <T>{"Pages\r\n            "}</T>
            </h3>
            <ul className="space-y-2.5">
              {pagesLinks.map((page, index) => (
                <li key={index}>
                  {page.comingSoon ? (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setShowContestComingSoon(true)}
                        aria-expanded={showContestComingSoon}
                        className={linkClass}
                      >
                        <Dash />
                        <T>{page.title}</T>
                      </button>
                      {showContestComingSoon && (
                        <p
                          role="status"
                          className="w-fit rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-200"
                        >
                          <T>{"Coming Soon"}</T>
                        </p>
                      )}
                    </div>
                  ) : page.href ? (
                    <Link
                      href={page.href}
                      className={linkClass}
                      target={page.target}
                      rel={page.target === "_blank" ? "noopener noreferrer" : undefined}
                    >
                      <Dash />
                      <T>{page.title}</T>
                    </Link>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className={linkClass}
                    >
                      <Dash />
                      <T>{page.title}</T>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h3 className={columnTitle}>
              <TitleBar />
              <T>{"Support\r\n            "}</T>
            </h3>
            <ul className="space-y-2.5">
              {supportLinks.map((support, index) => (
                <li key={index}>
                  {support.href ? (
                    <Link href={support.href} className={linkClass}>
                      <Dash />
                      <T>{support.title}</T>
                    </Link>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className={linkClass}
                    >
                      <Dash />
                      <T>{support.title}</T>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment methods: compact, badge + title left, image right */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <SecureBadge />
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight text-white">
                  <T>{"Secure Payment"}</T>
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                  <T>{"Pay safely with your preferred method"}</T>
                </p>
              </div>
            </div>

            <div className="w-full max-w-[340px] overflow-hidden rounded-lg bg-white p-1.5 ring-1 ring-white/20 shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
              <img
                src={settings.branding.footerLogoUrl || "/footerLogo/logoFooter.jpg"}
                alt={settings.branding.siteName || "Website"}
                width={1600}
                height={300}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-400 sm:flex-row">
          <p>
            <>© {new Date().getFullYear()} {settings.branding.siteName}. {settings.footer.copyrightText}</>
          </p>

          <div className="flex items-center gap-2.5">
            {socials.map((item) => ({
              ...item,
              href: item.label === "Facebook" ? settings.socials.facebook
                : item.label === "TikTok" ? settings.socials.tiktok
                : item.label === "YouTube" ? settings.socials.youtube
                : item.label === "Instagram" ? settings.socials.instagram
                : item.href,
            })).filter((item) => Boolean(item.href)).map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-sky-500 hover:text-white"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
