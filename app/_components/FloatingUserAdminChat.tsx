"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import {
  CheckCheck,
  Headphones,
  LoaderCircle,
  MessageCircle,
  Minus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { fetchAuthMe, getClientAuthHeaders } from "@/lib/clientAuth";
import { CHAT_IDLE_CLOSE_MS, CHAT_OPEN_POLL_MS, CHAT_PRESENCE_REFRESH_MS } from "@/lib/presenceConstants";
import { announceChatOpen } from "@/app/_lib/chatPresence";
import AdminAvatarImage from "./AdminAvatarImage";
import BrandName from "@/app/_components/BrandName";
import {
  ChatDropOverlay,
  ChatImageBubble,
  ChatImagePicker,
  prepareImageForChat,
  stampImageDeadlines,
  uploadChatImage,
  useImageDrop,
  useImageExpiry,
  type ChatImageInfo,
} from "@/app/_components/chatImage";

type ChatMessage = {
  id: string;
  text: string;
  senderRole: "user" | "admin";
  createdAt: string;
  readByAdmin: boolean;
  readByUser: boolean;
  image?: ChatImageInfo;
};

type ApiResponse = {
  success?: boolean;
  message?: string | ChatMessage;
  messages?: ChatMessage[];
  unreadCount?: number;
  hasMore?: boolean;
  user?: { role?: string };
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

function isRestrictedPath(pathname: string | null) {
  if (!pathname) return true;
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/login-success" ||
    pathname.startsWith("/ai-editor/mobile-upload/")
  );
}

const CHAT_POSITION_KEY = "sebalagbe:admin-chat-launcher-position";
const CHAT_EDGE_GAP = 8;
const CHAT_DRAG_THRESHOLD = 5;

type LauncherPosition = { x: number; y: number };
type LauncherRect = { left: number; top: number; right: number; bottom: number };

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

// ---- Bouncy magic-ball launcher ----
const BALL_SIZE = 68;
const BALL_RADIUS = BALL_SIZE / 2;
const BALL_MAX_SPEED = 6000; // px per second
const BALL_STOP_SPEED = 30; // below this the ball is at rest
const BALL_FRICTION = 0.8; // travel distance is about throw speed / this, so a harder throw goes farther
const BALL_THROW_MIN_SPEED = 260; // slower releases just drop the ball where it is
const WALL_BOUNCE = 0.9;
const CONTENT_BOUNCE = 0.92;
// The thrown ball bounces off page content too (set to false to only bounce off the screen edges).
const BALL_HITS_CONTENT = true;
// While flying the ball hops up and down like a real bouncy ball.
const BALL_HOP_LENGTH = 150; // px travelled per hop
const BALL_HOP_MAX = 36; // px, highest hop (fast throws)
// Things on the page the ball can bump into while it rolls.
const BALL_SOLID_SELECTOR =
  "a[href],button,input,select,textarea,img,video,canvas,h1,h2,h3,h4,p,label,summary,[role='button'],[data-ball-solid]";

type BallSolid = { el: Element; left: number; top: number; right: number; bottom: number };

// The visible area WITHOUT the scrollbar. window.innerWidth includes the scrollbar, which is
// what let the old button slide underneath it and get squeezed/broken at the right edge.
function getViewportSize() {
  const doc = document.documentElement;
  return {
    w: doc.clientWidth || window.innerWidth,
    h: Math.min(doc.clientHeight || window.innerHeight, window.innerHeight),
  };
}


