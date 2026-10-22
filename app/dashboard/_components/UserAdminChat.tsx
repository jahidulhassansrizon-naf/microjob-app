"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { ChevronUp, LoaderCircle, MessageCircle, Send } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

// Admin avatar displayed to every user in the support chat header.
const ADMIN_PROFILE_IMAGE_URL =
  "https://scontent.fdac165-1.fna.fbcdn.net/v/t39.30808-6/830162073_122117058801455546_9222997689185944451_n.jpg?stp=dst-jpg_tt6&cstp=mx1024x1536&ctp=s1024x1536&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFXk2DRYIMaT2rWUpeNS_QDO3oAE2SwZaw7egATZLBlrFuLbZxjfp2t1mEf0QSZ0qIfZc4Yht_g_s0X90DPJ-dn&_nc_ohc=V0QxUoSmOM4Q7kNvwGA029p&_nc_oc=AdqWhphBEz4E5jLphb64chRZxLyo_CkZDH0zsckT72KGkGTjFiXJL1xcfNrMr3C59QM&_nc_zt=23&_nc_ht=scontent.fdac165-1.fna&_nc_gid=cABDVM2sgWBbemyNF0MWmg&_nc_ss=7b2a8&oh=00_AQM4A6_U0NCz7Lq_E5LID7UkYFkZQVW28_JlZWhqaKQ-Aw&oe=6AD7D82F";

type ChatMessage = {
  id: string;
  text: string;
  senderRole: "user" | "admin";
  createdAt: string;
  readByAdmin: boolean;
  readByUser: boolean;
};

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const merged = new Map<string, ChatMessage>();
  for (const message of current) merged.set(message.id, message);
  for (const message of incoming) merged.set(message.id, message);
  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** How long the hand stays hidden after the user touches the chat before it returns. */
const HAND_RETURN_DELAY_MS = 15000;

type HandLayout = {
  sl: number;
  st: number;
  sw: number;
  sh: number;
  iy: number;
  il: number;
  ir: number;
};

/**
 * Animated human hand guide. It loops through 3 stops until the user touches the chat:
 *  1) left of the message box  -> "এখানে ক্লিক করে চ্যাট করুন"
 *  2) right of the message box -> "এখান থেকে মেসেজ করতে পারবেন"
 *  3) back at the original spot -> "এখান থেকে চ্যাট করুন"
 * Between stops the hand circles around the whole chat box, always pointing at it.
 */