export default function FloatingUserAdminChat() {
  const pathname = usePathname();
  const [eligible, setEligible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [chatNotice, setChatNotice] = useState("");
  const [clearingChat, setClearingChat] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [noticeText, setNoticeText] = useState("অ্যাডমিনের নতুন মেসেজ এসেছে");

  const isOpenRef = useRef(false);
  const lastActivityRef = useRef(0);
  const lastPresenceRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const messageHistoryInitializedRef = useRef(false);
  const lastUnreadCountRef = useRef<number | null>(null);
  const lastNoticeAtRef = useRef(0);
  const notificationTimerRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);
  const playDingRef = useRef<() => void>(() => undefined);

  isOpenRef.current = isOpen;

  // ---- Movable launcher: the user can drag the button anywhere on the page (it can't be removed). ----
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    caught: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [launcherPos, setLauncherPos] = useState<LauncherPosition | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [anchor, setAnchor] = useState<LauncherRect | null>(null);
  const [draggingLauncher, setDraggingLauncher] = useState(false);
  const squashRef = useRef<HTMLSpanElement | null>(null);
  const hopRef = useRef<HTMLSpanElement | null>(null);
  const spinRef = useRef<HTMLSpanElement | null>(null);
  const motionRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<{ t: number; x: number; y: number }[]>([]);
  const anchorTickRef = useRef(0);
  const lastSquashRef = useRef(0);
  const anchorNeededRef = useRef(false);
  anchorNeededRef.current = isOpen || showNotice;

  const clampLauncher = useCallback((x: number, y: number): LauncherPosition => {
    const { w, h } = getViewportSize();
    return {
      x: clampNumber(x, CHAT_EDGE_GAP, w - BALL_SIZE - CHAT_EDGE_GAP),
      y: clampNumber(y, CHAT_EDGE_GAP, h - BALL_SIZE - CHAT_EDGE_GAP),
    };
  }, []);

  useEffect(() => {
    const syncViewport = () => setViewport(getViewportSize());
    syncViewport();
    try {
      const saved = JSON.parse(window.localStorage.getItem(CHAT_POSITION_KEY) || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        setLauncherPos({ x: saved.x, y: saved.y });
      }
    } catch {
      // Saved position is only a convenience.
    }
    const onResize = () => {
      syncViewport();
      setLauncherPos((current) => (current ? clampLauncher(current.x, current.y) : current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampLauncher]);

  // Keep the saved position inside the screen once the button has been measured.
  useEffect(() => {
    if (!eligible || !launcherPos || !launcherRef.current) return;
    const next = clampLauncher(launcherPos.x, launcherPos.y);
    if (next.x !== launcherPos.x || next.y !== launcherPos.y) setLauncherPos(next);
  }, [eligible, launcherPos, clampLauncher]);

  // The chat panel and the new-message notice are placed next to wherever the button is.
  useEffect(() => {
    if (!eligible || !launcherPos || !launcherRef.current) {
      setAnchor(null);
      return;
    }
    const rect = launcherRef.current.getBoundingClientRect();
    setAnchor({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
  }, [eligible, launcherPos, viewport, isOpen, unreadCount]);

  // Moves the ball by writing straight to the DOM (no React re-render per frame).
  const placeBall = useCallback((x: number, y: number) => {
    const motion = motionRef.current;
    motion.x = x;
    motion.y = y;
    const el = launcherRef.current;
    if (el) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
    // The chat panel / notice follow the ball, a few times per second is plenty.
    if (anchorNeededRef.current) {
      const now = performance.now();
      if (now - anchorTickRef.current > 70) {
        anchorTickRef.current = now;
        setAnchor({ left: x, top: y, right: x + BALL_SIZE, bottom: y + BALL_SIZE });
      }
    }
  }, []);

  // The ball turns as it moves, like it is really rolling.
  const spinBall = useCallback((dx: number, dy: number) => {
    const motion = motionRef.current;
    motion.angle += ((dx + dy * 0.3) / BALL_RADIUS) * (180 / Math.PI);
    if (spinRef.current) spinRef.current.style.transform = `rotate(${motion.angle}deg)`;
  }, []);

  // A little squash when the ball hits something.
  const squashBall = useCallback((speed: number, nx: number, ny: number) => {
    const el = squashRef.current;
    const now = performance.now();
    if (!el || speed < 90 || now - lastSquashRef.current < 140) return;
    lastSquashRef.current = now;
    const k = Math.min(0.32, 0.08 + speed / 4000);
    el.style.transition = "transform 60ms ease-out";
    el.style.transform =
      Math.abs(nx) > Math.abs(ny)
        ? `scale(${1 - k}, ${1 + k * 0.6})`
        : `scale(${1 + k * 0.6}, ${1 - k})`;
    window.setTimeout(() => {
      el.style.transition = "transform 260ms cubic-bezier(0.34, 1.7, 0.5, 1)";
      el.style.transform = "scale(1, 1)";
    }, 60);
  }, []);

  // Saves where the ball ended up (React state + localStorage).
  const commitLauncher = useCallback(() => {
    const next = clampLauncher(motionRef.current.x, motionRef.current.y);
    placeBall(next.x, next.y);
    setLauncherPos(next);
    try {
      window.localStorage.setItem(CHAT_POSITION_KEY, JSON.stringify(next));
    } catch {
      // Saving is optional.
    }
  }, [clampLauncher, placeBall]);

  const collectSolids = useCallback((): BallSolid[] => {
    const { w, h } = getViewportSize();
    const nodes = document.querySelectorAll(BALL_SOLID_SELECTOR);
    const out: BallSolid[] = [];
    for (let i = 0; i < nodes.length && out.length < 400; i += 1) {
      const el = nodes[i];
      if (el.closest("[data-admin-chat-ui]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      if (r.right <= 0 || r.bottom <= 0 || r.left >= w || r.top >= h) continue;
      if (r.width > w * 0.85 && r.height > h * 0.6) continue;
      const cs = window.getComputedStyle(el);
      if (
        cs.visibility === "hidden" ||
        cs.display === "none" ||
        cs.pointerEvents === "none" ||
        Number(cs.opacity) < 0.05
      ) {
        continue;
      }
      out.push({ el, left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
    return out;
  }, []);

  const resetHop = useCallback(() => {
    const el = hopRef.current;
    if (el) {
      el.style.transform = "";
      el.style.animation = "";
    }
  }, []);

  // The ball keeps rolling after a throw: slows down, bounces off the screen edges and off content.
  const startGlide = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const motion = motionRef.current;
    let solids = BALL_HITS_CONTENT ? collectSolids() : [];
    let solidsAt = performance.now();
    // Content the ball is already sitting on top of is ignored until it moves clear of it.
    const ignored = new Set<Element>();
    for (const solid of solids) {
      const cx = motion.x + BALL_RADIUS;
      const cy = motion.y + BALL_RADIUS;
      const nx = clampNumber(cx, solid.left, solid.right);
      const ny = clampNumber(cy, solid.top, solid.bottom);
      if ((cx - nx) ** 2 + (cy - ny) ** 2 < BALL_RADIUS ** 2) ignored.add(solid.el);
    }
    let last = performance.now();
    let travelled = 0;
    if (hopRef.current) hopRef.current.style.animation = "none";

    const tick = (now: number) => {
      if (!launcherRef.current) {
        rafRef.current = null;
        return;
      }
      const frame = Math.max(0, Math.min((now - last) / 1000, 0.034));
      last = now;
      if (BALL_HITS_CONTENT && now - solidsAt > 140) {
        solids = collectSolids();
        solidsAt = now;
      }
      const { w, h } = getViewportSize();
      const minX = CHAT_EDGE_GAP;
      const maxX = w - BALL_SIZE - CHAT_EDGE_GAP;
      const minY = CHAT_EDGE_GAP;
      const maxY = h - BALL_SIZE - CHAT_EDGE_GAP;

      const speed = Math.hypot(motion.vx, motion.vy);
      const steps = Math.max(1, Math.ceil((speed * frame) / 10));
      const dt = frame / steps;
      let hitSpeed = 0;
      let hitNx = 0;
      let hitNy = 0;
      const startX = motion.x;
      const startY = motion.y;

      for (let i = 0; i < steps; i += 1) {
        let x = motion.x + motion.vx * dt;
        let y = motion.y + motion.vy * dt;

        // Screen edges (the scrollbar side included).
        if (x < minX) {
          x = minX;
          if (motion.vx < 0) {
            if (-motion.vx > hitSpeed) {
              hitSpeed = -motion.vx;
              hitNx = 1;
              hitNy = 0;
            }
            motion.vx = -motion.vx * WALL_BOUNCE;
          }
        } else if (x > maxX) {
          x = maxX;
          if (motion.vx > 0) {
            if (motion.vx > hitSpeed) {
              hitSpeed = motion.vx;
              hitNx = -1;
              hitNy = 0;
            }
            motion.vx = -motion.vx * WALL_BOUNCE;
          }
        }
        if (y < minY) {
          y = minY;
          if (motion.vy < 0) {
            if (-motion.vy > hitSpeed) {
              hitSpeed = -motion.vy;
              hitNx = 0;
              hitNy = 1;
            }
            motion.vy = -motion.vy * WALL_BOUNCE;
          }
        } else if (y > maxY) {
          y = maxY;
          if (motion.vy > 0) {
            if (motion.vy > hitSpeed) {
              hitSpeed = motion.vy;
              hitNx = 0;
              hitNy = -1;
            }
            motion.vy = -motion.vy * WALL_BOUNCE;
          }
        }

        // Page content.
        const cx = x + BALL_RADIUS;
        const cy = y + BALL_RADIUS;
        let pushX = 0;
        let pushY = 0;
        for (const solid of solids) {
          const nearX = clampNumber(cx, solid.left, solid.right);
          const nearY = clampNumber(cy, solid.top, solid.bottom);
          const dx = cx + pushX - nearX;
          const dy = cy + pushY - nearY;
          const d2 = dx * dx + dy * dy;
          if (d2 >= BALL_RADIUS * BALL_RADIUS) {
            ignored.delete(solid.el);
            continue;
          }
          if (ignored.has(solid.el)) continue;
          if (d2 === 0) {
            ignored.add(solid.el);
            continue;
          }
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          pushX += nx * (BALL_RADIUS - d);
          pushY += ny * (BALL_RADIUS - d);
          const vn = motion.vx * nx + motion.vy * ny;
          if (vn < 0) {
            motion.vx -= (1 + CONTENT_BOUNCE) * vn * nx;
            motion.vy -= (1 + CONTENT_BOUNCE) * vn * ny;
            if (-vn > hitSpeed) {
              hitSpeed = -vn;
              hitNx = nx;
              hitNy = ny;
            }
          }
        }
        motion.x = clampNumber(x + pushX, minX, maxX);
        motion.y = clampNumber(y + pushY, minY, maxY);
      }

      spinBall(motion.x - startX, motion.y - startY);
      placeBall(motion.x, motion.y);
      if (hitSpeed > 0) squashBall(hitSpeed, hitNx, hitNy);

      travelled += Math.hypot(motion.x - startX, motion.y - startY);
      const hopHeight =
        Math.abs(Math.sin((travelled / BALL_HOP_LENGTH) * Math.PI)) *
        Math.min(BALL_HOP_MAX, Math.hypot(motion.vx, motion.vy) * 0.03);
      if (hopRef.current) hopRef.current.style.transform = `translateY(${-hopHeight}px)`;

      const friction = Math.exp(-BALL_FRICTION * frame);
      motion.vx *= friction;
      motion.vy *= friction;

      if (Math.hypot(motion.vx, motion.vy) < BALL_STOP_SPEED) {
        rafRef.current = null;
        resetHop();
        commitLauncher();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [collectSolids, commitLauncher, placeBall, resetHop, spinBall, squashBall]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const handleLauncherPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();

    // Grabbing a rolling ball stops it (and shouldn't count as a click that opens the chat).
    const caught = rafRef.current !== null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    resetHop();
    const motion = motionRef.current;
    motion.x = rect.left;
    motion.y = rect.top;
    motion.vx = 0;
    motion.vy = 0;
    // From now on the ball is positioned with left/top (not the default bottom/right).
    setLauncherPos((current) => current ?? { x: rect.left, y: rect.top });

    samplesRef.current = [{ t: performance.now(), x: rect.left, y: rect.top }];
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
      caught,
    };
  };

  const handleLauncherPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < CHAT_DRAG_THRESHOLD) return;
      drag.moved = true;
      setDraggingLauncher(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture is best effort.
      }
    }
    const next = clampLauncher(drag.originX + dx, drag.originY + dy);
    const motion = motionRef.current;
    spinBall(next.x - motion.x, next.y - motion.y);
    placeBall(next.x, next.y);

    const now = performance.now();
    const samples = samplesRef.current;
    samples.push({ t: now, x: next.x, y: next.y });
    while (samples.length > 2 && now - samples[0].t > 120) samples.shift();
  };

  const finishLauncherDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) {
      if (drag.caught) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        commitLauncher();
      }
      return;
    }
    // A drag must not also count as a click (that would open/close the chat).
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    setDraggingLauncher(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }

    // How fast was the ball moving when it was let go? Fast = it gets kicked and rolls away.
    const now = performance.now();
    const recent = samplesRef.current.filter((sample) => now - sample.t <= 100);
    let vx = 0;
    let vy = 0;
    if (recent.length >= 2) {
      const first = recent[0];
      const lastSample = recent[recent.length - 1];
      const seconds = (lastSample.t - first.t) / 1000;
      if (seconds > 0.008 && now - lastSample.t < 70) {
        vx = (lastSample.x - first.x) / seconds;
        vy = (lastSample.y - first.y) / seconds;
      }
    }
    const speed = Math.hypot(vx, vy);
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || speed < BALL_THROW_MIN_SPEED) {
      commitLauncher();
      return;
    }
    const scale = speed > BALL_MAX_SPEED ? BALL_MAX_SPEED / speed : 1;
    motionRef.current.vx = vx * scale;
    motionRef.current.vy = vy * scale;
    startGlide();
  };

  const handleLauncherClick = () => {
    if (suppressClickRef.current) return;
    if (isOpen) closeChat();
    else openChat();
  };

  // Where the panel / notice sit once the user has moved the button.
  const anchored = Boolean(launcherPos && anchor && viewport.w > 0);
  const opensDownward = anchored && anchor ? (anchor.top + anchor.bottom) / 2 < viewport.h / 2 : false;
  const panelWidth = Math.min(380, viewport.w - 24);
  const anchoredPanelStyle: CSSProperties | undefined =
    anchored && anchor
      ? opensDownward
        ? {
            left: clampNumber(anchor.right - panelWidth, 12, viewport.w - panelWidth - 12),
            top: anchor.bottom + 12,
            width: panelWidth,
            height: Math.max(260, Math.min(560, viewport.h - anchor.bottom - 24)),
          }
        : {
            left: clampNumber(anchor.right - panelWidth, 12, viewport.w - panelWidth - 12),
            bottom: viewport.h - anchor.top + 12,
            width: panelWidth,
            height: Math.max(260, Math.min(560, anchor.top - 24)),
          }
      : undefined;
  const anchoredNoticeStyle: CSSProperties | undefined =
    anchored && anchor
      ? opensDownward
        ? { right: Math.max(12, viewport.w - anchor.right), top: anchor.bottom + 12 }
        : { right: Math.max(12, viewport.w - anchor.right), bottom: viewport.h - anchor.top + 12 }
      : undefined;

  const playDing = useCallback(() => {
    const context = audioContextRef.current;
    if (!soundEnabledRef.current || !context) return;
    if (context.state === "suspended") void context.resume().catch(() => undefined);

    const playTone = (frequency: number, startAt: number, duration: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.72, startAt + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.025);
    };

    const now = context.currentTime;
    try {
      playTone(784, now, 0.14);
      playTone(1046, now + 0.12, 0.2);
    } catch {
      // Sound is a convenience; never let an audio restriction affect chat delivery.
    }
  }, []);
  playDingRef.current = playDing;

  const clearNoticeTimer = useCallback(() => {
    if (notificationTimerRef.current !== null) {
      window.clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

  const notifyIncoming = useCallback(() => {
    if (isOpenRef.current) return;
    const now = Date.now();
    // The inline dashboard chat and the floating chat can observe the same message.
    // Keep a single sound/toast if both report it at nearly the same time.
    if (now - lastNoticeAtRef.current < 1800) return;
    lastNoticeAtRef.current = now;
    setNoticeText("অ্যাডমিনের নতুন মেসেজ এসেছে");
    setShowNotice(true);
    playDingRef.current();
    clearNoticeTimer();
    notificationTimerRef.current = window.setTimeout(() => {
      setShowNotice(false);
      notificationTimerRef.current = null;
    }, 6500);
  }, [clearNoticeTimer]);

  // The chat is available on every regular user page, but never in the admin
  // workspace, authentication screens, or token-only mobile upload screen.
  useEffect(() => {
    if (isRestrictedPath(pathname)) {
      setEligible(false);
      setIsOpen(false);
      return;
    }

    let active = true;
    void fetchAuthMe()
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        if (!active) return;
        setEligible(response.ok && data?.user?.role === "user");
        if (!response.ok || data?.user?.role !== "user") setIsOpen(false);
      })
      .catch(() => {
        if (active) setEligible(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  // Arm Web Audio on the user's first interaction. Browsers block unsolicited sound
  // before activation, so notification sound is safely enabled only after a gesture.
  useEffect(() => {
    if (!eligible) return;
    const armSound = () => {
      try {
        const audioWindow = window as Window & {
          webkitAudioContext?: typeof AudioContext;
        };
        const AudioContextConstructor =
          window.AudioContext || audioWindow.webkitAudioContext;
        if (!AudioContextConstructor) return;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextConstructor();
        }
        soundEnabledRef.current = true;
        if (audioContextRef.current.state === "suspended") {
          void audioContextRef.current.resume().catch(() => undefined);
        }
      } catch {
        // Unsupported audio must not disable the chat itself.
      }
    };
    window.addEventListener("pointerdown", armSound, {
      once: true,
      capture: true,
    });
    window.addEventListener("keydown", armSound, {
      once: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("pointerdown", armSound, true);
      window.removeEventListener("keydown", armSound, true);
    };
  }, [eligible]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/chat?summary=1", {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      if (response.status === 401 || response.status === 403) {
        setEligible(false);
        setIsOpen(false);
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as ApiResponse;
      const nextUnread = Math.max(0, Number(data?.unreadCount || 0));
      if (isOpenRef.current) {
        setUnreadCount(0);
        lastUnreadCountRef.current = 0;
        return;
      }

      const previousUnread = lastUnreadCountRef.current;
      setUnreadCount(nextUnread);
      lastUnreadCountRef.current = nextUnread;
      if (previousUnread === null) {
        if (nextUnread > 0) notifyIncoming();
      } else if (nextUnread > previousUnread) {
        notifyIncoming();
      }
    } catch {
      // A brief network failure should not hide the launcher or discard the draft.
    }
  }, [notifyIncoming]);

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
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        if (response.status === 401 || response.status === 403) {
          setEligible(false);
          setIsOpen(false);
          return;
        }
        if (!response.ok) {
          throw new Error(
            typeof data?.message === "string"
              ? data.message
              : "চ্যাটের মেসেজ লোড করা যায়নি।",
          );
        }

        const incoming = Array.isArray(data?.messages)
          ? stampImageDeadlines<ChatMessage>(data.messages)
          : [];
        if (options?.before) {
          for (const item of incoming) knownMessageIdsRef.current.add(item.id);
          const merged = mergeMessages(incoming, messagesRef.current);
          messagesRef.current = merged;
          setMessages(merged);
        } else {
          const newAdminMessage = options?.silent
            ? incoming.find(
                (item) =>
                  item.senderRole === "admin" &&
                  !knownMessageIdsRef.current.has(item.id),
              )
            : undefined;

          if (newAdminMessage && messageHistoryInitializedRef.current) {
            if (isOpenRef.current) {
              playDingRef.current();
            } else {
              notifyIncoming();
            }
          }

          for (const item of incoming) knownMessageIdsRef.current.add(item.id);
          const merged = mergeMessages(messagesRef.current, incoming);
          messagesRef.current = merged;
          setMessages(merged);
          messageHistoryInitializedRef.current = true;
          if (options?.silent && newAdminMessage) {
            // New messages should be visible immediately when the panel is open.
            setError("");
          }
        }

        const nextUnread = Math.max(0, Number(data?.unreadCount || 0));
        setUnreadCount(nextUnread);
        lastUnreadCountRef.current = nextUnread;
        if (!options?.silent) {
          setHasMore(Boolean(data?.hasMore));
          setError("");
        }
      } catch (cause) {
        if (!options?.silent) {
          setError(
            cause instanceof Error
              ? cause.message
              : "চ্যাটের মেসেজ লোড করা যায়নি।",
          );
        }
      } finally {
        setLoading(false);
        setOlderLoading(false);
      }
    },
    [notifyIncoming],
  );

  // No background polling. While the chat is closed we check the unread badge once
  // (when the page/chat becomes available). While it is open we make no requests
  // unless CHAT_OPEN_POLL_MS is set above 0.
  useEffect(() => {
    if (!eligible || isOpen) return;
    void loadSummary();
  }, [eligible, isOpen, loadSummary]);

  useEffect(() => {
    if (!eligible || !isOpen || CHAT_OPEN_POLL_MS <= 0) return;
    const messageTimer = window.setInterval(
      () => void loadMessages({ silent: true }),
      CHAT_OPEN_POLL_MS,
    );
    return () => window.clearInterval(messageTimer);
  }, [eligible, isOpen, loadMessages]);

  // Opening / using the chat counts as activity (user shows online). Re-announce at most
  // once a minute while in use. The chat closes itself after CHAT_IDLE_CLOSE_MS idle.
  useEffect(() => {
    if (!isOpen) return;
    const now = Date.now();
    lastActivityRef.current = now;
    lastPresenceRef.current = now;
    announceChatOpen();
    const idleTimer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= CHAT_IDLE_CLOSE_MS) {
        setIsOpen(false);
      }
    }, 5000);
    return () => window.clearInterval(idleTimer);
  }, [isOpen]);

  const markChatActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (now - lastPresenceRef.current >= CHAT_PRESENCE_REFRESH_MS) {
      lastPresenceRef.current = now;
      announceChatOpen();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages]);

  useEffect(() => {
    if (!eligible) return;
    const handleSupportMessage = () => {
      if (!isOpenRef.current) notifyIncoming();
    };
    window.addEventListener(
      "sohoj-support-message",
      handleSupportMessage as EventListener,
    );
    return () =>
      window.removeEventListener(
        "sohoj-support-message",
        handleSupportMessage as EventListener,
      );
  }, [eligible, notifyIncoming]);

  useEffect(
    () => () => {
      clearNoticeTimer();
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    },
    [clearNoticeTimer],
  );

  // Photos disappear from the screen after 2 minutes (the server deletes them at the same time).
  useImageExpiry(setMessages, (ids) => {
    messagesRef.current = messagesRef.current.filter((item) => !ids.includes(item.id));
  });

  const sendImage = async (file: File) => {
    if (uploading || sending || clearingChat) return;
    setUploading(true);
    setError("");
    setChatNotice("");
    try {
      const prepared = await prepareImageForChat(file);
      const message = await uploadChatImage<ChatMessage>("/api/chat/image", prepared);
      const merged = mergeMessages(messagesRef.current, [message]);
      messagesRef.current = merged;
      knownMessageIdsRef.current.add(message.id);
      setMessages(merged);
      setUnreadCount(0);
      lastUnreadCountRef.current = 0;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ছবি পাঠানো যায়নি।");
    } finally {
      setUploading(false);
    }
  };
  const { dragging, bind: dropBind } = useImageDrop(
    (file) => void sendImage(file),
    uploading || sending || clearingChat,
  );

  const openChat = () => {
    clearNoticeTimer();
    setShowNotice(false);
    setError("");
    setIsOpen(true);
    void loadMessages();
  };

  const closeChat = () => setIsOpen(false);

  const clearChatHistory = async () => {
    if (clearingChat || sending) return;
    if (!window.confirm("আপনি কি অ্যাডমিনের সঙ্গে সম্পূর্ণ চ্যাট হিস্ট্রি স্থায়ীভাবে ডিলিট করতে চান? আপনার ও অ্যাডমিনের সব মেসেজ ডাটাবেজ থেকেও মুছে যাবে। এই কাজ ফিরিয়ে নেওয়া যাবে না।")) return;

    setClearingChat(true);
    setError("");
    setChatNotice("");
    try {
      const response = await fetch("/api/chat", {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !data?.success) {
        throw new Error(typeof data?.message === "string" ? data.message : "চ্যাট হিস্ট্রি ডিলিট করা যায়নি।");
      }
      messagesRef.current = [];
      knownMessageIdsRef.current.clear();
      messageHistoryInitializedRef.current = true;
      lastUnreadCountRef.current = 0;
      setMessages([]);
      setHasMore(false);
      setUnreadCount(0);
      setChatNotice("আপনার চ্যাট হিস্ট্রি ডাটাবেজ থেকে ডিলিট হয়েছে।");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "চ্যাট হিস্ট্রি ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setClearingChat(false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    setChatNotice("");
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
      const data = (await response.json().catch(() => ({}))) as ApiResponse;
      if (response.status === 401 || response.status === 403) {
        setEligible(false);
        setIsOpen(false);
        return;
      }
      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "মেসেজ পাঠানো যায়নি। আবার চেষ্টা করুন।",
        );
      }
      const sentMessage =
        data?.message && typeof data.message === "object"
          ? (data.message as ChatMessage)
          : null;
      if (sentMessage) {
        const merged = mergeMessages(messagesRef.current, [sentMessage]);
        messagesRef.current = merged;
        knownMessageIdsRef.current.add(sentMessage.id);
        setMessages(merged);
      }
      setDraft("");
      setUnreadCount(0);
      lastUnreadCountRef.current = 0;
      markChatActivity();
      // One refresh per sent message, so any admin reply that arrived meanwhile shows up.
      void loadMessages({ silent: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "মেসেজ পাঠানো যায়নি। আবার চেষ্টা করুন।",
      );
    } finally {
      setSending(false);
    }
  };

  if (!eligible) return null;

  return (
    <>
      {showNotice && !isOpen && (
        <button
          type="button"
          onClick={openChat}
          data-admin-chat-ui
          style={anchoredNoticeStyle}
          className={`fixed ${anchoredNoticeStyle ? "" : "bottom-[88px] right-4"} z-[121] flex max-w-[min(340px,calc(100vw-32px))] items-center gap-3 rounded-2xl border border-rose-200 bg-white px-3.5 py-3 text-left shadow-[0_12px_36px_-10px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5`}
          aria-label="অ্যাডমিনের নতুন মেসেজ দেখুন"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <MessageCircle size={21} />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">
              নতুন মেসেজ!
            </span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {noticeText} · দেখতে ক্লিক করুন
            </span>
          </span>
          <span className="text-xs font-semibold text-rose-600">দেখুন</span>
        </button>
      )}

      {isOpen && (
        <section
          role="dialog"
          aria-label="অ্যাডমিন সাপোর্ট চ্যাট"
          aria-modal="false"
          data-admin-chat-ui
          onPointerDownCapture={markChatActivity}
          onKeyDownCapture={markChatActivity}
          {...dropBind}
          className={`fixed ${anchoredPanelStyle ? "" : "bottom-[88px] right-3 sm:right-5"} z-[120] flex max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_58px_-14px_rgba(15,23,42,0.48)]`}
          style={
            anchoredPanelStyle ?? {
              width: "min(380px, calc(100vw - 24px))",
              height: "min(560px, calc(100dvh - 112px))",
            }
          }
        >
          <header className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-rose-600 to-red-500 px-4 py-3.5 text-white">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-white/15">
              <AdminAvatarImage alt="Admin profile" className="h-full w-full object-cover object-[center_24%]" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-rose-600 bg-emerald-400" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                <BrandName accentClassName="text-white" /> · Admin Support
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-rose-50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                আপনার যেকোনো প্রশ্ন লিখুন
              </span>
            </span>
            <button
              type="button"
              onClick={() => void clearChatHistory()}
              disabled={clearingChat || sending}
              aria-label="চ্যাট হিস্ট্রি ডিলিট করুন"
              title="Delete chat history"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 text-[10px] font-semibold text-white/95 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {clearingChat ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
              <span>{clearingChat ? "মুছছে…" : "চ্যাট মুছুন"}</span>
            </button>
            <button
              type="button"
              onClick={closeChat}
              aria-label="চ্যাট মিনিমাইজ করুন"
              title="Minimize"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <Minus size={19} />
            </button>
            <button
              type="button"
              onClick={closeChat}
              aria-label="চ্যাট বন্ধ করুন"
              title="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex shrink-0 items-center gap-2 border-b border-rose-100 bg-rose-50/70 px-4 py-2 text-[11px] text-slate-600">
            <Headphones size={14} className="shrink-0 text-rose-600" />
            <span className="min-w-0 flex-1">
              অ্যাডমিনকে পাঠানো মেসেজ এখানেই দেখতে পারবেন
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount} নতুন
              </span>
            )}
          </div>

          {chatNotice && (
            <div role="status" className="shrink-0 border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-medium text-emerald-800">
              {chatNotice}
            </div>
          )}
          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F7F8FC] px-3.5 py-4 sm:px-4"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {olderLoading ? (
                    <LoaderCircle size={12} className="animate-spin" />
                  ) : null}
                  আগের মেসেজ দেখুন
                </button>
              </div>
            )}

            {loading && messages.length === 0 ? (
              <div className="flex h-full min-h-[140px] items-center justify-center gap-2 text-xs text-slate-500">
                <LoaderCircle size={17} className="animate-spin text-rose-500" />
                মেসেজ লোড হচ্ছে…
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => {
                const mine = message.senderRole === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {!mine && (
                      <span className="mr-2 mt-auto flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                        <AdminAvatarImage className="h-full w-full object-cover object-[center_24%]" />
                      </span>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}
                    >
                      {message.image ? (
                        <ChatImageBubble image={message.image} tone={mine ? "dark" : "light"} />
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                          {message.text}
                        </p>
                      )}
                      <div
                        className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}
                      >
                        <span>{timeLabel(message.createdAt)}</span>
                        {mine && (
                          <CheckCheck
                            size={12}
                            className={message.readByAdmin ? "text-sky-200" : "text-indigo-200"}
                            aria-label={message.readByAdmin ? "Seen by admin" : "Sent"}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-5 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm ring-1 ring-rose-100">
                  <MessageCircle size={26} />
                </span>
                <p className="mt-4 text-sm font-bold text-slate-800">
                  কীভাবে সাহায্য করতে পারি?
                </p>
                <p className="mt-1.5 max-w-[250px] text-xs leading-relaxed text-slate-500">
                  আপনার সমস্যা বা প্রশ্ন নিচে লিখে সরাসরি অ্যাডমিনকে পাঠান।
                </p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p
              role="alert"
              className="shrink-0 border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          <form
            onSubmit={sendMessage}
            className="shrink-0 border-t border-slate-200 bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-500/10">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={2000}
                rows={1}
                placeholder="আপনার মেসেজ লিখুন…"
                aria-label="Message to admin"
                className="max-h-24 min-h-[42px] flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <ChatImagePicker
                onFile={(file) => void sendImage(file)}
                uploading={uploading}
                disabled={sending || clearingChat}
                iconSize={17}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="মেসেজ পাঠান"
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span>Enter = পাঠান · ছবি ড্রপ/পেস্ট করুন (২ মিনিট থাকবে)</span>
              <span>{draft.length}/2000</span>
            </div>
            <p className="mt-1 px-1 text-[11px] leading-4 text-[#7A6A50]">
              আপনার মেসেজ সরাসরি অ্যাডমিন দেখবেন। শেষ মেসেজের ৩ দিন পর চ্যাট স্বয়ংক্রিয়ভাবে মুছে যায়।
            </p>
          </form>
          <ChatDropOverlay show={dragging} rounded="rounded-2xl" />
        </section>
      )}

      <style>{`
        @keyframes adminBallHop {
          0%, 82%, 100% { transform: translateY(0); }
          88% { transform: translateY(-9px); }
          94% { transform: translateY(0); }
          97% { transform: translateY(-3px); }
        }
        @keyframes adminBallHint {
          0% { opacity: 0; transform: translateY(4px); }
          8%, 88% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(4px); }
        }
        .admin-ball-hop { animation: adminBallHop 5.5s ease-in-out infinite; }
        .admin-ball-hint { animation: adminBallHint 7s ease 1.5s 1; }
        @media (prefers-reduced-motion: reduce) {
          .admin-ball-hop, .admin-ball-hint { animation: none; }
        }
      `}</style>
      <button
        type="button"
        ref={launcherRef}
        data-admin-chat-ui
        onClick={handleLauncherClick}
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={finishLauncherDrag}
        onPointerCancel={finishLauncherDrag}
        aria-label={isOpen ? "চ্যাট মিনিমাইজ করুন" : "অ্যাডমিন সাপোর্ট - অ্যাডমিনের সাথে চ্যাট করুন"}
        aria-expanded={isOpen}
        style={{
          width: BALL_SIZE,
          height: BALL_SIZE,
          touchAction: "none",
          ...(launcherPos ? { left: launcherPos.x, top: launcherPos.y } : {}),
        }}
        className={`${launcherPos ? "" : "bottom-4 right-4"} ${draggingLauncher ? "cursor-grabbing" : "cursor-grab"} group fixed z-[122] block shrink-0 select-none rounded-full p-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300`}
      >
        <span
          ref={hopRef}
          className={`${!isOpen && !draggingLauncher ? "admin-ball-hop" : ""} block h-full w-full`}
        >
          <span
            ref={squashRef}
            className="relative block h-full w-full rounded-full shadow-[0_12px_26px_-8px_rgba(15,23,42,0.6)]"
          >
            <span ref={spinRef} className="absolute inset-0 block overflow-hidden rounded-full">
              <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden="true">
                <defs>
                  <clipPath id="adminBallClip">
                    <circle cx="50" cy="50" r="50" />
                  </clipPath>
                </defs>
                <circle cx="50" cy="50" r="50" fill="#6366f1" />
                <g clipPath="url(#adminBallClip)" fill="none" strokeLinecap="round">
                  <path d="M-10 22 C 25 -4, 55 52, 110 18" stroke="#f472b6" strokeWidth="15" />
                  <path d="M-10 48 C 30 22, 60 78, 110 44" stroke="#fde047" strokeWidth="13" />
                  <path d="M-10 74 C 28 48, 62 104, 110 70" stroke="#22d3ee" strokeWidth="15" />
                  <path d="M-10 98 C 30 72, 64 126, 110 96" stroke="#a3e635" strokeWidth="13" />
                  <path d="M20 -10 C 0 30, 40 60, 22 110" stroke="#fb923c" strokeWidth="9" />
                  <path d="M78 -10 C 58 30, 98 60, 80 110" stroke="#c084fc" strokeWidth="9" />
                </g>
              </svg>
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.6), rgba(255,255,255,0) 38%, rgba(15,23,42,0.24) 100%)",
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-white ring-2 ring-white ${isOpen ? "bg-slate-800" : "bg-rose-600"}`}
              >
                {isOpen ? <Minus size={18} /> : <MessageCircle size={17} />}
              </span>
            </span>
            {!isOpen && unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[21px] min-w-[21px] items-center justify-center rounded-full border-2 border-rose-600 bg-white px-1 text-[10px] font-extrabold text-rose-600">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {!isOpen && unreadCount === 0 && (
              <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            )}
          </span>
        </span>
        {!isOpen && (
          <span
            className={`pointer-events-none absolute top-0 flex h-full items-center ${launcherPos && viewport.w > 0 && launcherPos.x < viewport.w / 2 ? "left-full pl-3" : "right-full pr-3"}`}
          >
            <span className="admin-ball-hint whitespace-nowrap rounded-xl bg-rose-600 px-3 py-1.5 text-left text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              <span className="block text-xs font-bold leading-tight">অ্যাডমিন সাপোর্ট</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-rose-50">
                মেসেজ করতে ক্লিক করুন
              </span>
            </span>
          </span>
        )}
      </button>
    </>
  );
}