function PointingHand({
  containerRef,
  sectionRef,
  inputRef,
  dismissed,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  sectionRef: RefObject<HTMLElement | null>;
  inputRef: RefObject<HTMLDivElement | null>;
  dismissed: boolean;
}) {
  const handRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [layout, setLayout] = useState<HandLayout | null>(null);
  const [gone, setGone] = useState(false);
  // The hand stays invisible until its position is measured, so it never flashes at the wrong spot.
  const [ready, setReady] = useState(false);

  // Measure the chat box + message field relative to the wrapper.
  useEffect(() => {
    const measure = () => {
      const c = containerRef.current;
      const s = sectionRef.current;
      const i = inputRef.current;
      if (!c || !s || !i) return;
      const cr = c.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      const ir = i.getBoundingClientRect();
      if (!sr.width || !sr.height) return;
      const next: HandLayout = {
        sl: Math.round(sr.left - cr.left),
        st: Math.round(sr.top - cr.top),
        sw: Math.round(sr.width),
        sh: Math.round(sr.height),
        iy: Math.round(ir.top - cr.top + ir.height / 2),
        il: Math.round(ir.left - cr.left),
        ir: Math.round(ir.right - cr.left),
      };
      setLayout((prev) =>
        prev &&
        prev.sl === next.sl &&
        prev.st === next.st &&
        prev.sw === next.sw &&
        prev.sh === next.sh &&
        prev.iy === next.iy &&
        prev.il === next.il &&
        prev.ir === next.ir
          ? prev
          : next,
      );
    };
    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    if (observer) {
      if (containerRef.current) observer.observe(containerRef.current);
      if (sectionRef.current) observer.observe(sectionRef.current);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, sectionRef, inputRef]);

  // Fade out, then remove, once the user starts using the chat.
  useEffect(() => {
    if (!dismissed) {
      setGone(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setGone(true);
      setReady(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [dismissed]);

  // Show the hand (fade in) only after the layout is measured and the page has settled.
  useEffect(() => {
    if (!layout || gone) return;
    const timer = window.setTimeout(() => setReady(true), 500);
    return () => window.clearTimeout(timer);
  }, [layout, gone]);

  // Build the tour animation.
  useEffect(() => {
    if (!layout || gone) return;
    const hand = handRef.current;
    if (!hand || typeof hand.animate !== "function") return;

    const { sl, st, sw, sh, iy, il, ir } = layout;
    const TIP_X = 102; // fingertip position inside the 104x69 svg
    const TIP_Y = 25;
    const T = 11000;

    // The hand always stays upright (never tilted) and always points toward the chat box.
    const p1 = { x: il + 4, y: iy }; // left stop: message field, pointing right
    const p2 = { x: ir - 4, y: iy }; // right stop: message field, pointing left (mirrored)
    const left = sl + 4;
    const right = sl + sw - 4;
    const cx = sl + sw / 2;
    const topY = Math.max(14, st - 26); // lane over the "Need help?" bar
    const botY = st + sh - 34; // lane along the bottom of the box (stays inside the banner)

    const LEFT_TILT = -18; // final stop beside the message field is tilted (pointing slightly up)
    // sx = mirror (1 pointing right, -1 pointing left), r = tilt in degrees while travelling
    type Wp = { x: number; y: number; sx: number; r: number };
    const W = (x: number, y: number, sx: number, r = 0): Wp => ({
      x,
      y,
      sx,
      r,
    });

    const tf = (x: number, y: number, sx: number, dy: number, r: number) =>
      `translate(${x - TIP_X}px, ${y - TIP_Y + dy}px) rotate(${r}deg) scaleX(${sx})`;

    const frames: Keyframe[] = [];
    const push = (
      t: number,
      x: number,
      y: number,
      sx: number,
      dy: number,
      easing = "linear",
      r = 0,
    ) => frames.push({ offset: t / T, transform: tf(x, y, sx, dy, r), easing });

    // Stay at a stop and bounce up/down so the user notices it.
    const hold = (
      t0: number,
      t1: number,
      p: { x: number; y: number },
      sx: number,
      lastEasing: string,
      r = 0,
    ) => {
      const fr = [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 1];
      const dd = [0, -12, 0, -12, 0, -12, 0, 0];
      fr.forEach((f, k) =>
        push(
          t0 + (t1 - t0) * f,
          p.x,
          p.y,
          sx,
          dd[k],
          k === fr.length - 1 ? lastEasing : "ease-in-out",
          r,
        ),
      );
    };

    // Walk along waypoints (time split by distance). The first point is the previous hold's end;
    // the last point is added by the next hold (or by the caller when it closes the loop).
    const walk = (t0: number, t1: number, pts: Wp[]) => {
      const lens: number[] = [0];
      for (let k = 1; k < pts.length; k++)
        lens.push(
          lens[k - 1] +
            Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y),
        );
      const total = lens[lens.length - 1] || 1;
      for (let k = 1; k < pts.length - 1; k++)
        push(
          t0 + ((t1 - t0) * lens[k]) / total,
          pts[k].x,
          pts[k].y,
          pts[k].sx,
          0,
          k === pts.length - 2 ? "ease-out" : "linear",
          pts[k].r,
        );
    };

    // 1) left of the message field: "click here"
    hold(0, 2200, p1, 1, "ease-in", LEFT_TILT);
    // 2) go around the top of the chat box to the right side (turns around on top)
    walk(2200, 5400, [
      W(p1.x, p1.y, 1, LEFT_TILT),
      W(left, iy - 50, 1, -30),
      W(left, topY + 36, 1, -35),
      W(sl + 40, topY, 1, 14),
      W(cx, topY, 0, 0),
      W(sl + sw - 40, topY, -1, -14),
      W(right, topY + 36, -1, -35),
      W(right, iy - 50, -1, -30),
      W(p2.x, p2.y, -1, 0),
    ]);
    // 3) right of the message field: "you can message from here"
    hold(5400, 8000, p2, -1, "ease-in");
    // 4) go around the bottom of the chat box back to the left side
    walk(8000, T, [
      W(p2.x, p2.y, -1),
      W(right, botY - 6, -1, 12),
      W(sl + sw - 40, botY, -1, 12),
      W(cx, botY, 0, 0),
      W(sl + 40, botY, 1, -12),
      W(left, botY - 6, 1, -12),
      W(p1.x, p1.y, 1, LEFT_TILT),
    ]);
    push(T, p1.x, p1.y, 1, 0, "linear", LEFT_TILT);
    // Park the hand at its first position right away (before the animation starts).
    hand.style.transform = tf(p1.x, p1.y, 1, 0, LEFT_TILT);

    const animations: Animation[] = [
      hand.animate(frames, { duration: T, iterations: Infinity }),
    ];

    const fade = (
      el: HTMLSpanElement | null,
      stops: Array<[number, number]>,
    ) => {
      if (!el) return;
      animations.push(
        el.animate(
          stops.map(([t, o]) => ({ offset: t / T, opacity: o })),
          { duration: T, iterations: Infinity },
        ),
      );
    };
    fade(labelRefs.current[0], [
      [0, 1],
      [1900, 1],
      [2300, 0],
      [10300, 0],
      [T, 1],
    ]);
    fade(labelRefs.current[1], [
      [0, 0],
      [5200, 0],
      [5700, 1],
      [7700, 1],
      [8100, 0],
      [T, 0],
    ]);

    return () => animations.forEach((anim) => anim.cancel());
  }, [layout, gone]);

  if (gone) return null;

  const labelClass =
    "absolute whitespace-nowrap rounded-full bg-[#F2B93B] px-2.5 py-1 text-[11px] font-bold leading-none text-[#0F2250] opacity-0 shadow-sm";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 hidden fit:block"
      style={{
        opacity: dismissed || !ready ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      {layout && (
        <>
          <span
            ref={(el) => {
              labelRefs.current[0] = el;
            }}
            className={labelClass}
            style={{
              left: layout.il - 6,
              top: layout.iy - 31,
              transform: "translate(-100%, -100%)",
            }}
          >
            এখানে ক্লিক করে চ্যাট করুন
          </span>
          <span
            ref={(el) => {
              labelRefs.current[1] = el;
            }}
            className={labelClass}
            style={{
              left: layout.ir + 6,
              top: layout.iy - 31,
              transform: "translate(0, -100%)",
            }}
          >
            এখান থেকে মেসেজ করতে পারবেন
          </span>
        </>
      )}
      <div
        ref={handRef}
        className="absolute left-0 top-0"
        style={{ width: 104, height: 69, transformOrigin: "102px 25px" }}
      >
        <svg
          viewBox="0 0 100 66"
          width={104}
          height={69}
          className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]"
          fill="none"
        >
          <g fill="#FFCB8E" stroke="#D99A5E" strokeWidth="1.4">
            {/* back of the hand */}
            <rect x="14" y="17" width="42" height="43" rx="15" />
            {/* curled fingers: middle, ring, little */}
            <rect x="38" y="31" width="31" height="11" rx="5.5" />
            <rect x="38" y="41.5" width="28" height="11" rx="5.5" />
            <rect x="38" y="52" width="23" height="10" rx="5" />
            {/* index finger, pointing at the chat */}
            <rect x="40" y="17" width="58" height="13" rx="6.5" />
            {/* thumb on top */}
            <rect
              x="22"
              y="6"
              width="30"
              height="13"
              rx="6.5"
              transform="rotate(-8 37 12)"
            />
          </g>
          {/* nail */}
          <rect
            x="87"
            y="19.5"
            width="9"
            height="7.5"
            rx="3.5"
            fill="#FFE6CC"
          />
          {/* knuckle lines */}
          <g stroke="#E8AE72" strokeWidth="1.1" strokeLinecap="round">
            <path d="M60 33.5h4M57 44h4M52 54.5h4" />
          </g>
          {/* sleeve cuff */}
          <rect
            x="2"
            y="20"
            width="14"
            height="38"
            rx="3.5"
            fill="#2563EB"
            stroke="#1D4ED8"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}

export default function UserAdminChat() {
  // The conversation stays visible inside the dashboard banner; users do not need to
  // discover or open a separate modal before they can start typing.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const messageHistoryInitializedRef = useRef(false);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [olderLoading, setOlderLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);
  // Refs + flag for the pointing-hand guide; it disappears once the user touches the chat.
  const chatRootRef = useRef<HTMLDivElement | null>(null);
  const chatSectionRef = useRef<HTMLElement | null>(null);
  const chatInputWrapRef = useRef<HTMLDivElement | null>(null);
  const [chatTouched, setChatTouched] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // After the user touches the chat the hand disappears; if they then leave the chat idle
  // (not focused, nothing typed) for HAND_RETURN_DELAY_MS, the hand comes back to guide them again.
  useEffect(() => {
    if (!chatTouched || inputFocused || draft.trim()) return;
    const timer = window.setTimeout(
      () => setChatTouched(false),
      HAND_RETURN_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [chatTouched, inputFocused, draft]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/chat?summary=1", {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      if (!response.ok) return;
      const data = await response.json();
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch {
      // The inline composer remains usable if a background summary refresh fails.
    }
  }, []);

  const loadMessages = useCallback(
    async (options?: { before?: string; silent?: boolean }) => {
      if (!options?.silent && !options?.before) setLoading(true);
      if (options?.before) setOlderLoading(true);
      try {
        const query = options?.before
          ? `?before=${encodeURIComponent(options.before)}`
          : "";
        const response = await fetch(`/api/chat${query}`, {
          credentials: "include",
          cache: "no-store",
          headers: getClientAuthHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data?.message || "Could not load chat messages.");

        const incoming: ChatMessage[] = Array.isArray(data?.messages)
          ? data.messages
          : [];
        if (options?.before) {
          for (const message of incoming) knownMessageIdsRef.current.add(message.id);
          setMessages((current) => mergeMessages(incoming, current));
        } else {
          const newlyReceivedAdminMessage = options?.silent && messageHistoryInitializedRef.current
            ? incoming.find(
                (message) =>
                  message.senderRole === "admin" &&
                  !knownMessageIdsRef.current.has(message.id),
              )
            : undefined;
          if (newlyReceivedAdminMessage && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("sohoj-support-message", {
                detail: { messageId: newlyReceivedAdminMessage.id },
              }),
            );
          }
          for (const message of incoming) knownMessageIdsRef.current.add(message.id);
          messageHistoryInitializedRef.current = true;
          setMessages((current) => {
            if (
              options?.silent &&
              incoming.some(
                (message) => !current.some((item) => item.id === message.id),
              )
            ) {
              shouldScrollRef.current = true;
            }
            return mergeMessages(current, incoming);
          });
        }
        if (!options?.silent) setHasMore(Boolean(data?.hasMore));
        setUnreadCount(Number(data?.unreadCount || 0));
        setError("");
        if (!options?.before) shouldScrollRef.current = true;
      } catch (cause) {
        if (!options?.silent) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load chat messages.",
          );
        }
      } finally {
        setLoading(false);
        setOlderLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadMessages();
    void loadSummary();

    // Keep the inline conversation fresh so an admin reply appears without a page reload.
    const messageInterval = window.setInterval(
      () => void loadMessages({ silent: true }),
      5_000,
    );
    const summaryInterval = window.setInterval(
      () => void loadSummary(),
      15_000,
    );
    return () => {
      window.clearInterval(messageInterval);
      window.clearInterval(summaryInterval);
    };
  }, [loadMessages, loadSummary]);

  useEffect(() => {
    if (!shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...getClientAuthHeaders(),
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data?.message || "Your message could not be sent.");
      if (data?.message) {
        setMessages((current) =>
          mergeMessages(current, [data.message as ChatMessage]),
        );
        shouldScrollRef.current = true;
      }
      setDraft("");
      setUnreadCount(0);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your message could not be sent.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      ref={chatRootRef}
      className="relative flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-2.5 md:max-w-[350px] fit:max-w-[350px]"
    >
      <PointingHand
        containerRef={chatRootRef}
        sectionRef={chatSectionRef}
        inputRef={chatInputWrapRef}
        dismissed={chatTouched}
      />
      {/* Always-visible animated help notice: this makes the support feature obvious. */}
      <div className="flex w-full items-center gap-2 rounded-lg border border-[#F2B93B]/35 bg-[#F2B93B]/10 px-3 py-2 shadow-sm">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F2B93B] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F2B93B]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold leading-snug text-white sm:text-xs">
            যেকোনো সমস্যায় অ্যাডমিনের সাথে কথা বলুন
          </span>
          <span className="mt-0.5 block text-[10px] leading-snug text-[#C8D5F0]">
            Need help? Chat with our admin anytime.
          </span>
        </span>
        <MessageCircle
          size={16}
          className="shrink-0 text-[#F2B93B] animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Inline chatbox — always open, with the message field visible immediately. */}
      <section
        ref={chatSectionRef}
        onPointerDown={() => setChatTouched(true)}
        aria-labelledby="user-admin-chat-title"
        className="flex h-[282px] w-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/25 bg-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.35)] sm:h-[294px] fit:h-[300px]"
      >
        <header className="flex shrink-0 items-center gap-2.5 border-b border-slate-200 bg-white px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 ring-1 ring-inset ring-indigo-100">
            <img
              src={ADMIN_PROFILE_IMAGE_URL}
              alt="Admin profile"
              className="h-full w-full object-cover object-[center_24%]"
              referrerPolicy="no-referrer"
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="user-admin-chat-title"
              className="text-xs font-bold text-slate-900 sm:text-sm"
            >
              অ্যাডমিন সাপোর্ট · Chat with Admin
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500 sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              আপনার মেসেজ এখানেই পাঠান
            </p>
          </div>
          {unreadCount > 0 && (
            <span
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white"
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </header>

        <div
          ref={messagesViewportRef}
          className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-2.5"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {hasMore && messages.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={olderLoading}
                onClick={() =>
                  void loadMessages({ before: messages[0]?.createdAt })
                }
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                {olderLoading ? (
                  <LoaderCircle size={11} className="animate-spin" />
                ) : (
                  <ChevronUp size={11} />
                )}
                আগের মেসেজ
              </button>
            </div>
          )}

          {loading && messages.length === 0 ? (
            <div className="flex h-full min-h-[105px] items-center justify-center gap-2 text-xs text-slate-500">
              <LoaderCircle size={15} className="animate-spin" /> Chat লোড
              হচ্ছে…
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              const mine = message.senderRole === "user";
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-2.5 py-1.5 shadow-sm ${mine ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"}`}
                  >
                    <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed sm:text-xs">
                      {message.text}
                    </p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] ${mine ? "text-indigo-100" : "text-slate-400"}`}
                    >
                      <span>{timeLabel(message.createdAt)}</span>
                      {mine && (
                        <span>
                          {message.readByAdmin ? "✓✓ Seen" : "✓ Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full min-h-[105px] flex-col items-center justify-center px-2 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                <MessageCircle size={17} />
              </span>
              <p className="mt-2 text-[11px] font-semibold text-slate-800 sm:text-xs">
                কীভাবে সাহায্য করতে পারি?
              </p>
              <p className="mt-1 max-w-[250px] text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                আপনার সমস্যা বা প্রশ্ন নিচে লিখে সরাসরি অ্যাডমিনকে পাঠান।
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p
            role="alert"
            className="shrink-0 border-t border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] text-rose-700"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={sendMessage}
          className="shrink-0 border-t border-slate-200 bg-white p-2"
        >
          <div
            ref={chatInputWrapRef}
            className="flex items-end gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10"
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={() => {
                setChatTouched(true);
                setInputFocused(true);
              }}
              onBlur={() => setInputFocused(false)}
              maxLength={2000}
              rows={1}
              placeholder="এখানে মেসেজ লিখুন…"
              aria-label="Message to admin"
              className="max-h-16 min-h-[34px] flex-1 resize-y bg-transparent px-1.5 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              className="flex h-8 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between px-1 text-[9px] text-slate-400">
            <span>Enter চাপলে মেসেজ যাবে</span>
            <span>{draft.length}/2000</span>
          </div>
        </form>
      </section>
    </div>
  );
}
